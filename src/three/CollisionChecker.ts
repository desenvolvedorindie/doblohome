import * as THREE from 'three';

/**
 * Resultado de uma colisão entre duas barras estruturais
 */
export interface CollisionResult {
  meshA: THREE.Object3D;
  meshB: THREE.Object3D;
  labelA: string;
  labelB: string;
  overlapVolumeM3: number;
  axisA: 'x' | 'y' | 'z';
  axisB: 'x' | 'y' | 'z';
}

/**
 * Resumo de uma verificação de colisão completa
 */
export interface CollisionSummary {
  totalBars: number;
  collidingBars: number;
  collisions: CollisionResult[];
  passedBars: number;
  errorCount: number;
}

/** Material de erro — vermelho emissivo pulsante */
const COLLISION_MAT = new THREE.MeshStandardMaterial({
  color: 0xef4444,
  emissive: new THREE.Color(0xef4444),
  emissiveIntensity: 0.80,
  roughness: 0.4,
  metalness: 0.3,
  transparent: false
});

/** Mapa barra → material original salvo */
const savedMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

/** Conjunto de barras atualmente marcadas como colisão */
const markedMeshes = new Set<THREE.Mesh>();

/**
 * Infere o eixo principal de uma barra a partir da sua Box3 no espaço mundo.
 * A maior dimensão determina o eixo de extrusão.
 */
function inferAxis(box: THREE.Box3): 'x' | 'y' | 'z' {
  const size = new THREE.Vector3();
  box.getSize(size);
  if (size.x >= size.y && size.x >= size.z) return 'x';
  if (size.z >= size.x && size.z >= size.y) return 'z';
  return 'y';
}

/**
 * Calcula o volume (m³) de interseção entre duas Box3.
 * Retorna 0 se não houver sobreposição real.
 */
function intersectionVolume(a: THREE.Box3, b: THREE.Box3): number {
  const ix = Math.max(0, Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x));
  const iy = Math.max(0, Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y));
  const iz = Math.max(0, Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z));
  return ix * iy * iz;
}


export const CollisionChecker = {

  /**
   * Executa a verificação de colisão em toda a cena.
   * Lógica:
   *   1. Coleta todos os meshes com `userData.isBar === true` que sejam visíveis.
   *   2. Computa o Box3 mundial de cada um, encolhendo 2.5 mm por face para eliminar
   *      falsos positivos de toque ponta-a-ponta entre barras perpendiculares.
   *   3. Realiza comparação O(n²) dos pares.
   *   4. Pares perpendiculares (eixos diferentes = juntas T/L) → ignorados.
   *   5. Pares paralelos sem sobreposição de Box3 → ignorados.
   *   6. Pares com centróides transversais co-localizados (≤ 20 mm) → montagem
   *      intencional (ex.: bandeja apoiada sobre longarina) → ignorados.
   *   7. Demais pares com volume de sobreposição > 0.5 cm³ = colisão real.
   * Retorna resumo e pinta os meshes colidentes em vermelho.
   *
   * NOTA: O sibling-check (mesmo pai direto) foi intencionalmente REMOVIDO.
   * Barras do mesmo frame builder (BaseRack, SolarTray, etc.) também devem ser
   * verificadas entre si — são elas que o usuário pode deslocar e causar colisão.
   * O filtro de co-localização de centróide cobre os falsos positivos estruturais.
   */
  checkAll(scene: THREE.Scene): CollisionSummary {
    // Limpa marcações anteriores
    this.clearAll();

    // ⚠️ Garante que todas as matrizes mundo estejam atualizadas antes de calcular Box3.
    // Sem isso, meshes filhos de grupos posicionados podem ter matrizes desatualizadas
    // e o setFromObject retorna bounding boxes incorretos (tamanho errado ou posição errada).
    scene.updateMatrixWorld(true);

    // — Coleta barras —
    const bars: Array<{
      mesh: THREE.Mesh;
      box: THREE.Box3;
      shrunkBox: THREE.Box3;
      center: THREE.Vector3;
      label: string;
      axis: 'x' | 'y' | 'z';
    }> = [];

    const SHRINK = 0.0025; // 2.5 mm por face

    scene.traverse((obj) => {
      if (!obj.userData?.isBar) return;
      if (!(obj as THREE.Mesh).isMesh) return;
      if (!obj.visible) return;
      if (obj.name === '__hitbox') return;

      const mesh = obj as THREE.Mesh;

      // Para alumínio: usa a hitbox BoxGeometry filha (geometria Box correta).
      // Para metalon: o próprio mesh já é BoxGeometry com eixo correto.
      // Em ambos os casos, calcula Box3 da GEOMETRIA transformada pela matriz mundo,
      // sem depender de filhos extras que possam estender o bounding box.
      let box: THREE.Box3;
      const hitChild = mesh.children.find(c => c.name === '__hitbox') as THREE.Mesh | undefined;

      if (hitChild) {
        // Calcula Box3 diretamente da geometria do hitbox aplicando sua matriz mundo.
        // Isso é mais preciso do que setFromObject que pode incluir sub-filhos inesperados.
        hitChild.updateWorldMatrix(true, false);
        box = new THREE.Box3().setFromBufferAttribute(
          hitChild.geometry.attributes.position as THREE.BufferAttribute
        );
        // Transforma os pontos para espaço mundo usando a matrixWorld do hitbox
        box.applyMatrix4(hitChild.matrixWorld);
      } else {
        // Sem hitbox: aplica geometria do próprio mesh com sua matriz mundo
        mesh.updateWorldMatrix(true, false);
        box = new THREE.Box3().setFromBufferAttribute(
          mesh.geometry.attributes.position as THREE.BufferAttribute
        );
        box.applyMatrix4(mesh.matrixWorld);
      }

      if (box.isEmpty()) return;

      const shrunk = box.clone();
      shrunk.min.addScalar(SHRINK);
      shrunk.max.subScalar(SHRINK);
      if (shrunk.isEmpty()) return;

      const center = new THREE.Vector3();
      box.getCenter(center);

      bars.push({
        mesh,
        box,
        shrunkBox: shrunk,
        center,
        label: obj.userData.barLabel || obj.name || 'Barra',
        axis: inferAxis(box)
      });
    });

    // — Checagem par a par —
    const collidingSet = new Set<THREE.Mesh>();
    const collisions: CollisionResult[] = [];

    // Limiar mínimo de volume de sobreposição: 0.5 cm³ = 5e-7 m³
    // (pequeno o suficiente para pegar perfis 30mm sobrepostos 10mm)
    const MIN_VOLUME = 5e-7;

    // Limiar de co-localização de centróide: 20 mm em ambas as dimensões transversais.
    // Barras montadas intencionalmente uma sobre a outra (bandeja L2 → longarina superior)
    // terão centróides praticamente no mesmo ponto → são filtradas aqui.
    // Barras de módulos diferentes que colidem estarão deslocadas > 20 mm.
    const CO_LOCATE_THRESHOLD = 0.020; // 20 mm

    for (let i = 0; i < bars.length; i++) {
      for (let j = i + 1; j < bars.length; j++) {
        const a = bars[i];
        const b = bars[j];

        // ① Eixos diferentes = junta T ou L → sempre intencional
        if (a.axis !== b.axis) continue;

        // ② Sem sobreposição real de Box3
        if (!a.shrunkBox.intersectsBox(b.shrunkBox)) continue;

        // ③ Volume de sobreposição abaixo do limiar mínimo
        const vol = intersectionVolume(a.shrunkBox, b.shrunkBox);
        if (vol < MIN_VOLUME) continue;

        // ④ Filtro de co-localização: centróides muito próximos nas dimensões
        //    transversais ao eixo = barras empilhadas por design (mesmo trilho, montagem
        //    intencional). Se diferença de centróide transversal ≤ 20 mm em AMBAS as
        //    dimensões, não é colisão — é montagem de bandeja sobre longarina, etc.
        let dT1: number; // diferença de centróide na transversal 1
        let dT2: number; // diferença de centróide na transversal 2
        if (a.axis === 'z') {
          dT1 = Math.abs(a.center.x - b.center.x);
          dT2 = Math.abs(a.center.y - b.center.y);
        } else if (a.axis === 'x') {
          dT1 = Math.abs(a.center.y - b.center.y);
          dT2 = Math.abs(a.center.z - b.center.z);
        } else { // y
          dT1 = Math.abs(a.center.x - b.center.x);
          dT2 = Math.abs(a.center.z - b.center.z);
        }
        if (dT1 <= CO_LOCATE_THRESHOLD && dT2 <= CO_LOCATE_THRESHOLD) continue;

        // ⑤ Colisão real confirmada
        collidingSet.add(a.mesh);
        collidingSet.add(b.mesh);
        collisions.push({
          meshA: a.mesh,
          meshB: b.mesh,
          labelA: a.label,
          labelB: b.label,
          overlapVolumeM3: vol,
          axisA: a.axis,
          axisB: b.axis
        });
      }
    }

    // — Pinta os meshes colidentes em vermelho —
    collidingSet.forEach((mesh) => {
      if (!savedMaterials.has(mesh)) {
        savedMaterials.set(mesh, mesh.material);
      }
      mesh.material = COLLISION_MAT;
      markedMeshes.add(mesh);
    });

    return {
      totalBars: bars.length,
      collidingBars: collidingSet.size,
      collisions,
      passedBars: bars.length - collidingSet.size,
      errorCount: collisions.length
    };
  },

  /**
   * Remove todas as marcações de colisão, restaurando os materiais originais.
   */
  clearAll() {
    savedMaterials.forEach((mat, mesh) => {
      mesh.material = mat;
    });
    savedMaterials.clear();
    markedMeshes.clear();
  },

  /**
   * Retorna true se há barras marcadas atualmente.
   */
  hasCollisions(): boolean {
    return markedMeshes.size > 0;
  }
};

