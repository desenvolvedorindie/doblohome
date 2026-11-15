const { execSync } = require('child_process');
const origFull = execSync('git show HEAD:src/three/InternalBoxesBuilder.ts', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const origLines = origFull.split('\n');

const startIdx = origLines.findIndex(l => l.includes('private buildUpperCabinet('));
const endIdx = origLines.findIndex((l, i) => i > startIdx && l.includes('private buildFloorCentralTable('));
const cabLines = origLines.slice(startIdx, endIdx);

cabLines.forEach((l, idx) => {
  if (l.includes('ARMARIO LONGITUDINAL') || l.includes('ARMARIO TRANSVERSAL')) {
    console.log(`${idx}: ${l}`);
  }
});
