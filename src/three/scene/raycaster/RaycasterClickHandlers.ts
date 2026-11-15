import * as THREE from 'three';
import {
  getIsolatedBoxId,
  getStrictIsolatedBoxId,
  isCeilingObject
} from './RaycasterTargetResolver';

export function handleRaycasterCanvasClick(sceneManager: any, screenX: number, screenY: number) {
  const activeBoxId = getIsolatedBoxId(sceneManager);
  const strictIsolatedBoxId = getStrictIsolatedBoxId(sceneManager);
  const rect = sceneManager.renderer.domElement.getBoundingClientRect();
  const clickMouse = new THREE.Vector2(
    ((screenX - rect.left) / rect.width) * 2 - 1,
    -((screenY - rect.top) / rect.height) * 2 + 1
  );

  const clickRaycaster = new THREE.Raycaster();
  clickRaycaster.setFromCamera(clickMouse, sceneManager.camera);

  const intersects = clickRaycaster.intersectObjects([sceneManager.internalBoxesBuilder.group], true);
  for (const hit of intersects) {
    const obj = hit.object;

    if ((obj as any).isLine || (obj as any).isLineSegments || (obj as any).isSprite) continue;
    if (isCeilingObject(obj, sceneManager)) continue;

    if (obj.name === '__box_hitbox' || obj.userData?.isInternalBoxHitbox) {
      const boxId = obj.userData?.boxId || obj.parent?.userData?.boxId;
      if (boxId) {
        if (activeBoxId) {
          if (boxId !== activeBoxId) continue;
          return;
        }
        if (sceneManager.onBoxSelect && sceneManager.viewMode === 'internal_boxes') {
          sceneManager.onBoxSelect(boxId);
          sceneManager.audio?.playLockClick();
        }
        return;
      }
    }

    let cur: THREE.Object3D | null = obj;
    let foundBoxId: string | null = null;
    while (cur && cur !== sceneManager.internalBoxesBuilder.group) {
      if (cur.userData && cur.userData.boxId) {
        foundBoxId = cur.userData.boxId;
        break;
      }
      cur = cur.parent;
    }

    if (foundBoxId) {
      if (activeBoxId) {
        if (foundBoxId !== activeBoxId) continue;
        // Clicar em uma peça do próprio módulo já aberto mantém o foco sem reiniciar a câmera
        return;
      }
      if (sceneManager.onBoxSelect && sceneManager.viewMode === 'internal_boxes') {
        sceneManager.onBoxSelect(foundBoxId);
        sceneManager.audio?.playLockClick();
      }
      return;
    }

    if (
      obj.userData?.isInternalFloorPlywood ||
      obj.userData?.isBasePlywood ||
      obj.name === 'BaseNavalPlywoodFloor' ||
      obj.parent === sceneManager.internalBoxesBuilder.floorGroup
    ) {
      if (strictIsolatedBoxId) return;
      if (sceneManager.viewMode === 'internal_boxes') {
        if (sceneManager.onBoxSelect) {
          sceneManager.onBoxSelect(null);
        }
      }
      return;
    }
  }

  if (strictIsolatedBoxId) return;
  if (sceneManager.viewMode === 'internal_boxes') {
    if (sceneManager.onBoxSelect) {
      sceneManager.onBoxSelect(null);
    }
  }
}

export function handleRaycasterCanvasDoubleClick(sceneManager: any, screenX: number, screenY: number) {
  const activeBoxId = getIsolatedBoxId(sceneManager);
  const rect = sceneManager.renderer.domElement.getBoundingClientRect();
  const clickMouse = new THREE.Vector2(
    ((screenX - rect.left) / rect.width) * 2 - 1,
    -((screenY - rect.top) / rect.height) * 2 + 1
  );

  const clickRaycaster = new THREE.Raycaster();
  clickRaycaster.setFromCamera(clickMouse, sceneManager.camera);

  const intersects = clickRaycaster.intersectObjects([sceneManager.internalBoxesBuilder.group], true);
  for (const hit of intersects) {
    const obj = hit.object;

    if ((obj as any).isLine || (obj as any).isLineSegments || (obj as any).isSprite) continue;
    if (isCeilingObject(obj, sceneManager)) continue;

    if (obj.name === '__box_hitbox' || obj.userData?.isInternalBoxHitbox) {
      const boxId = obj.userData?.boxId || obj.parent?.userData?.boxId;
      if (boxId) {
        if (activeBoxId && boxId !== activeBoxId) continue;
        if (sceneManager.onBoxDoubleClick) {
          sceneManager.onBoxDoubleClick(boxId);
        }
        sceneManager.audio?.playLockClick();
        return;
      }
    }

    let cur: THREE.Object3D | null = obj;
    let foundBoxId: string | null = null;
    while (cur && cur !== sceneManager.internalBoxesBuilder.group) {
      if (cur.userData && cur.userData.boxId) {
        foundBoxId = cur.userData.boxId;
        break;
      }
      cur = cur.parent;
    }

    if (foundBoxId) {
      if (activeBoxId && foundBoxId !== activeBoxId) continue;
      if (sceneManager.onBoxDoubleClick) {
        sceneManager.onBoxDoubleClick(foundBoxId);
      }
      sceneManager.audio?.playLockClick();
      return;
    }

    if (
      obj.userData?.isInternalFloorPlywood ||
      obj.userData?.isBasePlywood ||
      obj.name === 'BaseNavalPlywoodFloor' ||
      obj.parent === sceneManager.internalBoxesBuilder.floorGroup
    ) {
      if (sceneManager.onBoxDoubleClick) {
        sceneManager.onBoxDoubleClick(null);
      }
      return;
    }
  }

  if (sceneManager.onBoxDoubleClick) {
    sceneManager.onBoxDoubleClick(null);
  }
}
