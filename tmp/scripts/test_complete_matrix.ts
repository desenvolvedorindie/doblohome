import * as THREE from 'three';
import { SlatBedMattressBuilder } from '../../src/three/boxes/SlatBedMattressBuilder';
import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';
import { getUpperCabinetExclusionZones } from '../../src/three/boxes/BoxGeometryHelpers';
import { buildCushionMesh } from '../../src/three/boxes/slat-bed/MattressCushionGeometry';

const grid = { ...DEFAULT_INTERNAL_GRID, colsX: 3, rowsZ: 4, widthMm: 1200, lengthMm: 1700, heightMm: 400 };
const cellWM = 0.4;
const cellLM = 0.425;
const widthM = 1.2;
const archW = 0.142;

function computeZones(box: any, allBoxes: any[]) {
  const l = box.rowSpan * cellLM;
  const w = box.colSpan * cellWM;
  const parts = box.mattressParts || 5;
  const posX_bed = (widthM / 2) - (box.colStart + box.colSpan / 2) * cellWM;
  const posZ_bed = -(box.rowStart + box.rowSpan / 2) * cellLM;

  const cutoutZones: any[] = [];

  for (const cabBox of allBoxes) {
    if (!cabBox.upperCabinet) continue;
    const isOwnBox = cabBox.id === box.id;
    const cabWM = isOwnBox ? w : cabBox.colSpan * cellWM;
    const cabLM = isOwnBox ? l : cabBox.rowSpan * cellLM;

    const posX_cab = (widthM / 2) - (cabBox.colStart + cabBox.colSpan / 2) * cellWM;
    const posZ_cab = -(cabBox.rowStart + cabBox.rowSpan / 2) * cellLM;
    const dz = isOwnBox ? 0 : posZ_cab - posZ_bed;

    const rawZones = getUpperCabinetExclusionZones(cabBox, cabWM, cabLM, { maxGapMm: 1000, marginM: 0.003 });
    for (const oz of rawZones) {
      let vehMinX = posX_cab + oz.minX;
      let vehMaxX = posX_cab + oz.maxX;
      let zMinZ = oz.minZ + dz;
      let zMaxZ = oz.maxZ + dz;

      const touchesRightWall =
        cabBox.upperCabinetAlign === 'right' ||
        cabBox.upperCabinetSides?.includes('right') ||
        vehMinX <= -widthM / 2 + 0.05;

      const touchesLeftWall =
        cabBox.upperCabinetAlign === 'left' ||
        cabBox.upperCabinetSides?.includes('left') ||
        vehMaxX >= widthM / 2 - 0.05;

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

  return cutoutZones;
}

// Scenario A: Bed at col 2 (dir left). Cabinet at col 0, row 3 (rear left!).
console.log('--- SCENARIO A: Bed at col 2 (dir left), Cabinet at col 0, row 3 (rear left) ---');
const bedA = { id: 'bed', colStart: 2, colSpan: 1, rowStart: 0, rowSpan: 4, slatBedDirection: 'left', mattressParts: 5 };
const cabA = { id: 'cab', upperCabinet: true, upperCabinetAlign: 'left', colStart: 0, colSpan: 1, rowStart: 3, rowSpan: 1, upperCabinetDepthMm: 250, upperCabinetBottomGapMm: 0 };
const zonesA = computeZones(bedA, [bedA, cabA]);
console.log('Zones A:', JSON.stringify(zonesA));

// Test build with buildCushionMesh
const w = 0.4;
const l = 1.7;
const cushionL = l - 0.016;
const farArchX = -w / 2 + 3 * 0.4 + archW / 2; // 1.071
const farArch = buildCushionMesh(
  { minX: farArchX - archW / 2, maxX: farArchX + archW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
  zonesA,
  0.08,
  0.4,
  new THREE.MeshBasicMaterial()
);
console.log('Far arch (Left wheel arch) cut result:');
console.log('  isCutout:', farArch?.isCutout, 'suffix:', farArch?.labelSuffix, 'length:', farArch ? (farArch.actualMaxZ - farArch.actualMinZ).toFixed(3) : null);

const baseArchX = -w / 2 - archW / 2; // -0.271
const baseArch = buildCushionMesh(
  { minX: baseArchX - archW / 2, maxX: baseArchX + archW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
  zonesA,
  0.08,
  0.4,
  new THREE.MeshBasicMaterial()
);
console.log('Base arch (Right wheel arch) cut result:');
console.log('  isCutout:', baseArch?.isCutout, 'suffix:', baseArch?.labelSuffix, 'length:', baseArch ? (baseArch.actualMaxZ - baseArch.actualMinZ).toFixed(3) : null);
