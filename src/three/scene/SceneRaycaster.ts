import * as THREE from 'three';
import {
  buildTargetHoverPayload,
  buildWoodHoverPayload
} from './raycaster/RaycasterHoverPayloads';
import {
  clearRaycasterHover,
  highlightRaycasterObject
} from './raycaster/RaycasterVisualHighlight';
import {
  findIsolatedBoxWoodHoverTarget,
  getIsolatedBoxId,
  isAncestorVisible,
  resolveSceneHoverTarget
} from './raycaster/RaycasterTargetResolver';
import {
  handleRaycasterCanvasClick,
  handleRaycasterCanvasDoubleClick
} from './raycaster/RaycasterClickHandlers';

export class SceneRaycaster {
  static handleCanvasClick(sceneManager: any, screenX: number, screenY: number) {
    handleRaycasterCanvasClick(sceneManager, screenX, screenY);
  }

  static handleCanvasDoubleClick(sceneManager: any, screenX: number, screenY: number) {
    handleRaycasterCanvasDoubleClick(sceneManager, screenX, screenY);
  }

  static updateBarHover(sceneManager: any, screenX: number, screenY: number) {
    const rect = sceneManager.renderer.domElement.getBoundingClientRect();
    sceneManager.mouse.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    sceneManager.mouse.y = -((screenY - rect.top) / rect.height) * 2 + 1;

    sceneManager.raycaster.setFromCamera(sceneManager.mouse, sceneManager.camera);

    const activeBoxId = sceneManager.viewMode !== 'bars_lineup' ? getIsolatedBoxId(sceneManager) : null;

    // Caso 1: Quando estamos dentro de um módulo, nenhum outro elemento pode sofrer hover;
    // apenas as peças individuais de madeira (`isWoodPart`) pertencentes ao módulo ativo recebem hover.
    if (activeBoxId) {
      const activeContainer = sceneManager.internalBoxesBuilder?.boxesGroup?.children?.find(
        (c: THREE.Object3D) => c.userData?.boxId === activeBoxId
      );

      if (
        !activeContainer ||
        !sceneManager.internalBoxesBuilder?.group?.visible ||
        !isAncestorVisible(activeContainer)
      ) {
        SceneRaycaster.clearBarHover(sceneManager);
        if (sceneManager.renderer?.domElement && !sceneManager.internalBoxesRuler?.isActive) {
          sceneManager.renderer.domElement.style.cursor = 'grab';
        }
        return;
      }

      const foundWoodMesh = findIsolatedBoxWoodHoverTarget(sceneManager, activeContainer);

      if (foundWoodMesh) {
        if (sceneManager.hoveredObject !== foundWoodMesh) {
          SceneRaycaster.clearBarHover(sceneManager);
          SceneRaycaster.highlightObject(sceneManager, foundWoodMesh);
        }
        if (sceneManager.onBarHoverChange) {
          const payload = buildWoodHoverPayload(
            foundWoodMesh.userData || {},
            activeContainer.userData?.boxName
          );
          sceneManager.onBarHoverChange(payload, screenX, screenY);
        }
        if (sceneManager.renderer?.domElement && !sceneManager.internalBoxesRuler?.isActive) {
          sceneManager.renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        SceneRaycaster.clearBarHover(sceneManager);
        if (sceneManager.renderer?.domElement && !sceneManager.internalBoxesRuler?.isActive) {
          sceneManager.renderer.domElement.style.cursor = 'grab';
        }
      }
      return;
    }

    const target = resolveSceneHoverTarget(sceneManager, activeBoxId);

    if (target) {
      if (sceneManager.hoveredObject !== target) {
        SceneRaycaster.clearBarHover(sceneManager);
        SceneRaycaster.highlightObject(sceneManager, target);
      }
      if (sceneManager.onBarHoverChange) {
        sceneManager.onBarHoverChange(buildTargetHoverPayload(target), screenX, screenY);
      }
    } else {
      SceneRaycaster.clearBarHover(sceneManager);
    }
  }

  static highlightObject(sceneManager: any, target: THREE.Object3D) {
    highlightRaycasterObject(sceneManager, target);
  }

  static clearBarHover(sceneManager: any) {
    clearRaycasterHover(sceneManager);
  }
}
