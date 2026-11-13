import * as THREE from 'three';

/**
 * Resultado de uma peça/barra estrutural identificada como flutuando
 */
export interface FloatingResult {
  mesh: THREE.Mesh;
  label: string;
  box: THREE.Box3;
  center: THREE.Vector3;
  reason: string;
}

/**
 * Resumo completo da verificação de sustentação/peças flutuantes
 */
export interface FloatingSummary {
  totalBars: number;
  baseBars: number;
  checkedBars: number;
  floatingBars: number;
  passedBars: number;
  floatingList: FloatingResult[];
  errorCount: number;
}

/** Material de destaque para peças flutuantes — âmbar / laranja emissivo pulsante */
const FLOATING_MAT = new THREE.MeshStandardMaterial({
  color: 0xf59e0b,
  emissive: new THREE.Color(0xd97706),
  emissiveIntensity: 0.85,
  roughness: 0.3,
  metalness: 0.4,
  transparent: false
});

/** Mapa barra → material original salvo */
const savedMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

/** Conjunto de barras atualmente marcadas como flutuantes */
const markedMeshes = new Set<THREE.Mesh>();

export const FloatingChecker = {
  /**
   * Executa a verificação de sustentação de peças na cena.
   *
   * Regra:
   *   1. Apenas a base (Subchassi e sapatas de ancoragem na van) não precisa de sustentação abaixo,
   *      pois é o alicerce fixado no teto do veículo.
   *   2. Todos os demais perfis estruturais (rack base, pilares, corrediças, bandejas e travessas)
   *      precisam estar física e estruturalmente sustentados:
   *      - Apoio vertical direto por outra peça abaixo (interseção das projeções horizontais X/Z e contato/suporte em Y)
   *      - União estrutural rígida em quadro/junta no mesmo nível com outra peça já sustentada
   *      - Acoplamento telescópico por corrediça mecânica apoiada na base
   *   3. Qualquer perfil que não tenha caminho de sustentação até o subchassi é classificado
   *      como "peça flutuando" e destacado em âmbar/laranja.
   */
  checkAll(scene: THREE.Scene): FloatingSummary {
    this.clearAll();
    scene.updateMatrixWorld(true);

    const isTrulyVisible = (obj: THREE.Object3D): boolean => {
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent;
      }
      return true;
    };

    interface BarNode {
      mesh: THREE.Mesh;
      box: THREE.Box3;
      center: THREE.Vector3;
      label: string;
      isSubchassis: boolean;
      isTelescopicRail: boolean;
    }

    const bars: BarNode[] = [];

    scene.traverse((obj) => {
      if (!obj.userData?.isBar) return;
      if (!(obj as THREE.Mesh).isMesh) return;
      if (!isTrulyVisible(obj)) return;
      if (obj.name === '__hitbox') return;

      const mesh = obj as THREE.Mesh;
      mesh.updateWorldMatrix(true, false);
      const box = new THREE.Box3().setFromObject(mesh);
      if (box.isEmpty()) return;

      const center = new THREE.Vector3();
      box.getCenter(center);

      const label = obj.userData.barLabel || obj.name || 'Perfil';
      const isSubchassis = Boolean(
        obj.userData?.isSubchassis ||
        obj.parent?.name === 'SubchassisBase' ||
        label.toLowerCase().includes('subchassi') ||
        label.toLowerCase().includes('sapata')
      );

      bars.push({
        mesh,
        box,
        center,
        label,
        isSubchassis,
        isTelescopicRail: Boolean(obj.userData?.isTelescopicRail)
      });
    });

    // Conjunto de peças com sustentação validada
    const supported = new Set<BarNode>();
    let baseCount = 0;

    // 1. A base (subchassi) é a raiz de sustentação — não precisa checar peça abaixo
    bars.forEach((b) => {
      if (b.isSubchassis) {
        supported.add(b);
        baseCount++;
      }
    });

    // 2. Propagação iterativa de sustentação da base para o topo
    let changed = true;
    while (changed) {
      changed = false;
      for (const a of bars) {
        if (supported.has(a)) continue;

        for (const b of supported) {
          // Condição A: Apoio vertical direto (b está abaixo de a, suportando a face inferior)
          // Tolerância vertical de até 120mm para cobrir braquetes estruturais verticais e sapatas
          const isBelow = (b.box.max.y >= a.box.min.y - 0.120) && (b.box.min.y < a.box.min.y);
          if (isBelow) {
            const xOverlap = Math.max(0, Math.min(a.box.max.x, b.box.max.x) - Math.max(a.box.min.x, b.box.min.x));
            const zOverlap = Math.max(0, Math.min(a.box.max.z, b.box.max.z) - Math.max(a.box.min.z, b.box.min.z));
            if (xOverlap > 0.005 && zOverlap > 0.005) {
              supported.add(a);
              changed = true;
              break;
            }
          }

          // Condição B: União estrutural rígida em quadro (junta T, topo ou canto no mesmo nível)
          const yOverlap = Math.max(0, Math.min(a.box.max.y, b.box.max.y) - Math.max(a.box.min.y, b.box.min.y));
          if (yOverlap > 0.010 || Math.abs(a.center.y - b.center.y) <= 0.025) {
            const xTouch = Math.max(a.box.min.x, b.box.min.x) <= Math.min(a.box.max.x, b.box.max.x) + 0.015;
            const zTouch = Math.max(a.box.min.z, b.box.min.z) <= Math.min(a.box.max.z, b.box.max.z) + 0.015;
            if (xTouch && zTouch) {
              supported.add(a);
              changed = true;
              break;
            }
          }

          // Condição C: Acoplamento em calha/corrediça telescópica
          if (a.isTelescopicRail && b.isTelescopicRail) {
            const dy = Math.abs(a.center.y - b.center.y);
            const dx = Math.abs(a.center.x - b.center.x);
            const dz = Math.abs(a.center.z - b.center.z);
            if (dy <= 0.020 && (dx <= 0.035 || dz <= 0.035)) {
              supported.add(a);
              changed = true;
              break;
            }
          }
        }
      }
    }

    // 3. Peças que não possuem sustentação inferior
    const floatingList: FloatingResult[] = [];
    bars.forEach((b) => {
      if (!supported.has(b)) {
        floatingList.push({
          mesh: b.mesh,
          label: b.label,
          box: b.box,
          center: b.center,
          reason: 'Perfil flutuando: sem contato estrutural inferior ou sustentação a partir do subchassi'
        });

        // Pinta a peça em âmbar
        if (!savedMaterials.has(b.mesh)) {
          savedMaterials.set(b.mesh, b.mesh.material);
        }
        b.mesh.material = FLOATING_MAT;
        markedMeshes.add(b.mesh);
      }
    });

    const nonBaseBars = bars.length - baseCount;

    return {
      totalBars: bars.length,
      baseBars: baseCount,
      checkedBars: nonBaseBars,
      floatingBars: floatingList.length,
      passedBars: nonBaseBars - floatingList.length,
      floatingList,
      errorCount: floatingList.length
    };
  },

  /**
   * Remove todas as marcações de peças flutuantes, restaurando os materiais originais.
   */
  clearAll() {
    savedMaterials.forEach((mat, mesh) => {
      mesh.material = mat;
    });
    savedMaterials.clear();
    markedMeshes.clear();
  },

  /**
   * Retorna true se há barras marcadas atualmente como flutuantes.
   */
  hasFloating(): boolean {
    return markedMeshes.size > 0;
  }
};

