const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Extract original buildUpperCabinet from git
const origFull = execSync('git show HEAD:src/three/InternalBoxesBuilder.ts', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const origLines = origFull.split('\n');

const startIdx = origLines.findIndex(l => l.includes('private buildUpperCabinet('));
const endIdx = origLines.findIndex((l, i) => i > startIdx && l.includes('private buildFloorCentralTable('));

console.log(`buildUpperCabinet is lines ${startIdx + 1} to ${endIdx}`);
const cabLines = origLines.slice(startIdx, endIdx);

// Find split between transverse and longitudinal
const transStart = cabLines.findIndex(l => l.includes("if (side === 'rear' || side === 'front') {"));
const longStart = cabLines.findIndex(l => l.includes("} else {") && cabLines[l + 1]?.includes("ARMARIO LONGITUDINAL"));

console.log(`transStart: ${transStart}, longStart: ${longStart}`);
