import * as THREE from 'three';

export class SceneRaycaster {
  static handleCanvasClick(sceneManager: any, screenX: number, screenY: number) {
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

      if ((obj as any).isLine || (obj as any).isLineSegments) continue;

      if (obj.name === '__box_hitbox' || obj.userData?.isInternalBoxHitbox) {
        const boxId = obj.userData?.boxId || obj.parent?.userData?.boxId;
        if (boxId) {
          if (sceneManager.onBoxSelect) {
            sceneManager.onBoxSelect(boxId);
          }
          sceneManager.audio.playLockClick();
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
        if (sceneManager.onBoxSelect) {
          sceneManager.onBoxSelect(foundBoxId);
        }
        sceneManager.audio.playLockClick();
        return;
      }

      if (
        obj.userData?.isInternalFloorPlywood ||
        obj.userData?.isBasePlywood ||
        obj.name === 'BaseNavalPlywoodFloor' ||
        obj.parent === sceneManager.internalBoxesBuilder.floorGroup
      ) {
        if (sceneManager.viewMode === 'internal_boxes') {
          if (sceneManager.onBoxSelect) {
            sceneManager.onBoxSelect(null);
          }
        }
        return;
      }
    }

    if (sceneManager.viewMode === 'internal_boxes') {
      if (sceneManager.onBoxSelect) {
        sceneManager.onBoxSelect(null);
      }
    }
  }

  static handleCanvasDoubleClick(sceneManager: any, screenX: number, screenY: number) {
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

      if ((obj as any).isLine || (obj as any).isLineSegments) continue;

      if (obj.name === '__box_hitbox' || obj.userData?.isInternalBoxHitbox) {
        const boxId = obj.userData?.boxId || obj.parent?.userData?.boxId;
        if (boxId) {
          if (sceneManager.onBoxDoubleClick) {
            sceneManager.onBoxDoubleClick(boxId);
          }
          sceneManager.audio.playLockClick();
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
        if (sceneManager.onBoxDoubleClick) {
          sceneManager.onBoxDoubleClick(foundBoxId);
        }
        sceneManager.audio.playLockClick();
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

  static updateBarHover(sceneManager: any, screenX: number, screenY: number) {
    const rect = sceneManager.renderer.domElement.getBoundingClientRect();
    sceneManager.mouse.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    sceneManager.mouse.y = -((screenY - rect.top) / rect.height) * 2 + 1;

    sceneManager.raycaster.setFromCamera(sceneManager.mouse, sceneManager.camera);
    const activeRoots: THREE.Object3D[] = [];
    if (sceneManager.viewMode === 'bars_lineup') {
      activeRoots.push(sceneManager.barsLineupGroup);
    } else if (sceneManager.viewMode === 'internal_boxes') {
      activeRoots.push(sceneManager.internalBoxesBuilder.group);
    } else {
      activeRoots.push(sceneManager.solarSystem.group, sceneManager.vehicle.group, sceneManager.internalBoxesBuilder.group);
    }
    const intersects = sceneManager.raycaster.intersectObjects(activeRoots, true);

    const isAncestorVisible = (node: THREE.Object3D): boolean => {
      let cur: THREE.Object3D | null = node;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent;
      }
      return true;
    };

    let target: THREE.Object3D | null = null;

    // Prioridade 1: cursor diretamente sobre componente elétrico
    for (const hit of intersects) {
      const obj = hit.object;
      if (!isAncestorVisible(obj)) continue;
      if ((obj as any).isSprite || (obj as any).isLine || (obj as any).isLineSegments) continue;
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
        if (obj.name === '__roof_collider' || obj.userData?.isRoofCollider) continue;

        if (obj.name === '__box_hitbox' || obj.userData?.isInternalBoxHitbox) {
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

        if (obj.userData && (obj.userData.isInternalFloorPlywood || obj.userData.isBasePlywood)) {
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

    if (target) {
      if (sceneManager.hoveredObject !== target) {
        SceneRaycaster.clearBarHover(sceneManager);
        SceneRaycaster.highlightObject(sceneManager, target);
      }
      if (sceneManager.onBarHoverChange) {
        const d = target.userData;
        if (d.isLineupPart) {
          sceneManager.onBarHoverChange({
            name: d.name || 'Peça da Bancada',
            category: d.category || (d.isWoodPart ? '🪵 Madeira 15mm' : '🔩 Perfil Metálico'),
            barLength: d.barLength,
            barWidth: d.barWidth,
            barProfile: d.profileSpec,
            material: d.material,
            purpose: d.purpose
          }, screenX, screenY);
        } else if (d.isInternalFloorPlywood || d.isBasePlywood) {
          sceneManager.onBarHoverChange({
            name: d.name || 'Chapa Base Compensado Naval 15mm',
            category: d.category || '🪵 Assoalho Base Campervan',
            barProfile: d.barProfile || 'Compensado Naval 15mm',
            capacity: d.capacity || 'Fundo Comum dos Módulos',
            material: d.material || 'Compensado Naval 15mm Impermeabilizado',
            purpose: d.purpose || 'Base estrutural de nivelamento e fixação dos móveis internos da Doblò'
          }, screenX, screenY);
        } else if (d.isAppliance) {
          const dims = d.dimensions || {};
          const applianceType = d.isStove ? 'stove' : d.isFridge ? 'fridge' : 'portapotti';
          sceneManager.onBarHoverChange({
            name: d.partLabel || d.name || 'Equipamento Embarcado',
            category: d.category || 'Equipamento Camper',
            isAppliance: true,
            applianceType,
            barProfile: dims.widthMm ? `${dims.widthMm} × ${dims.depthMm} × ${dims.heightMm} mm` : undefined,
            power: d.power,
            capacity: d.capacity,
            weightText: d.weightKg !== undefined ? `${d.weightKg} kg` : undefined,
            material: d.material,
            purpose: d.purpose,
            features: d.features
          }, screenX, screenY);
        } else if (d.isInternalBox) {
          const dims = d.dimensions || {};
          sceneManager.onBarHoverChange({
            name: d.boxName || 'Armazenador Interno',
            category: d.boxType === 'drawer' ? '📦 Gavetão Deslizante Camper' : '🧰 Baú de Armazenamento',
            barProfile: `${dims.widthMm} × ${dims.lengthMm} × ${dims.heightMm} mm`,
            capacity: `${dims.volumeLiters} Litros`,
            material: 'Compensado Naval / MDF Camper',
            purpose: 'Armazenamento interno modular no assoalho da Doblò'
          }, screenX, screenY);
        } else if (d.isElectrical) {
          sceneManager.onBarHoverChange({
            name: d.name || target.name || 'Componente Elétrico',
            category: d.category || 'Componente Elétrico',
            isElectrical: true,
            electricalType: d.electricalType,
            voltage: d.voltage,
            capacity: d.capacity,
            current: d.current,
            power: d.power,
            efficiency: d.efficiency,
            material: d.material,
            purpose: d.purpose,
            features: d.features
          }, screenX, screenY);
        } else {
          sceneManager.onBarHoverChange({
            name: d.barLabel || target.name || 'Barra Estrutural',
            barLength: d.barLength,
            barProfile: d.profileSpec,
            cutAngle: d.cutAngle,
            material: d.material,
            level: d.level
          }, screenX, screenY);
        }
      }
    } else {
      SceneRaycaster.clearBarHover(sceneManager);
    }
  }

  static highlightObject(sceneManager: any, target: THREE.Object3D) {
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

  static clearBarHover(sceneManager: any) {
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
  }
}
