import * as THREE from 'three';
import { InternalBoxItem, InternalGridConfig, SlatBedDirection } from '../../../types';
import { getUpperCabinetExclusionZones } from '../BoxGeometryHelpers';

export interface CushionRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CushionMeshResult {
  mesh: THREE.Mesh;
  isCutout: boolean;
  labelSuffix: string;
  actualMinX: number;
  actualMaxX: number;
  actualMinZ: number;
  actualMaxZ: number;
}

export function collectMattressCutoutZones(params: {
  box: InternalBoxItem;
  w: number;
  l: number;
  slatT: number;
  direction: SlatBedDirection;
  parts: number;
  cellWM?: number;
  cellLM?: number;
  allBoxes?: InternalBoxItem[];
  grid?: InternalGridConfig;
}): CushionRect[] {
  const { box, w, l, slatT, direction, parts, cellWM, cellLM, allBoxes, grid } = params;
  const cutoutZones: CushionRect[] = [];

  const cellW = cellWM || w;
  const archW = 0.142; // largura da aba de estofamento sobre a caixa de roda
  const widthM = grid?.widthMm ? grid.widthMm / 1000 : 1.2;
  const posX_bed = (widthM / 2) - (box.colStart + box.colSpan / 2) * cellW;
  const posZ_bed = -(box.rowStart + box.rowSpan / 2) * (cellLM || l);

  // 1. Coleta todos os armários aéreos (do próprio módulo ou de vizinhos)
  const allCabinets: InternalBoxItem[] = [];
  if (box.upperCabinet) {
    allCabinets.push(box);
  }
  if (allBoxes) {
    for (const b of allBoxes) {
      if (b.upperCabinet && !allCabinets.some((c) => c.id === b.id)) {
        allCabinets.push(b);
      }
    }
  }

  for (const cabBox of allCabinets) {
    // Se o vão inferior for maior que a espessura do colchão (~80mm),
    // o armário é suspenso alto e o colchão passa livre por baixo sem recorte.
    // Se o vão inferior for <= 80mm (padrão 0mm, até embaixo), o colchão DEVE ter o recorte!
    const bottomGapMm = cabBox.upperCabinetBottomGapMm ?? 0;
    if (bottomGapMm > 80) {
      continue;
    }

    const isOwnBox = cabBox.id === box.id;
    const cabWM = isOwnBox ? w : (cellWM ? cabBox.colSpan * cellWM : w);
    const cabLM = isOwnBox ? l : (cellLM ? cabBox.rowSpan * cellLM : l);
    const posX_cab = (widthM / 2) - (cabBox.colStart + cabBox.colSpan / 2) * cellW;
    const posZ_cab = -(cabBox.rowStart + cabBox.rowSpan / 2) * (cellLM || l);
    const dz = isOwnBox ? 0 : posZ_cab - posZ_bed;

    const rawZones = getUpperCabinetExclusionZones(cabBox, cabWM, cabLM, { maxGapMm: 1000, marginM: 0.003 });
    for (const oz of rawZones) {
      let vehMinX = posX_cab + oz.minX;
      let vehMaxX = posX_cab + oz.maxX;
      let zMinZ = oz.minZ + dz;
      let zMaxZ = oz.maxZ + dz;

      // Determina contato físico com paredes laterais do veículo:
      const touchesRightWall =
        cabBox.upperCabinetAlign === 'right' ||
        cabBox.upperCabinetSides?.includes('right') ||
      vehMinX <= -widthM / 2 + 0.05;

      const touchesLeftWall =
        cabBox.upperCabinetAlign === 'left' ||
        cabBox.upperCabinetSides?.includes('left') ||
      vehMaxX >= widthM / 2 - 0.05;

      // Se for colchão com abas sobre as caixas de roda (5 partes):
      if (parts === 5) {
          if (touchesRightWall) {
            vehMinX = Math.min(vehMinX, -widthM / 2 - archW - 0.02);
          }
            if (touchesLeftWall) {
              vehMaxX = Math.max(vehMaxX, widthM / 2 + archW + 0.02);
            }
          }

            const touchesRear =
              cabBox.upperCabinetPositionMode === 'behind_box' ||
              zMinZ <= -l / 2 + 0.05;

            if (touchesRear) {
              zMinZ = Math.min(zMinZ, -l / 2 - 0.02);
            }

              const touchesFront = zMaxZ >= l / 2 - 0.05;
              if (touchesFront) {
                zMaxZ = Math.max(zMaxZ, l / 2 + 0.02);
              }

              cutoutZones.push({
                minX: vehMinX - posX_bed,
                maxX: vehMaxX - posX_bed,
                minZ: zMinZ,
                maxZ: zMaxZ
              });
            }
          }

          // 2. Módulos vizinhos mais altos que a cama (ex: balcão de cozinha 750mm ou armário alto)
          if (allBoxes && grid && cellWM && cellLM) {
            for (const otherBox of allBoxes) {
              if (otherBox.id !== box.id && otherBox.heightMm > box.heightMm) {
                const otherWM = otherBox.colSpan * cellWM;
                const otherLM = otherBox.rowSpan * cellLM;
                const posX_other = (widthM / 2) - (otherBox.colStart + otherBox.colSpan / 2) * cellWM;
                const posZ_other = -(otherBox.rowStart + otherBox.rowSpan / 2) * cellLM;
                const dz = posZ_other - posZ_bed;

                let vehMinX = posX_other - otherWM / 2;
                let vehMaxX = posX_other + otherWM / 2;
                let zMinZ = -otherLM / 2 + dz;
                let zMaxZ = otherLM / 2 + dz;

                if (parts === 5) {
                  if (vehMinX <= -widthM / 2 + 0.05) {
                    vehMinX = Math.min(vehMinX, -widthM / 2 - archW - 0.02);
                  }
                  if (vehMaxX >= widthM / 2 - 0.05) {
                    vehMaxX = Math.max(vehMaxX, widthM / 2 + archW + 0.02);
                  }
                }

                const touchesRear = zMinZ <= -l / 2 + 0.05;
                if (touchesRear) zMinZ = Math.min(zMinZ, -l / 2 - 0.02);
                const touchesFront = zMaxZ >= l / 2 - 0.05;
                if (touchesFront) zMaxZ = Math.max(zMaxZ, l / 2 + 0.02);

                cutoutZones.push({
          minX: vehMinX - posX_bed,
                  maxX: vehMaxX - posX_bed,
                  minZ: zMinZ,
                  maxZ: zMaxZ
                });
              }
            }
          }

          return cutoutZones;
        }

        export function buildCushionMesh(
          c: CushionRect,
          cutoutZones: CushionRect[],
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
