import * as THREE from 'three';
import { InternalBoxItem } from '../../types';
import { ELECTRONIC_COMPONENTS_CATALOG } from '../../types/electronics';
import { getBoxThickness } from './BoxGeometryHelpers';

export type ModuleCollisionKind = 'outside' | 'overlap';

export interface ModuleCollisionIssue {
  boxId: string;
  boxName: string;
  kind: ModuleCollisionKind;
  labelA: string;
  labelB?: string;
  /** Texto legível em PT-BR descrevendo o problema */
  detail: string;
  /** Referências 3D dos objetos envolvidos para destaque ao passar o mouse na lista */
  objectA?: THREE.Object3D;
  objectB?: THREE.Object3D;
  boxRoot?: THREE.Object3D;
}

export interface ModuleCollisionSummary {
  modulesChecked: number;
  modulesWithComponents: number;
  componentsChecked: number;
  issues: ModuleCollisionIssue[];
  /** IDs dos módulos com pelo menos um problema */
  affectedBoxIds: string[];
}

interface ComponentEntry {
  group: THREE.Object3D;
  label: string;
  /** Caixa no referencial local do módulo (com o deslocamento da gaveta removido) */
  box: THREE.Box3;
  /** Componente apoiado sobre o tampo (fora do volume interno por design) */
  onTop: boolean;
}

const TOLERANCE = 0.002; // 2 mm de tolerância para toques/encostos
const MIN_OVERLAP_VOLUME = 2e-6; // 2 cm³

const COMPONENT_PREFIXES = ['Installed_', 'FridgeAppliance_', 'PortaPottiAppliance_', 'StoveAppliance_'];

const SIDE_LABELS = {
  xMin: 'lateral direita',
  xMax: 'lateral esquerda',
  zMin: 'traseira',
  zMax: 'frente',
  yMin: 'fundo',
  yMax: 'tampo/teto'
} as const;

const mm = (v: number) => Math.round(v * 1000);

function componentLabel(obj: THREE.Object3D): string {
  const ud = obj.userData || {};
  if (ud.partLabel) return String(ud.partLabel);
  if (obj.name.startsWith('Installed_')) {
    const id = obj.name.split('_')[1] as keyof typeof ELECTRONIC_COMPONENTS_CATALOG;
    return ELECTRONIC_COMPONENTS_CATALOG[id]?.shortName || String(id);
  }
  if (obj.name.startsWith('StoveAppliance_')) return 'Fogareiro';
  if (obj.name.startsWith('FridgeAppliance_')) return 'Geladeira';
  if (obj.name.startsWith('PortaPottiAppliance_')) return 'Porta Potti';
  return obj.name;
}

/** Caixa envolvente ignorando parafusos de fixação (que ficam propositalmente nas abas). */
function componentBounds(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData?.isScrew) return;
    box.expandByObject(mesh, false);
  });
  return box;
}

function findAncestorByName(obj: THREE.Object3D, name: string, stopAt: THREE.Object3D): THREE.Object3D | null {
  let cur: THREE.Object3D | null = obj.parent;
  while (cur && cur !== stopAt) {
    if (cur.name === name) return cur;
    cur = cur.parent;
  }
  return null;
}

function computeInteriorBounds(
  container: THREE.Object3D,
  item: InternalBoxItem | undefined,
  slide: THREE.Object3D | null
): THREE.Box3 | null {
  const dims = container.userData?.dimensions;
  if (!dims) return null;
  const w = dims.widthMm / 1000;
  const l = dims.lengthMm / 1000;
  const h = dims.heightMm / 1000;
  const t = getBoxThickness(item);

  const hasTop = item?.panels?.top ?? (item?.type === 'chest');
  const topY = h / 2 - (hasTop ? t.top : 0);

  if (slide && slide.userData?.isDrawerSlide) {
    const u = slide.userData;
    return new THREE.Box3(
      new THREE.Vector3(u.cabCenterX - u.dW / 2 + t.right, u.trayTopY, u.cabCenterZ - u.dL / 2 + t.rear),
      new THREE.Vector3(u.cabCenterX + u.dW / 2 - t.left, topY, u.cabCenterZ + u.dL / 2 - t.front)
    );
  }

  const hasLeft = item?.panels?.left ?? true;
  const hasRight = item?.panels?.right ?? true;
  const hasFront = item?.panels?.front ?? true;
  const hasRear = item?.panels?.rear ?? true;
  const hasBottom = item?.panels?.bottom ?? true;

  return new THREE.Box3(
    new THREE.Vector3(-w / 2 + (hasRight ? t.right : 0), -h / 2 + (hasBottom ? t.bottom : 0), -l / 2 + (hasRear ? t.rear : 0)),
    new THREE.Vector3(w / 2 - (hasLeft ? t.left : 0), topY, l / 2 - (hasFront ? t.front : 0))
  );
}

function overlapVolume(a: THREE.Box3, b: THREE.Box3): number {
  const ix = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
  const iy = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
  const iz = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);
  if (ix <= TOLERANCE || iy <= TOLERANCE || iz <= TOLERANCE) return 0;
  return ix * iy * iz;
}

/** Descreve os lados em que `inner` ultrapassa `bounds`. */
function describeOverflow(inner: THREE.Box3, bounds: THREE.Box3, xzOnly: boolean): string[] {
  const out: string[] = [];
  const check = (excess: number, key: keyof typeof SIDE_LABELS) => {
    if (excess > TOLERANCE) out.push(`${mm(excess)} mm além da ${SIDE_LABELS[key]}`);
  };
  check(bounds.min.x - inner.min.x, 'xMin');
  check(inner.max.x - bounds.max.x, 'xMax');
  check(bounds.min.z - inner.min.z, 'zMin');
  check(inner.max.z - bounds.max.z, 'zMax');
  if (!xzOnly) {
    check(bounds.min.y - inner.min.y, 'yMin');
    check(inner.max.y - bounds.max.y, 'yMax');
  }
  return out;
}

export const ModuleCollisionChecker = {
  /**
   * Verifica, para cada módulo, se os componentes instalados (bateria, MPPT, B2B, usina,
   * geladeira, porta potti, fogareiro):
   *  - ultrapassam o volume interno do móvel (colidem com as chapas do próprio módulo);
   *  - colidem entre si.
   * Retorna o resumo e destaca em vermelho os componentes envolvidos.
   */
  check(boxesGroup: THREE.Object3D, boxes: InternalBoxItem[]): ModuleCollisionSummary {
    this.clearHighlights();
    boxesGroup.updateMatrixWorld(true);

    const issues: ModuleCollisionIssue[] = [];
    const affected = new Set<string>();
    const flagged = new Set<THREE.Object3D>();
    let modulesChecked = 0;
    let modulesWithComponents = 0;
    let componentsChecked = 0;

    boxesGroup.children.forEach((container) => {
      if (!container.userData?.isInternalBox) return;
      modulesChecked++;

      const boxId: string = container.userData.boxId;
      const boxName: string = container.userData.boxName || boxId;
      const item = boxes.find((b) => b.id === boxId);
      const containerPos = new THREE.Vector3().setFromMatrixPosition(container.matrixWorld);

      // Coleta os componentes
      const found: THREE.Object3D[] = [];
      container.traverse((o) => {
        if (COMPONENT_PREFIXES.some((p) => o.name.startsWith(p)) && o.name.endsWith(boxId)) found.push(o);
      });
      if (found.length === 0) return;
      modulesWithComponents++;

      const entries: ComponentEntry[] = [];
      let slideForBounds: THREE.Object3D | null = null;
      found.forEach((g) => {
        const bounds = componentBounds(g);
        if (bounds.isEmpty()) return;
        const slide = findAncestorByName(g, 'DrawerSlide', container);
        const rearPivot = findAncestorByName(g, 'RearFoldShelfPivot', container);
        // Bounds estão em coordenadas de mundo → referencial do módulo
        bounds.translate(containerPos.clone().negate());
        if (slide) {
          bounds.translate(slide.position.clone().negate());
          slideForBounds = slide;
        }
        const placement = item?.stovePlacement || 'top';
        const isStove = g.name.startsWith('StoveAppliance_');
        const onTop = isStove && placement === 'top';
        // Fogareiro na prateleira traseira aberta é externo ao volume do módulo → ignora
        if (rearPivot) return;
        entries.push({ group: g, label: componentLabel(g), box: bounds, onTop });
      });
      componentsChecked += entries.length;

      const interior = computeInteriorBounds(container, item, slideForBounds);
      const outerW = container.userData.dimensions.widthMm / 1000;
      const outerL = container.userData.dimensions.lengthMm / 1000;
      const outerTop = new THREE.Box3(
        new THREE.Vector3(-outerW / 2, -Infinity, -outerL / 2),
        new THREE.Vector3(outerW / 2, Infinity, outerL / 2)
      );

      // 1) Fora da área útil / colidindo com o próprio móvel
      entries.forEach((e) => {
        const limits = e.onTop ? outerTop : interior;
        if (!limits) return;
        const over = describeOverflow(e.box, limits, e.onTop);
        if (over.length === 0) return;
        issues.push({
          boxId,
          boxName,
          kind: 'outside',
          labelA: e.label,
          detail: e.onTop
            ? `${e.label} ultrapassa o tampo: ${over.join(', ')}`
            : `${e.label} colide com o próprio móvel: ${over.join(', ')}`,
          objectA: e.group,
          boxRoot: container
        });
        affected.add(boxId);
        flagged.add(e.group);
      });

      // 2) Componente x componente
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const a = entries[i];
          const b = entries[j];
          // Item sobre o tampo não divide o volume interno
          if (a.onTop !== b.onTop) continue;
          const vol = overlapVolume(a.box, b.box);
          if (vol < MIN_OVERLAP_VOLUME) continue;
          issues.push({
            boxId,
            boxName,
            kind: 'overlap',
            labelA: a.label,
            labelB: b.label,
            detail: `${a.label} colide com ${b.label} (${(vol * 1e6).toFixed(0)} cm³ sobrepostos)`,
            objectA: a.group,
            objectB: b.group,
            boxRoot: container
          });
          affected.add(boxId);
          flagged.add(a.group);
          flagged.add(b.group);
        }
      }
    });

    flagged.forEach((g) => this.highlight(g));

    return {
      modulesChecked,
      modulesWithComponents,
      componentsChecked,
      issues,
      affectedBoxIds: Array.from(affected)
    };
  },

  // ── Destaque visual (vermelho) e foco de hover (amarelo/ciano brilhante) ──
  _saved: new Map<THREE.Mesh, THREE.Material | THREE.Material[]>(),
  _hoverSaved: new Map<THREE.Mesh, THREE.Material | THREE.Material[]>(),
  _hoverHelpers: [] as THREE.BoxHelper[],
  _mat: new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: new THREE.Color(0xef4444),
    emissiveIntensity: 0.8,
    roughness: 0.4,
    metalness: 0.3
  }),
  _hoverMat: new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: new THREE.Color(0xfacc15),
    emissiveIntensity: 1.15,
    roughness: 0.25,
    metalness: 0.2
  }),

  highlight(root: THREE.Object3D) {
    root.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData?.isScrew) return;
      if (!this._saved.has(mesh)) this._saved.set(mesh, mesh.material);
      mesh.material = this._mat;
    });
  },

  setHoverFocus(targets: THREE.Object3D[], scene?: THREE.Scene) {
    this.clearHoverFocus();
    targets.forEach((root) => {
      if (!root) return;
      root.traverse((c) => {
        const mesh = c as THREE.Mesh;
        if (!mesh.isMesh || mesh.userData?.isScrew) return;
        if (mesh.name === '__box_hitbox' || mesh.userData?.isInternalBoxHitbox) return;
        if (!this._hoverSaved.has(mesh)) {
          this._hoverSaved.set(mesh, mesh.material);
        }
        mesh.material = this._hoverMat;
      });
      if (scene) {
        const helper = new THREE.BoxHelper(root, 0xfacc15);
        helper.name = '__collision_hover_helper';
        scene.add(helper);
        this._hoverHelpers.push(helper);
      }
    });
  },

  clearHoverFocus() {
    this._hoverSaved.forEach((mat, mesh) => {
      mesh.material = mat;
    });
    this._hoverSaved.clear();
    this._hoverHelpers.forEach((h) => {
      h.parent?.remove(h);
      h.geometry?.dispose();
      (h.material as THREE.Material)?.dispose?.();
    });
    this._hoverHelpers = [];
  },

  clearHighlights() {
    this.clearHoverFocus();
    this._saved.forEach((mat, mesh) => {
      mesh.material = mat;
    });
    this._saved.clear();
  }
};
