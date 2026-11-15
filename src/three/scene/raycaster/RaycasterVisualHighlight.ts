import * as THREE from 'three';

export function highlightRaycasterObject(sceneManager: any, target: THREE.Object3D) {
  sceneManager.hoveredObject = target;
  sceneManager.hoveredOriginalMaterials.clear();

  const d = target.userData || {};
  let emissiveColor = 0x38bdf8;
  let emissiveIntensity = 0.55;

  if (d.isLineupPart) {
    emissiveColor = d.isWoodPart ? 0xd97706 : (d.isPvcPart ? 0x0ea5e9 : 0x38bdf8);
    emissiveIntensity = 0.6;
  } else if (d.isElectrical) {
    if (d.electricalType === 'battery') {
      emissiveColor = 0x10b981;
      emissiveIntensity = 0.65;
    } else if (d.electricalType === 'mppt') {
      emissiveColor = 0x0ea5e9;
      emissiveIntensity = 0.65;
    } else if (d.electricalType === 'b2b') {
      emissiveColor = 0x38bdf8;
      emissiveIntensity = 0.65;
    } else if (d.electricalType === 'usina') {
      emissiveColor = 0xef4444;
      emissiveIntensity = 0.65;
    } else if (d.electricalType === 'panel') {
      emissiveColor = 0xf59e0b;
      emissiveIntensity = 0.80;
    }
  } else if (d.isInternalFloorPlywood || d.isBasePlywood) {
    emissiveColor = 0xd97706;
    emissiveIntensity = 0.50;
  } else if (d.isAppliance) {
    emissiveColor = d.isStove ? 0xf97316 : d.isFridge ? 0x38bdf8 : 0x0284c7;
    emissiveIntensity = 0.45;
  } else if (d.isWoodPart && !d.isLineupPart) {
    emissiveColor = 0x38bdf8;
    emissiveIntensity = 0.55;
  } else if (d.isUpholstery || d.isHardware) {
    emissiveColor = 0x38bdf8;
    emissiveIntensity = 0.55;
  } else if (d.isInternalBox) {
    emissiveColor = 0x38bdf8;
    emissiveIntensity = 0.55;
  }

  const applyHighlightToMesh = (mesh: THREE.Mesh) => {
    if (!mesh.isMesh || !mesh.material) return;
    if (mesh.name === '__box_hitbox' || mesh.name === '__hitbox' || mesh.name === '__pvc_hitbox' || mesh.userData?.isInternalBoxHitbox) return;
    if (sceneManager.hoveredOriginalMaterials.has(mesh)) return;
    sceneManager.hoveredOriginalMaterials.set(mesh, mesh.material);

    const makeHighlight = (m: any) => {
      const clone = m.clone();
      if (clone.emissive) {
        clone.emissive.setHex(emissiveColor);
        clone.emissiveIntensity = emissiveIntensity;
      }
      return clone;
    };

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(makeHighlight);
    } else {
      mesh.material = makeHighlight(mesh.material);
    }
  };

  if ((target as any).isMesh) {
    applyHighlightToMesh(target as THREE.Mesh);
  } else {
    target.traverse((child: any) => {
      if (child.isMesh) {
        applyHighlightToMesh(child);
      }
    });
  }
}

export function clearRaycasterHover(sceneManager: any) {
  if (sceneManager.hoveredOriginalMaterials.size > 0) {
    sceneManager.hoveredOriginalMaterials.forEach((origMat: any, mesh: any) => {
      if (mesh && origMat) {
        mesh.material = origMat;
      }
    });
    sceneManager.hoveredOriginalMaterials.clear();
    sceneManager.hoveredObject = null;
  }
  if (sceneManager.onBarHoverChange) {
    sceneManager.onBarHoverChange(null, 0, 0);
  }
  if (sceneManager.renderer?.domElement && !sceneManager.internalBoxesRuler?.isActive) {
    sceneManager.renderer.domElement.style.cursor = '';
  }
}
