import * as THREE from 'three';
import { InternalBoxItem, InternalGridConfig, SlatBedDirection } from '../../types';
import { getUpperCabinetExclusionZones } from './BoxGeometryHelpers';

export interface SlatMattressParams {
  showMattress?: boolean;
  isSelected?: boolean;
  container: THREE.Group;
  w: number;
  l: number;
  h: number;
  box: InternalBoxItem;
  slatT: number;
  direction: SlatBedDirection;
  isExtended: boolean;
  extRatio: number;
  cellWM?: number;
  cellLM?: number;
  allBoxes?: InternalBoxItem[];
  grid?: InternalGridConfig;
}

interface CushionRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface CushionMeshResult {
  mesh: THREE.Mesh;
  isCutout: boolean;
  labelSuffix: string;
  actualMinX: number;
  actualMaxX: number;
  actualMinZ: number;
  actualMaxZ: number;
}

export class SlatBedMattressBuilder {
  private buildCushion(
    c: CushionRect,
    cutoutZones: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }>,
    thickness: number,
    yPos: number,
    material: THREE.Material
  ): CushionMeshResult | null {
    let activeCut: CushionRect | null = null;
    for (const zone of cutoutZones) {
      const oMinX = Math.max(c.minX, zone.minX);
      const oMaxX = Math.min(c.maxX, zone.maxX);
      const oMinZ = Math.max(c.minZ, zone.minZ);
      const oMaxZ = Math.min(c.maxZ, zone.maxZ);
      if (oMaxX > oMinX + 0.005 && oMaxZ > oMinZ + 0.005) {
        activeCut = { minX: oMinX, maxX: oMaxX, minZ: oMinZ, maxZ: oMaxZ };
        break;
      }
    }

    const w = c.maxX - c.minX;
    const l = c.maxZ - c.minZ;
    const cCenterX = (c.minX + c.maxX) / 2;
    const cCenterZ = (c.minZ + c.maxZ) / 2;

    if (!activeCut) {
      const geo = new THREE.BoxGeometry(w, thickness, l);
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(cCenterX, yPos, cCenterZ);
      return {
        mesh,
        isCutout: false,
        labelSuffix: '',
        actualMinX: c.minX,
        actualMaxX: c.maxX,
        actualMinZ: c.minZ,
        actualMaxZ: c.maxZ
      };
    }

    const touchesMinX = activeCut.minX <= c.minX + 0.01;
    const touchesMaxX = activeCut.maxX >= c.maxX - 0.01;
    const touchesMinZ = activeCut.minZ <= c.minZ + 0.01;
    const touchesMaxZ = activeCut.maxZ >= c.maxZ - 0.01;

    // Se o armário cobre 100% da almofada:
    if (touchesMinX && touchesMaxX && touchesMinZ && touchesMaxZ) {
      return null;
    }

    // Caso 1: Corte na largura total (ex: armário traseiro ou dianteiro abrangendo toda a almofada)
    if (touchesMinX && touchesMaxX) {
      let newMinZ = c.minZ;
      let newMaxZ = c.maxZ;
      let suffix = 'c/ Recuo Traseiro Aéreo';
      if (touchesMinZ) {
        newMinZ = activeCut.maxZ;
      } else if (touchesMaxZ) {
        newMaxZ = activeCut.minZ;
        suffix = 'c/ Recuo Frontal Aéreo';
      }
      const newL = Math.max(0.02, newMaxZ - newMinZ);
      const geo = new THREE.BoxGeometry(w, thickness, newL);
      const mesh = new THREE.Mesh(geo, material);
      const newCenterZ = (newMinZ + newMaxZ) / 2;
      mesh.position.set(cCenterX, yPos, newCenterZ);
      return {
        mesh,
        isCutout: true,
        labelSuffix: ` • ${suffix}`,
        actualMinX: c.minX,
        actualMaxX: c.maxX,
        actualMinZ: newMinZ,
        actualMaxZ: newMaxZ
      };
    }

    // Caso 2: Corte no comprimento total (ex: armário lateral cobrindo toda a extensão do colchão)
    if (touchesMinZ && touchesMaxZ) {
      let newMinX = c.minX;
      let newMaxX = c.maxX;
      let suffix = 'c/ Recuo Lateral Dir. Aéreo';
      if (touchesMinX) {
        newMinX = activeCut.maxX;
      } else if (touchesMaxX) {
        newMaxX = activeCut.minX;
        suffix = 'c/ Recuo Lateral Esq. Aéreo';
      }
      const newW = Math.max(0.02, newMaxX - newMinX);
      const geo = new THREE.BoxGeometry(newW, thickness, l);
      const mesh = new THREE.Mesh(geo, material);
      const newCenterX = (newMinX + newMaxX) / 2;
      mesh.position.set(newCenterX, yPos, cCenterZ);
      return {
        mesh,
        isCutout: true,
        labelSuffix: ` • ${suffix}`,
        actualMinX: newMinX,
        actualMaxX: newMaxX,
        actualMinZ: c.minZ,
        actualMaxZ: c.maxZ
      };
    }

    // Caso 3: Recorte em L de Quina ou Notched (Geometria Extrudada THREE.Shape no plano horizontal)
    const x0 = c.minX - cCenterX;
    const x1 = c.maxX - cCenterX;
    const y0 = -(c.maxZ - cCenterZ);
    const y1 = -(c.minZ - cCenterZ);

    const ox0 = activeCut.minX - cCenterX;
    const ox1 = activeCut.maxX - cCenterX;
    const oy0 = -(activeCut.maxZ - cCenterZ);
    const oy1 = -(activeCut.minZ - cCenterZ);

    const shape = new THREE.Shape();
    let suffix = 'c/ Recorte de Quina Armário Aéreo';

    if (touchesMinZ && touchesMinX) {
      // Quina Traseira Direita
      shape.moveTo(x0, y0);
      shape.lineTo(x1, y0);
      shape.lineTo(x1, y1);
      shape.lineTo(ox1, y1);
      shape.lineTo(ox1, oy0);
      shape.lineTo(x0, oy0);
      shape.closePath();
      suffix = 'c/ Recorte L Quina Traseira Dir. Aéreo';
    } else if (touchesMinZ && touchesMaxX) {
      // Quina Traseira Esquerda
      shape.moveTo(x0, y0);
      shape.lineTo(x1, y0);
      shape.lineTo(x1, oy0);
      shape.lineTo(ox0, oy0);
      shape.lineTo(ox0, y1);
      shape.lineTo(x0, y1);
      shape.closePath();
      suffix = 'c/ Recorte L Quina Traseira Esq. Aéreo';
    } else if (touchesMaxZ && touchesMinX) {
      // Quina Dianteira Direita
      shape.moveTo(x0, oy1);
      shape.lineTo(ox1, oy1);
      shape.lineTo(ox1, y0);
      shape.lineTo(x1, y0);
      shape.lineTo(x1, y1);
      shape.lineTo(x0, y1);
      shape.closePath();
      suffix = 'c/ Recorte L Quina Dianteira Dir. Aéreo';
    } else if (touchesMaxZ && touchesMaxX) {
      // Quina Dianteira Esquerda
      shape.moveTo(x0, y0);
      shape.lineTo(ox0, y0);
      shape.lineTo(ox0, oy1);
      shape.lineTo(x1, oy1);
      shape.lineTo(x1, y1);
      shape.lineTo(x0, y1);
      shape.closePath();
      suffix = 'c/ Recorte L Quina Dianteira Esq. Aéreo';
    } else if (touchesMinZ) {
      // Encaixe traseiro central
      shape.moveTo(x0, y0);
      shape.lineTo(x1, y0);
      shape.lineTo(x1, y1);
      shape.lineTo(ox1, y1);
      shape.lineTo(ox1, oy0);
      shape.lineTo(ox0, oy0);
      shape.lineTo(ox0, y1);
      shape.lineTo(x0, y1);
      shape.closePath();
      suffix = 'c/ Encaixe Notched Aéreo Traseiro';
    } else if (touchesMaxZ) {
      // Encaixe dianteiro central
      shape.moveTo(x0, y0);
      shape.lineTo(ox0, y0);
      shape.lineTo(ox0, oy1);
      shape.lineTo(ox1, oy1);
      shape.lineTo(ox1, y0);
      shape.lineTo(x1, y0);
      shape.lineTo(x1, y1);
      shape.lineTo(x0, y1);
      shape.closePath();
      suffix = 'c/ Encaixe Notched Aéreo Dianteiro';
    } else if (touchesMinX) {
      // Encaixe lateral direito
      shape.moveTo(x0, y0);
      shape.lineTo(x1, y0);
      shape.lineTo(x1, y1);
      shape.lineTo(x0, y1);
      shape.lineTo(x0, oy1);
      shape.lineTo(ox1, oy1);
      shape.lineTo(ox1, oy0);
      shape.lineTo(x0, oy0);
      shape.closePath();
      suffix = 'c/ Encaixe Notched Lateral Dir. Aéreo';
    } else if (touchesMaxX) {
      // Encaixe lateral esquerdo
      shape.moveTo(x0, y0);
      shape.lineTo(x1, y0);
      shape.lineTo(x1, oy0);
      shape.lineTo(ox0, oy0);
      shape.lineTo(ox0, oy1);
      shape.lineTo(x1, oy1);
      shape.lineTo(x1, y1);
      shape.lineTo(x0, y1);
      shape.closePath();
      suffix = 'c/ Encaixe Notched Lateral Esq. Aéreo';
    } else {
      const geo = new THREE.BoxGeometry(w, thickness, l);
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(cCenterX, yPos, cCenterZ);
      return {
        mesh,
        isCutout: false,
        labelSuffix: '',
        actualMinX: c.minX,
        actualMaxX: c.maxX,
        actualMinZ: c.minZ,
        actualMaxZ: c.maxZ
      };
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -thickness / 2, 0);

    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(cCenterX, yPos, cCenterZ);

    return {
      mesh,
      isCutout: true,
      labelSuffix: ` • ${suffix}`,
      actualMinX: c.minX,
      actualMaxX: c.maxX,
      actualMinZ: c.minZ,
      actualMaxZ: c.maxZ
    };
  }

  buildMattress(params: SlatMattressParams) {
    const { container, w, l, h, box, slatT, direction, isExtended, extRatio, cellWM, cellLM, allBoxes, grid } = params;
    const isSelected = params.isSelected ?? false;
    const showMattress = params.showMattress ?? true;
    const parts = box.mattressParts ?? 2;
    const isLateral = direction === 'left' || direction === 'right';
    const topOfSlatsY = h / 2;

    // 3. COLCHÃO / ESTOFADO MULTIPARTIDO CAMPERVAN
    if (!showMattress) {
      return;
    }

    // Coleta todas as zonas de contato de armários aéreos que encostam na parte de baixo (na altura do colchão)
    const cutoutZones: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }> = [];

    // 1. Armário aéreo no próprio módulo da cama
    if (box.upperCabinet) {
      const ownZones = getUpperCabinetExclusionZones(box, w, l, { maxGapMm: 80, marginM: 0.003 });
      // Se for 5 partes, as abas de caixa de roda estendem a cama até a lataria lateral da Doblò.
      // Se houver armário frontal ou traseiro na cama, a zona de corte deve cobrir também a aba da caixa de roda no lado da base.
      if (parts === 5) {
        const archW = 0.142;
        for (const oz of ownZones) {
          if (direction === 'left') {
            // Base está no lado direito (-X). Aba da base estende para -X além de -w/2.
            cutoutZones.push({
              minX: oz.minX - archW,
              maxX: oz.maxX,
              minZ: oz.minZ,
              maxZ: oz.maxZ
            });
          } else {
            // Base está no lado esquerdo (+X). Aba da base estende para +X além de +w/2.
            cutoutZones.push({
              minX: oz.minX,
              maxX: oz.maxX + archW,
              minZ: oz.minZ,
              maxZ: oz.maxZ
            });
          }
        }
      } else {
        cutoutZones.push(...ownZones);
      }
    }

    // 2. Módulos vizinhos (armários aéreos ou módulos altos que tocam a altura da cama)
    if (allBoxes && grid && cellWM && cellLM) {
      const mattressTopY = box.heightMm + Math.round(slatT * 1000) + 80;
      for (const otherBox of allBoxes) {
        if (otherBox.id !== box.id) {
          const otherWM = otherBox.colSpan * cellWM;
          const otherLM = otherBox.rowSpan * cellLM;
          // Coordenadas relativas ao box da cama no espaço local:
          // Inversão de sinal necessária pois posX decresce com colStart e posZ decresce com rowStart
          const dx = -(otherBox.colStart + otherBox.colSpan / 2 - (box.colStart + box.colSpan / 2)) * cellWM;
          const dz = -(otherBox.rowStart + otherBox.rowSpan / 2 - (box.rowStart + box.rowSpan / 2)) * cellLM;

          // A. Armário aéreo do vizinho que desce até a altura do colchão
          if (otherBox.upperCabinet) {
            const otherBottomGap = otherBox.upperCabinetBottomGapMm ?? 0;
            const otherCabinetBottomY = otherBox.heightMm + otherBottomGap;
            if (otherCabinetBottomY <= mattressTopY) {
              const otherZones = getUpperCabinetExclusionZones(otherBox, otherWM, otherLM, { maxGapMm: 1000, marginM: 0.003 });
              for (const oz of otherZones) {
                cutoutZones.push({
                  minX: oz.minX + dx,
                  maxX: oz.maxX + dx,
                  minZ: oz.minZ + dz,
                  maxZ: oz.maxZ + dz
                });
              }
            }
          }

          // B. Módulo vizinho mais alto que a cama (ex: balcão de cozinha 750mm ou armário alto)
          if (otherBox.heightMm > box.heightMm) {
            cutoutZones.push({
              minX: -otherWM / 2 + dx,
              maxX: otherWM / 2 + dx,
              minZ: -otherLM / 2 + dz,
              maxZ: otherLM / 2 + dz
            });
          }
        }
      }
    }

    const partsName = parts === 1 ? 'Inteiro' : parts === 3 ? 'Tripartido' : parts === 5 ? '5 Partes (Total c/ Caixas de Roda)' : parts === 4 ? 'Quadripartido' : 'Bipartido';
    const mattressThickness = 0.08; // Espuma D33 de 80mm
    const mattressY = topOfSlatsY + mattressThickness / 2;

    const mattressMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x38bdf8 : 0x334155, // Tecido náutico grafite escuro texturizado
      roughness: 0.90,
      metalness: 0.02
    });
    const seamMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

    if (direction === 'left' || direction === 'right') {
      const cellW = cellWM || w;
      const cushionW = cellW - 0.012; // Cada almofada tem a largura de 1 subdivisão do grid
      const cushionL = l - 0.016;

      if (parts === 5) {
        // --- 5 PARTES: 3 COLUNAS CENTRAIS + 2 ABAS DE CAIXA DE RODA ESQ/DIR ---
        const archW = 0.142; // ~142mm para cada caixa de roda

        if (isExtended) {
          // 1. Aba Caixa de Roda do lado da base
          const baseArchX = direction === 'left' ? (-w / 2 - archW / 2) : (w / 2 + archW / 2);
          const baseArchRes = this.buildCushion(
            { minX: baseArchX - archW / 2, maxX: baseArchX + archW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
            cutoutZones,
            mattressThickness,
            mattressY,
            mattressMat
          );
          if (baseArchRes) {
            baseArchRes.mesh.castShadow = true;
            baseArchRes.mesh.receiveShadow = true;
            const curW = baseArchRes.actualMaxX - baseArchRes.actualMinX;
            const curL = baseArchRes.actualMaxZ - baseArchRes.actualMinZ;
            baseArchRes.mesh.userData = {
              isWoodPart: false,
              isUpholstery: true,
              dimW: curW,
              dimH: mattressThickness,
              dimL: curL,
              thicknessMm: Math.round(mattressThickness * 1000),
              partLabel: `Almofada Aba Caixa de Roda${baseArchRes.labelSuffix}`,
              material: 'Espuma D33 Revestida em Tecido Impermeável',
              woodMaterial: 'Espuma D33 (Colchão)',
              category: '🛏️ Estofaria Campervan',
              hasCabinetCutout: baseArchRes.isCutout,
              moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
              partType: 'upholstery'
            };
            container.add(baseArchRes.mesh);
          }

          // 2. Três almofadas centrais
          const centralResults: Array<CushionMeshResult | null> = [];
          for (let i = 0; i < 3; i++) {
            const pieceCenterX = direction === 'left'
              ? (-w / 2 + (i + 0.5) * cellW)
              : (w / 2 - (i + 0.5) * cellW);

            const cRes = this.buildCushion(
              { minX: pieceCenterX - cushionW / 2, maxX: pieceCenterX + cushionW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
              cutoutZones,
              mattressThickness,
              mattressY,
              mattressMat
            );
            centralResults.push(cRes);

            if (cRes) {
              cRes.mesh.castShadow = true;
              cRes.mesh.receiveShadow = true;
              const curW = cRes.actualMaxX - cRes.actualMinX;
              const curL = cRes.actualMaxZ - cRes.actualMinZ;
              cRes.mesh.userData = {
                isWoodPart: false,
                isUpholstery: true,
                dimW: curW,
                dimH: mattressThickness,
                dimL: curL,
                thicknessMm: Math.round(mattressThickness * 1000),
                partLabel: `Almofada Central ${i + 1}/3${cRes.labelSuffix}`,
                material: 'Espuma D33 Revestida em Tecido Impermeável',
                woodMaterial: 'Espuma D33 (Colchão)',
                category: '🛏️ Estofaria Campervan',
                hasCabinetCutout: cRes.isCutout,
                moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
                partType: 'upholstery'
              };
              container.add(cRes.mesh);
            }
          }

          // Costura com a 1ª coluna
          if (baseArchRes && centralResults[0]) {
            const baseSeamX = direction === 'left' ? -w / 2 : w / 2;
            const seamMinZ = Math.max(baseArchRes.actualMinZ, centralResults[0].actualMinZ);
            const seamMaxZ = Math.min(baseArchRes.actualMaxZ, centralResults[0].actualMaxZ);
            if (seamMaxZ > seamMinZ + 0.01) {
              const seamL = seamMaxZ - seamMinZ;
              const baseSeamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, seamL);
              const baseSeamMesh = new THREE.Mesh(baseSeamGeo, seamMat);
              baseSeamMesh.position.set(baseSeamX, mattressY, (seamMinZ + seamMaxZ) / 2);
              container.add(baseSeamMesh);
            }
          }

          // Costuras entre almofadas centrais
          for (let i = 0; i < 2; i++) {
            const cA = centralResults[i];
            const cB = centralResults[i + 1];
            if (cA && cB) {
              const seamX = direction === 'left'
                ? (-w / 2 + (i + 1) * cellW)
                : (w / 2 - (i + 1) * cellW);
              const seamMinZ = Math.max(cA.actualMinZ, cB.actualMinZ);
              const seamMaxZ = Math.min(cA.actualMaxZ, cB.actualMaxZ);
              if (seamMaxZ > seamMinZ + 0.01) {
                const seamL = seamMaxZ - seamMinZ;
                const seamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, seamL);
                const seamMesh = new THREE.Mesh(seamGeo, seamMat);
                seamMesh.position.set(seamX, mattressY, (seamMinZ + seamMaxZ) / 2);
                container.add(seamMesh);
              }
            }
          }

          // 3. Aba Caixa de Roda do lado oposto (aberto)
          const farArchX = direction === 'left' ? (-w / 2 + 3 * cellW + archW / 2) : (w / 2 - 3 * cellW - archW / 2);
          const farArchRes = this.buildCushion(
            { minX: farArchX - archW / 2, maxX: farArchX + archW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
            cutoutZones,
            mattressThickness,
            mattressY,
            mattressMat
          );
          if (farArchRes) {
            farArchRes.mesh.castShadow = true;
            farArchRes.mesh.receiveShadow = true;
            const curW = farArchRes.actualMaxX - farArchRes.actualMinX;
            const curL = farArchRes.actualMaxZ - farArchRes.actualMinZ;
            farArchRes.mesh.userData = {
              isWoodPart: false,
              isUpholstery: true,
              dimW: curW,
              dimH: mattressThickness,
              dimL: curL,
              thicknessMm: Math.round(mattressThickness * 1000),
              partLabel: `Almofada Aba Oposta Caixa de Roda${farArchRes.labelSuffix}`,
              material: 'Espuma D33 Revestida em Tecido Impermeável',
              woodMaterial: 'Espuma D33 (Colchão)',
              category: '🛏️ Estofaria Campervan',
              hasCabinetCutout: farArchRes.isCutout,
              moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
              partType: 'upholstery'
            };
            container.add(farArchRes.mesh);

            if (centralResults[2]) {
              const farSeamX = direction === 'left' ? (-w / 2 + 3 * cellW) : (w / 2 - 3 * cellW);
              const seamMinZ = Math.max(centralResults[2].actualMinZ, farArchRes.actualMinZ);
              const seamMaxZ = Math.min(centralResults[2].actualMaxZ, farArchRes.actualMaxZ);
              if (seamMaxZ > seamMinZ + 0.01) {
                const seamL = seamMaxZ - seamMinZ;
                const farSeamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, seamL);
                const farSeamMesh = new THREE.Mesh(farSeamGeo, seamMat);
                farSeamMesh.position.set(farSeamX, mattressY, (seamMinZ + seamMaxZ) / 2);
                container.add(farSeamMesh);
              }
            }
          }
        } else {
          // Modo sofá fechado: 3 almofadas centrais empilhadas + 2 abas de caixa de roda
          const layerH = 0.040;
          for (let p = 0; p < 3; p++) {
            const layerY = topOfSlatsY + layerH / 2 + p * (layerH + 0.001);
            const mRes = this.buildCushion(
              { minX: -cushionW / 2, maxX: cushionW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
              cutoutZones,
              layerH,
              layerY,
              mattressMat
            );
            if (mRes) {
              mRes.mesh.castShadow = true;
              mRes.mesh.receiveShadow = true;
              const curW = mRes.actualMaxX - mRes.actualMinX;
              const curL = mRes.actualMaxZ - mRes.actualMinZ;
              mRes.mesh.userData = {
                isWoodPart: false,
                isUpholstery: true,
                dimW: curW,
                dimH: layerH,
                dimL: curL,
                thicknessMm: Math.round(layerH * 1000),
                partLabel: `Almofada Central ${p + 1}/3 (Empilhada Sofá)${mRes.labelSuffix}`,
                material: 'Espuma D33 Revestida em Tecido Impermeável',
                woodMaterial: 'Espuma D33 (Colchão)',
                category: '🛏️ Estofaria Campervan',
                hasCabinetCutout: mRes.isCutout,
                moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
                partType: 'upholstery'
              };
              container.add(mRes.mesh);
            }
          }
          // As duas abas de caixa de roda dobradas ficam lado a lado sobre a 3ª camada central,
          // no mesmo plano Y perfeitamente nivelado (sem degrau flutuante)
          const flapLayerY = topOfSlatsY + 3 * (layerH + 0.001) + layerH / 2;
          for (let p = 0; p < 2; p++) {
            const fx = p === 0 ? -cushionW * 0.245 : cushionW * 0.245;
            const fw = cushionW * 0.49;
            const fl = cushionL;
            const fRes = this.buildCushion(
              { minX: fx - fw / 2, maxX: fx + fw / 2, minZ: -fl / 2, maxZ: fl / 2 },
              cutoutZones,
              layerH,
              flapLayerY,
              mattressMat
            );
            if (fRes) {
              fRes.mesh.castShadow = true;
              fRes.mesh.receiveShadow = true;
              const curW = fRes.actualMaxX - fRes.actualMinX;
              const curL = fRes.actualMaxZ - fRes.actualMinZ;
              fRes.mesh.userData = {
                isWoodPart: false,
                isUpholstery: true,
                dimW: curW,
                dimH: layerH,
                dimL: curL,
                thicknessMm: Math.round(layerH * 1000),
                partLabel: `Almofada Aba Caixa de Roda Dobrada #${p + 1}${fRes.labelSuffix}`,
                material: 'Espuma D33 Revestida em Tecido Impermeável',
                woodMaterial: 'Espuma D33 (Colchão)',
                category: '🛏️ Estofaria Campervan',
                hasCabinetCutout: fRes.isCutout,
                moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
                partType: 'upholstery'
              };
              container.add(fRes.mesh);
            }
          }
        }
      } else if (isExtended) {
        // Cama Aberta: cada uma das parts almofadas cobre exatamente uma subdivisão do grid
        const cushionResults: Array<CushionMeshResult | null> = [];
        for (let i = 0; i < parts; i++) {
          const pieceCenterX = direction === 'left'
            ? (-w / 2 + (i + 0.5) * cellW)
            : (w / 2 - (i + 0.5) * cellW);

          const cRes = this.buildCushion(
            { minX: pieceCenterX - cushionW / 2, maxX: pieceCenterX + cushionW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
            cutoutZones,
            mattressThickness,
            mattressY,
            mattressMat
          );
          cushionResults.push(cRes);

          if (cRes) {
            cRes.mesh.castShadow = true;
            cRes.mesh.receiveShadow = true;
            const curW = cRes.actualMaxX - cRes.actualMinX;
            const curL = cRes.actualMaxZ - cRes.actualMinZ;
            cRes.mesh.userData = {
              isWoodPart: false,
              isUpholstery: true,
              dimW: curW,
              dimH: mattressThickness,
              dimL: curL,
              thicknessMm: Math.round(mattressThickness * 1000),
              partLabel: `Almofada ${i + 1}/${parts} (${partsName})${cRes.labelSuffix}`,
              material: `Espuma D33 Revestida em Tecido Impermeável ${partsName}`,
              woodMaterial: 'Espuma D33 (Colchão)',
              category: '🛏️ Estofaria Campervan',
              hasCabinetCutout: cRes.isCutout,
              moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
              partType: 'upholstery'
            };
            container.add(cRes.mesh);
          }
        }

        for (let i = 0; i < parts - 1; i++) {
          const cA = cushionResults[i];
          const cB = cushionResults[i + 1];
          if (cA && cB) {
            const seamX = direction === 'left'
              ? (-w / 2 + (i + 1) * cellW)
              : (w / 2 - (i + 1) * cellW);
            const seamMinZ = Math.max(cA.actualMinZ, cB.actualMinZ);
            const seamMaxZ = Math.min(cA.actualMaxZ, cB.actualMaxZ);
            if (seamMaxZ > seamMinZ + 0.01) {
              const seamL = seamMaxZ - seamMinZ;
              const seamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, seamL);
              const seamMesh = new THREE.Mesh(seamGeo, seamMat);
              seamMesh.position.set(seamX, mattressY, (seamMinZ + seamMaxZ) / 2);
              container.add(seamMesh);
            }
          }
        }
      } else {
        // Cama Fechada: almofada(s) empilhadas sobre o estrado fixo no modo sofá
        if (parts === 1) {
          const mRes = this.buildCushion(
            { minX: -cushionW / 2, maxX: cushionW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
            cutoutZones,
            mattressThickness,
            mattressY,
            mattressMat
          );
          if (mRes) {
            mRes.mesh.castShadow = true;
            mRes.mesh.receiveShadow = true;
            const curW = mRes.actualMaxX - mRes.actualMinX;
            const curL = mRes.actualMaxZ - mRes.actualMinZ;
            mRes.mesh.userData = {
              isWoodPart: false,
              isUpholstery: true,
              dimW: curW,
              dimH: mattressThickness,
              dimL: curL,
              thicknessMm: Math.round(mattressThickness * 1000),
              partLabel: `Almofada Inteira Modo Sofá${mRes.labelSuffix}`,
              material: 'Espuma D33 Revestida em Tecido Impermeável',
              woodMaterial: 'Espuma D33 (Colchão)',
              category: '🛏️ Estofaria Campervan',
              hasCabinetCutout: mRes.isCutout,
              moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
              partType: 'upholstery'
            };
            container.add(mRes.mesh);
          }
        } else {
          // As N almofadas empilhadas no modo sofá sobre a base
          const layerH = parts === 2 ? 0.06 : parts === 3 ? 0.055 : 0.045;
          const layerResults: Array<CushionMeshResult | null> = [];
          for (let p = 0; p < parts; p++) {
            const layerY = topOfSlatsY + layerH / 2 + p * (layerH + 0.001);
            const mRes = this.buildCushion(
              { minX: -cushionW / 2, maxX: cushionW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
              cutoutZones,
              layerH,
              layerY,
              mattressMat
            );
            layerResults.push(mRes);

            if (mRes) {
              mRes.mesh.castShadow = true;
              mRes.mesh.receiveShadow = true;
              const curW = mRes.actualMaxX - mRes.actualMinX;
              const curL = mRes.actualMaxZ - mRes.actualMinZ;
              mRes.mesh.userData = {
                isWoodPart: false,
                isUpholstery: true,
                dimW: curW,
                dimH: layerH,
                dimL: curL,
                thicknessMm: Math.round(layerH * 1000),
                partLabel: `Almofada ${p + 1}/${parts} (${partsName} Modo Sofá)${mRes.labelSuffix}`,
                material: `Espuma D33 Revestida em Tecido Impermeável ${partsName}`,
                woodMaterial: 'Espuma D33 (Colchão)',
                category: '🛏️ Estofaria Campervan',
                hasCabinetCutout: mRes.isCutout,
                moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
                partType: 'upholstery'
              };
              container.add(mRes.mesh);
            }
          }

          for (let p = 0; p < parts - 1; p++) {
            const lA = layerResults[p];
            if (lA) {
              const curW = lA.actualMaxX - lA.actualMinX;
              const curL = lA.actualMaxZ - lA.actualMinZ;
              const seamGeo = new THREE.BoxGeometry(curW + 0.002, 0.002, curL + 0.002);
              const seamMesh = new THREE.Mesh(seamGeo, seamMat);
              const seamCenterZ = (lA.actualMinZ + lA.actualMaxZ) / 2;
              const seamCenterX = (lA.actualMinX + lA.actualMaxX) / 2;
              seamMesh.position.set(seamCenterX, topOfSlatsY + (p + 1) * (layerH + 0.001) - 0.0005, seamCenterZ);
              container.add(seamMesh);
            }
          }
        }
      }
    } else {
      // --- ABERTURA LONGITUDINAL (Frente ou Trás) ---
      const cellL = cellLM || l;
      const cushionW = w - 0.016;
      const cushionL = cellL - 0.012; // Cada almofada tem o comprimento de 1 subdivisão longitudinal

      if (isExtended) {
        const cushionResults: Array<CushionMeshResult | null> = [];
        for (let i = 0; i < parts; i++) {
          const pieceCenterZ = direction === 'front'
            ? (-l / 2 + (i + 0.5) * cellL)
            : (l / 2 - (i + 0.5) * cellL);

          const cRes = this.buildCushion(
            { minX: -cushionW / 2, maxX: cushionW / 2, minZ: pieceCenterZ - cushionL / 2, maxZ: pieceCenterZ + cushionL / 2 },
            cutoutZones,
            mattressThickness,
            mattressY,
            mattressMat
          );
          cushionResults.push(cRes);

          if (cRes) {
            cRes.mesh.castShadow = true;
            cRes.mesh.receiveShadow = true;
            const curW = cRes.actualMaxX - cRes.actualMinX;
            const curL = cRes.actualMaxZ - cRes.actualMinZ;
            cRes.mesh.userData = {
              isWoodPart: false,
              isUpholstery: true,
              dimW: curW,
              dimH: mattressThickness,
              dimL: curL,
              thicknessMm: Math.round(mattressThickness * 1000),
              partLabel: `Almofada Longitudinal ${i + 1}/${parts} (${partsName})${cRes.labelSuffix}`,
              material: `Espuma D33 Revestida em Tecido Impermeável ${partsName}`,
              woodMaterial: 'Espuma D33 (Colchão)',
              category: '🛏️ Estofaria Campervan',
              hasCabinetCutout: cRes.isCutout,
              moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
              partType: 'upholstery'
            };
            container.add(cRes.mesh);
          }
        }

        for (let i = 0; i < parts - 1; i++) {
          const cA = cushionResults[i];
          const cB = cushionResults[i + 1];
          if (cA && cB) {
            const pieceCenterZ = direction === 'front'
              ? (-l / 2 + (i + 1) * cellL)
              : (l / 2 - (i + 1) * cellL);
            const seamMinX = Math.max(cA.actualMinX, cB.actualMinX);
            const seamMaxX = Math.min(cA.actualMaxX, cB.actualMaxX);
            if (seamMaxX > seamMinX + 0.01) {
              const seamW = seamMaxX - seamMinX;
              const seamGeo = new THREE.BoxGeometry(seamW, mattressThickness + 0.002, 0.004);
              const seamMesh = new THREE.Mesh(seamGeo, seamMat);
              seamMesh.position.set((seamMinX + seamMaxX) / 2, mattressY, pieceCenterZ);
              container.add(seamMesh);
            }
          }
        }
      } else {
        if (parts === 1) {
          const mRes = this.buildCushion(
            { minX: -cushionW / 2, maxX: cushionW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
            cutoutZones,
            mattressThickness,
            mattressY,
            mattressMat
          );
          if (mRes) {
            mRes.mesh.castShadow = true;
            mRes.mesh.receiveShadow = true;
            const curW = mRes.actualMaxX - mRes.actualMinX;
            const curL = mRes.actualMaxZ - mRes.actualMinZ;
            mRes.mesh.userData = {
              isWoodPart: false,
              isUpholstery: true,
              dimW: curW,
              dimH: mattressThickness,
              dimL: curL,
              thicknessMm: Math.round(mattressThickness * 1000),
              partLabel: `Almofada Longitudinal Inteira Modo Sofá${mRes.labelSuffix}`,
              material: 'Espuma D33 Revestida em Tecido Impermeável',
              woodMaterial: 'Espuma D33 (Colchão)',
              category: '🛏️ Estofaria Campervan',
              hasCabinetCutout: mRes.isCutout,
              moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
              partType: 'upholstery'
            };
            container.add(mRes.mesh);
          }
        } else {
          const layerH = parts === 2 ? 0.06 : parts === 3 ? 0.055 : 0.045;
          const layerResults: Array<CushionMeshResult | null> = [];
          for (let p = 0; p < parts; p++) {
            const layerY = topOfSlatsY + layerH / 2 + p * (layerH + 0.001);
            const mRes = this.buildCushion(
              { minX: -cushionW / 2, maxX: cushionW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
              cutoutZones,
              layerH,
              layerY,
              mattressMat
            );
            layerResults.push(mRes);

            if (mRes) {
              mRes.mesh.castShadow = true;
              mRes.mesh.receiveShadow = true;
              const curW = mRes.actualMaxX - mRes.actualMinX;
              const curL = mRes.actualMaxZ - mRes.actualMinZ;
              mRes.mesh.userData = {
                isWoodPart: false,
                isUpholstery: true,
                dimW: curW,
                dimH: layerH,
                dimL: curL,
                thicknessMm: Math.round(layerH * 1000),
                partLabel: `Almofada Longitudinal ${p + 1}/${parts} (${partsName} Modo Sofá)${mRes.labelSuffix}`,
                material: `Espuma D33 Revestida em Tecido Impermeável ${partsName}`,
                woodMaterial: 'Espuma D33 (Colchão)',
                category: '🛏️ Estofaria Campervan',
                hasCabinetCutout: mRes.isCutout,
                moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
                partType: 'upholstery'
              };
              container.add(mRes.mesh);
            }
          }

          for (let p = 0; p < parts - 1; p++) {
            const lA = layerResults[p];
            if (lA) {
              const curW = lA.actualMaxX - lA.actualMinX;
              const curL = lA.actualMaxZ - lA.actualMinZ;
              const seamGeo = new THREE.BoxGeometry(curW + 0.002, 0.002, curL + 0.002);
              const seamMesh = new THREE.Mesh(seamGeo, seamMat);
              const seamCenterZ = (lA.actualMinZ + lA.actualMaxZ) / 2;
              const seamCenterX = (lA.actualMinX + lA.actualMaxX) / 2;
              seamMesh.position.set(seamCenterX, topOfSlatsY + (p + 1) * (layerH + 0.001) - 0.0005, seamCenterZ);
              container.add(seamMesh);
            }
          }
        }
      }
    }
  }
}
