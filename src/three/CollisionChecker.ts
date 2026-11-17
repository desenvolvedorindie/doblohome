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

    // — Coleta barras e volumes de verificação —
    const bars: Array<{
      mesh: THREE.Mesh;
      box: THREE.Box3;
      shrunkBox: THREE.Box3;
      center: THREE.Vector3;
      label: string;
      axis: 'x' | 'y' | 'z';
      isBaseVolume?: boolean;
    }> = [];

    const SHRINK = 0.0025; // 2.5 mm por face

    const isTrulyVisible = (obj: THREE.Object3D): boolean => {
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent;
      }
      return true;
    };

    scene.traverse((obj) => {
      // Ignora o teto do veículo (não checa colisão com lataria)
      if (obj.userData?.isRoofCollider) return;

      const isBar = Boolean(obj.userData?.isBar);
      const isCargoBoxVol = Boolean(obj.userData?.isCargoBoxVolume);
      if (!isBar && !isCargoBoxVol) return;
      if (!(obj as THREE.Mesh).isMesh) return;
      if (!isTrulyVisible(obj)) return;
      if (obj.name === '__hitbox') return;

      const mesh = obj as THREE.Mesh;

      let box: THREE.Box3;
      const hitChild = mesh.children.find(c => c.name === '__hitbox') as THREE.Mesh | undefined;

      if (hitChild) {
        hitChild.updateWorldMatrix(true, false);
        box = new THREE.Box3().setFromBufferAttribute(
          hitChild.geometry.attributes.position as THREE.BufferAttribute
        );
        box.applyMatrix4(hitChild.matrixWorld);
      } else {
        mesh.updateWorldMatrix(true, false);
        box = new THREE.Box3().setFromBufferAttribute(
          mesh.geometry.attributes.position as THREE.BufferAttribute
        );
        box.applyMatrix4(mesh.matrixWorld);
      }

      if (box.isEmpty()) return;

      const shrunk = box.clone();
      const s = isCargoBoxVol ? 0.006 : SHRINK;
      shrunk.min.addScalar(s);
      shrunk.max.subScalar(s);
      if (shrunk.isEmpty()) return;

      const center = new THREE.Vector3();
      box.getCenter(center);

      bars.push({
        mesh,
        box,
        shrunkBox: shrunk,
        center,
        label: obj.userData.barLabel || obj.name || 'Barra',
        axis: inferAxis(box),
        isBaseVolume: isCargoBoxVol,
      });
    });

    // — Checagem par a par —
    const collidingSet = new Set<THREE.Mesh>();
    const collisions: CollisionResult[] = [];

    // Limiar mínimo de volume de sobreposição: 0.5 cm³ = 5e-7 m³
    const MIN_VOLUME = 5e-7;

    // Limiar de co-localização de centróide: 20 mm em ambas as dimensões transversais.
    const CO_LOCATE_THRESHOLD = 0.020; // 20 mm

    for (let i = 0; i < bars.length; i++) {
      for (let j = i + 1; j < bars.length; j++) {
        const a = bars[i];
        const b = bars[j];

        // Ignora comparação entre cuba e tampa do próprio baú
        if (a.isBaseVolume && b.isBaseVolume) continue;

        // ① Sem sobreposição real de Box3
        if (!a.shrunkBox.intersectsBox(b.shrunkBox)) continue;

        // ② Volume de sobreposição abaixo do limiar mínimo
        const vol = intersectionVolume(a.shrunkBox, b.shrunkBox);
        if (vol < MIN_VOLUME) continue;

        // Se um dos itens for o volume do Baú, qualquer penetração (> 5 cm³) com barras estruturais é colisão real!
        if (a.isBaseVolume || b.isBaseVolume) {
          // Ignora travessas do subchassi onde a cuba do baú apoia na borda inferior (interseção rasante)
          if (vol < 5e-5) continue;
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
          continue;
        }

        // ③ Pares de barras com eixos diferentes:
        //    - Se for junta T/L nas extremidades (volume <= 64 cm³, ex: 40x40x40mm = 6.4e-5 m³), é encaixe normal.
        //    - Se uma barra atravessar o meio de outra ou penetrar profundamente (ou se o volume exceder o nó), verifica se é cruzamento inválido!
        if (a.axis !== b.axis) {
          // Verifica se o cruzamento ocorre longe das pontas de AMBAS as barras (cruzamento no meio de duas barras no mesmo plano)
          const sizeA = new THREE.Vector3();
          const sizeB = new THREE.Vector3();
          a.box.getSize(sizeA);
          b.box.getSize(sizeB);
          const maxCrossVol = 7.0e-5; // 70 cm³ (acima de um cubo 40x40x40mm)
          if (vol <= maxCrossVol) {
            continue;
          }
        } else {
          // ④ Filtro de co-localização para barras de mesmo eixo:
          const dy = Math.abs(a.center.y - b.center.y);
          let dT1: number;
          let dT2: number;
          if (a.axis === 'z') {
            dT1 = Math.abs(a.center.x - b.center.x);
            dT2 = dy;
          } else if (a.axis === 'x') {
            dT1 = dy;
            dT2 = Math.abs(a.center.z - b.center.z);
          } else { // y
            dT1 = Math.abs(a.center.x - b.center.x);
            dT2 = Math.abs(a.center.z - b.center.z);
          }
          // Estágios da mesma corrediça telescópica são concêntricos (mesmo Y e mesmo X/Z transversal)
          if (a.mesh.userData?.isTelescopicRail && b.mesh.userData?.isTelescopicRail) {
            if (dT1 <= CO_LOCATE_THRESHOLD && dT2 <= CO_LOCATE_THRESHOLD) continue;
          }
          // Barras estruturais de alumínio/metalon só são ignoradas se estiverem empilhadas verticalmente (dy >= 24mm)
          if (a.axis !== 'y' && dy >= 0.024 && dT1 <= CO_LOCATE_THRESHOLD && dT2 <= 0.045) continue;
        }

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

