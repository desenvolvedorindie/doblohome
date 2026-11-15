const boxWM = 0.40;
const boxLM = 0.85;

// Suppose side === 'rear', depth = 0.25m, width = 0.40m
const cabinetDepthM = 0.25;
const cabinetWidthM = 0.40;
const offsetM = 0;
const depthOffsetM = 0;

const cabinetCenterX = (-boxWM / 2 + cabinetWidthM / 2) + offsetM; // 0
const cabinetCenterZ = -boxLM / 2 + cabinetDepthM / 2 + depthOffsetM; // -0.425 + 0.125 = -0.30

const zone = {
  minX: cabinetCenterX - cabinetWidthM / 2 - 0.015, // -0.215
  maxX: cabinetCenterX + cabinetWidthM / 2 + 0.015, // +0.215
  minZ: cabinetCenterZ - cabinetDepthM / 2 - 0.015, // -0.425 - 0.015 = -0.44
  maxZ: cabinetCenterZ + cabinetDepthM / 2 + 0.015  // -0.175 + 0.015 = -0.16
};

console.log("Zone:", zone);

const hw = boxWM / 2; // 0.2
const hl = boxLM / 2; // 0.425
const margin = 0.048;
const usableW = boxWM - 2 * margin; // 0.304
const usableL = boxLM - 2 * margin; // 0.754

const cols = 4;
const rows = 9;
const stepX = usableW / cols;
const stepZ = usableL / rows;
const holeRadius = 0.02;

let excludedCount = 0;
let totalCount = 0;

for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    totalCount++;
    const cx = -hw + margin + (c + 0.5) * stepX;
    const cz = -hl + margin + (r + 0.5) * stepZ;

    const isExcluded = (cx + holeRadius >= zone.minX) &&
      (cx - holeRadius <= zone.maxX) &&
      (cz + holeRadius >= zone.minZ) &&
      (cz - holeRadius <= zone.maxZ);

    if (isExcluded) {
      excludedCount++;
      console.log(`Row ${r} (cz=${cz.toFixed(3)}) is EXCLUDED under cabinet (rear)`);
    }
  }
}

console.log(`Total holes: ${totalCount}, Excluded under cabinet: ${excludedCount}`);
