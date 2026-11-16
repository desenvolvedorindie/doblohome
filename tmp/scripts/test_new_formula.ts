import * as THREE from 'three';

function testVehicleCutoutZones(params: {
  box: any;
  w: number;
  l: number;
  direction: string;
  parts: number;
  cellWM: number;
  cellLM: number;
  allBoxes: any[];
  widthM: number;
}) {
  const { box, w, l, direction, parts, cellWM, cellLM, allBoxes, widthM } = params;
  const archW = 0.142;
  const posX_bed = (widthM / 2) - (box.colStart + box.colSpan / 2) * cellWM;

  const cutoutZones: any[] = [];

  for (const cabBox of allBoxes) {
    if (!cabBox.upperCabinet) continue;
    const isOwnBox = cabBox.id === box.id;
    const cabWM = isOwnBox ? w : cabBox.colSpan * cellWM;
    const cabLM = isOwnBox ? l : cabBox.rowSpan * cellLM;

    const posX_cab = (widthM / 2) - (cabBox.colStart + cabBox.colSpan / 2) * cellWM;
    const posZ_cab = -(cabBox.rowStart + cabBox.rowSpan / 2) * cellLM;
    const posZ_bed = -(box.rowStart + box.rowSpan / 2) * cellLM;

    const dx = posX_cab - posX_bed;
    const dz = posZ_cab - posZ_bed;

    // Simulated raw zone for 1-column cabinet
    const rawZones = [{
      minX: -cabWM / 2,
      maxX: cabWM / 2,
      minZ: -cabLM / 2,
      maxZ: cabLM / 2
    }];

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
        cabBox.upperCabinetAlign === 'rear' ||
        cabBox.upperCabinetSides?.includes('rear') ||
        zMinZ <= -l / 2 + 0.05;

      if (touchesRear) {
        zMinZ = Math.min(zMinZ, -l / 2 - 0.02);
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

// Case 1: Bed on col 2 (dir left). Cabinet on left wall (col 0).
const zones1 = testVehicleCutoutZones({
  box: { id: 'bed', colStart: 2, colSpan: 1, rowStart: 0, rowSpan: 4 },
  w: 0.4,
  l: 1.7,
  direction: 'left',
  parts: 5,
  cellWM: 0.4,
  cellLM: 0.425,
  widthM: 1.2,
  allBoxes: [
    { id: 'bed', colStart: 2, colSpan: 1, rowStart: 0, rowSpan: 4 },
    { id: 'cab', upperCabinet: true, upperCabinetAlign: 'rear', colStart: 0, colSpan: 1, rowStart: 3, rowSpan: 1 }
  ]
});

console.log('Case 1 Zones (Bed col 2, Cab col 0):', JSON.stringify(zones1));

// Case 2: Bed on col 0 (dir right). Cabinet on left wall (col 0, on bed).
const zones2 = testVehicleCutoutZones({
  box: { id: 'bed', upperCabinet: true, upperCabinetAlign: 'rear', colStart: 0, colSpan: 1, rowStart: 0, rowSpan: 4 },
  w: 0.4,
  l: 1.7,
  direction: 'right',
  parts: 5,
  cellWM: 0.4,
  cellLM: 0.425,
  widthM: 1.2,
  allBoxes: [
    { id: 'bed', upperCabinet: true, upperCabinetAlign: 'rear', colStart: 0, colSpan: 1, rowStart: 0, rowSpan: 4 }
  ]
});

console.log('Case 2 Zones (Bed col 0, Cab col 0):', JSON.stringify(zones2));
