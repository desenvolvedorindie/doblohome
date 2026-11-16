import * as THREE from 'three';

export function getIsolatedBoxId(sceneManager: any): string | null {
  return (
    sceneManager.internalBoxesBuilder?.isolatedBoxId ||
    sceneManager.internalBoxesBuilder?.selectedBoxId ||
    null
  );
}

export function getStrictIsolatedBoxId(sceneManager: any): string | null {
  return sceneManager.internalBoxesBuilder?.strictIsolatedBoxId ?? null;
}

export function isDescendantOf(obj: THREE.Object3D, ancestor?: THREE.Object3D | null): boolean {
  if (!ancestor) return false;
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur === ancestor) return true;
    cur = cur.parent;
  }
  return false;
}

export function isCeilingObject(obj: THREE.Object3D, sceneManager: any): boolean {
  return (
    obj.name === 'CeilingAcousticBacking' ||
    isDescendantOf(obj, sceneManager.internalBoxesBuilder?.ceilingGroup)
  );
}

export function isAncestorVisible(node: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = node;
  while (cur) {
    if (!cur.visible) return false;
    cur = cur.parent;
  }
  return true;
}

export function findIsolatedBoxWoodHoverTarget(
  sceneManager: any,
  activeContainer: THREE.Object3D
): THREE.Mesh | null {
  const intersects = sceneManager.raycaster.intersectObjects([activeContainer], true);
  let foundWoodMesh: THREE.Mesh | null = null;

  for (const hit of intersects) {
    const obj = hit.object;
    if (!isAncestorVisible(obj)) continue;
    if ((obj as any).isSprite || (obj as any).isLine || (obj as any).isLineSegments) continue;
    if (
      obj.name === '__box_hitbox' ||
      obj.name === '__hitbox' ||
      obj.userData?.isInternalBoxHitbox ||
      obj.userData?.isRoofCollider
    ) {
      continue;
    }

    let cur: THREE.Object3D | null = obj;
    let isNonWoodFeature = false;
    let woodObj: THREE.Mesh | null = null;
    while (cur && cur !== activeContainer) {
      const ud = cur.userData || {};
      if (ud.isElectrical || ud.isAppliance || ud.isUpholstery || ud.isHardware) {
        isNonWoodFeature = true;
        break;
      }
      if (ud.isWoodPart === true && (cur as any).isMesh) {
        woodObj = cur as THREE.Mesh;
        break;
      }
      cur = cur.parent;
    }

    if (isNonWoodFeature || !woodObj) continue;

    foundWoodMesh = woodObj;
    break;
  }

  return foundWoodMesh;
}

export function resolveSceneHoverTarget(
  sceneManager: any,
  activeBoxId: string | null
): THREE.Object3D | null {
  const activeRoots: THREE.Object3D[] = [];
  if (sceneManager.viewMode === 'bars_lineup') {
    activeRoots.push(sceneManager.barsLineupGroup);
  } else if (sceneManager.viewMode === 'internal_boxes') {
    activeRoots.push(sceneManager.internalBoxesBuilder.group);
  } else {
    activeRoots.push(sceneManager.solarSystem.group, sceneManager.vehicle.group, sceneManager.internalBoxesBuilder.group);
  }
  const intersects = activeRoots.length > 0 ? sceneManager.raycaster.intersectObjects(activeRoots, true) : [];

  let target: THREE.Object3D | null = null;

  // Prioridade 1: cursor diretamente sobre componente elétrico
  for (const hit of intersects) {
    const obj = hit.object;
    if (!isAncestorVisible(obj)) continue;
    if ((obj as any).isSprite || (obj as any).isLine || (obj as any).isLineSegments) continue;
    if (sceneManager.viewMode === 'internal_boxes' && isCeilingObject(obj, sceneManager)) continue;
    if (obj.name === '__box_hitbox' || obj.name === '__hitbox' || obj.userData?.isInternalBoxHitbox) continue;

    let electricalNode: THREE.Object3D | null = null;
    if (obj.userData && obj.userData.isElectrical) {
      electricalNode = obj;
    } else {
      let p: THREE.Object3D | null = obj.parent;
      for (let depth = 0; depth < 6 && p && p !== sceneManager.scene; depth++, p = p.parent) {
        if (p.userData && p.userData.isElectrical) {
          electricalNode = p;
          break;
        }
      }
    }

    if (electricalNode) {
      let root: THREE.Object3D = electricalNode.userData?.electricalRoot || electricalNode;
      let curr: THREE.Object3D | null = electricalNode;
      while (curr && curr !== sceneManager.scene) {
        if (curr.userData && curr.userData.isElectricalRoot) {
          root = curr;
          break;
        }
        if (curr.userData && curr.userData.isElectrical) {
          root = curr;
        }
        curr = curr.parent;
      }
      target = root;
      break;
    }
  }

  // Prioridade 1.5: cursor diretamente sobre equipamento embarcado visível (Fogareiro, Geladeira, Porta Potti)
  if (!target) {
    for (const hit of intersects) {
      const obj = hit.object;
      if (!isAncestorVisible(obj)) continue;
      if ((obj as any).isSprite || (obj as any).isLine || (obj as any).isLineSegments) continue;
      if (sceneManager.viewMode === 'internal_boxes' && isCeilingObject(obj, sceneManager)) continue;
      if (obj.name === '__box_hitbox' || obj.name === '__hitbox' || obj.userData?.isInternalBoxHitbox) continue;

      let applianceNode: THREE.Object3D | null = null;
      if (obj.userData && obj.userData.isAppliance) {
        applianceNode = obj;
      } else {
        let p: THREE.Object3D | null = obj.parent;
        for (let depth = 0; depth < 4 && p && p !== sceneManager.scene; depth++, p = p.parent) {
          if (p.userData && p.userData.isAppliance) {
            applianceNode = p;
            break;
          }
        }
      }

      if (applianceNode) {
        target = applianceNode.userData?.applianceRoot || applianceNode.parent || applianceNode;
        break;
      }

      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const matAny = mat as any;
        if (matAny.opacity === 0) continue;
        const transparent = matAny.transparent === true;
        const opacity = typeof matAny.opacity === 'number' ? matAny.opacity : 1;
        if (!transparent || opacity > 0.7) {
          break;
        }
      }
    }
  }

  if (!target) {
    for (const hit of intersects) {
      const obj = hit.object;
      if (!isAncestorVisible(obj)) continue;

      if ((obj as any).isSprite || (obj as any).isLine || (obj as any).isLineSegments) continue;
      if (isCeilingObject(obj, sceneManager)) {
        // Se houver uma caixa ou equipamento interno sob o raio e a câmera estiver acima olhando para baixo, prioriza o módulo interno
        const hasBoxUnderRay = intersects.some((h) => {
          const o = h.object;
          return o.name === '__box_hitbox' || o.userData?.isInternalBoxHitbox || o.userData?.isInternalBox;
        });
        const isCameraAbove = (sceneManager.camera?.position?.y ?? 0) >= 1.70;
        if (hasBoxUnderRay && isCameraAbove) {
          continue;
        }
      }
      if (obj.name === '__roof_collider' || obj.userData?.isRoofCollider) continue;

      if (obj.name === '__box_hitbox' || obj.userData?.isInternalBoxHitbox) {
        if (activeBoxId) continue;
        target = obj.userData?.boxRoot || obj.parent;
        break;
      }

      if (obj.name === '__hitbox') {
        if (obj.parent && obj.parent.userData && (obj.parent.userData.isBar || obj.parent.userData.isElectrical)) {
          target = obj.parent.userData.electricalRoot || obj.parent;
          break;
        }
        continue;
      }

      let electricalNode: THREE.Object3D | null = null;
      if (obj.userData && obj.userData.isElectrical) {
        electricalNode = obj;
      } else {
        let p: THREE.Object3D | null = obj.parent;
        for (let depth = 0; depth < 6 && p && p !== sceneManager.scene; depth++, p = p.parent) {
          if (p.userData && p.userData.isElectrical) {
            electricalNode = p;
            break;
          }
        }
      }

      if (electricalNode) {
        let root: THREE.Object3D = electricalNode.userData?.electricalRoot || electricalNode;
        let curr: THREE.Object3D | null = electricalNode;
        while (curr && curr !== sceneManager.scene) {
          if (curr.userData && curr.userData.isElectricalRoot) {
            root = curr;
            break;
          }
          if (curr.userData && curr.userData.isElectrical) {
            root = curr;
          }
          curr = curr.parent;
        }
        target = root;
        break;
      }

      if (obj.userData && (obj.userData.isBar || obj.userData.isLineupPart)) {
        target = obj;
        break;
      }

      if (activeBoxId) {
        if (
          obj.userData &&
          (obj.userData.isWoodPart || obj.userData.isUpholstery || obj.userData.isHardware)
        ) {
          target = obj;
          break;
        }
        let pPart: THREE.Object3D | null = obj.parent;
        for (let depth = 0; depth < 4 && pPart && pPart !== sceneManager.scene; depth++, pPart = pPart.parent) {
          if (pPart.userData?.boxRoot && pPart === pPart.userData.boxRoot) break;
          if (
            pPart.userData &&
            (pPart.userData.isWoodPart || pPart.userData.isUpholstery || pPart.userData.isHardware)
          ) {
            target = pPart;
            break;
          }
        }
        if (target) break;
      } else {
        if (obj.userData && obj.userData.isInternalBox) {
          target = obj.userData?.boxRoot || obj;
          break;
        }
        let pBox: THREE.Object3D | null = obj.parent;
        for (let depth = 0; depth < 5 && pBox && pBox !== sceneManager.scene; depth++, pBox = pBox.parent) {
          if (pBox.userData && pBox.userData.isInternalBox) {
            target = pBox.userData?.boxRoot || pBox;
            break;
          }
        }
        if (target && target.userData?.isInternalBox) break;
      }

      if (obj.userData && (obj.userData.isInternalFloorPlywood || obj.userData.isBasePlywood || obj.userData.partType === 'floor')) {
        target = obj;
        break;
      }

      if (isCeilingObject(obj, sceneManager)) {
        target = obj;
        break;
      }

      let p: THREE.Object3D | null = obj.parent;
      let found = false;
      for (let depth = 0; depth < 5 && p && p !== sceneManager.scene; depth++, p = p.parent) {
        if (p.userData && (p.userData.isBar || p.userData.isLineupPart)) {
          target = p;
          found = true;
          break;
        }
      }
      if (found) break;

      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const matAny = mat as any;
        if (matAny.opacity === 0) continue;
        const transparent = matAny.transparent === true;
        const opacity = typeof matAny.opacity === 'number' ? matAny.opacity : 1;
        if (!transparent || opacity > 0.7) {
          break;
        }
      }
    }
  }

  return target;
}
