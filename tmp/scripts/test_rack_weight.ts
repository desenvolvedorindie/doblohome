// Mock browser globals for Textures.ts
const dummyCtx = new Proxy({}, {
  get: (target, prop) => {
    if (prop === 'measureText') return () => ({ width: 100 });
    if (prop === 'createLinearGradient') return () => ({ addColorStop: () => {} });
    return () => {};
  }
});

(global as any).document = {
  createElement: () => ({
    getContext: () => dummyCtx,
    width: 256,
    height: 256,
  }),
};

import * as THREE from 'three';
import { SolarSystem } from '../../src/three/SolarSystem';
import { DEFAULT_SOLAR_PANEL_PRESETS } from '../../src/data/solarPanelPresets';

// Mock scene
const scene = new THREE.Scene();

const panelPreset = DEFAULT_SOLAR_PANEL_PRESETS[0]; // 100W flexible
const solarSystem = new SolarSystem(scene);

console.log('--- TESTING RACK BARS & WEIGHT ---');

let totalSteelBarsWeight = 0;
let totalAluBarsWeight = 0;
let totalMeters = 0;
let barCount = 0;

const profileWeightsSteel: Record<string, number> = {
  'Metalon 40x40': 1.80,
  'Metalon 40×40': 1.80,
  'Metalon 30x30': 1.35,
  'Metalon 30×30': 1.35,
  'Metalon 30x20': 1.10,
  'Metalon 30×20': 1.10,
  'Metalon 20x20': 0.88,
  'Metalon 20×20': 0.88,
  'Metalon 50x30': 1.80,
  'Metalon 50×30': 1.80,
};

const profileWeightsAlu: Record<string, number> = {
  'T-Slot 40x40': 1.50,
  'T-Slot 40×40': 1.50,
  'T-Slot 30x30': 0.85,
  'T-Slot 30×30': 0.85,
  'T-Slot 20x20': 0.50,
  'T-Slot 20×20': 0.50,
};

const profileCounts: Record<string, { count: number, totalMeters: number }> = {};

solarSystem.group.traverse((obj: any) => {
  if (!obj.isMesh || !obj.userData || !obj.userData.isBar) return;
  barCount++;
  const len = Number(obj.userData.barLength) || 0;
  totalMeters += len;
  const spec = String(obj.userData.profileSpec || 'Outro');
  if (!profileCounts[spec]) profileCounts[spec] = { count: 0, totalMeters: 0 };
  profileCounts[spec].count++;
  profileCounts[spec].totalMeters += len;
});

console.log(`Found ${barCount} bars, total meters: ${totalMeters.toFixed(2)}m`);
console.log('Profiles found:');
for (const [spec, data] of Object.entries(profileCounts)) {
  console.log(`- ${spec}: ${data.count} un, ${data.totalMeters.toFixed(2)}m`);
}

console.log('--- TESTING STEEL vs ALUMINUM ---');
solarSystem.setStructureMaterial('steel');
const statsSteel = solarSystem.getEnergyStats();
console.log('Steel stats:', {
  weightPanels: statsSteel.weightPanels,
  weightStructure: statsSteel.weightStructure,
  weightTotal: statsSteel.weightTotal,
  totalPanels: statsSteel.totalPanels,
  structureMaterial: statsSteel.structureMaterial
});

solarSystem.setStructureMaterial('aluminum');
const statsAlu = solarSystem.getEnergyStats();
// Calculate weight by traversing bars
let traversedWeightSteel = 0;
let traversedWeightAlu = 0;

solarSystem.group.traverse((obj: any) => {
  if (!obj.isMesh || !obj.userData || !obj.userData.isBar) return;
  const len = Number(obj.userData.barLength) || 0;
  const spec = String(obj.userData.profileSpec || '');

  if (spec.includes('40x40') || spec.includes('40×40')) {
    traversedWeightSteel += len * 1.80;
    traversedWeightAlu += len * 1.50;
  } else if (spec.includes('30x30') || spec.includes('30×30')) {
    traversedWeightSteel += len * 1.35;
    traversedWeightAlu += len * 0.85;
  } else if (spec.includes('30x20') || spec.includes('30×20')) {
    traversedWeightSteel += len * 1.10;
    traversedWeightAlu += len * 0.70;
  } else if (spec.includes('20x20') || spec.includes('20×20')) {
    traversedWeightSteel += len * 0.88;
    traversedWeightAlu += len * 0.50;
  } else if (spec.includes('Sapata')) {
    traversedWeightSteel += 0.40;
    traversedWeightAlu += 0.25;
  } else if (spec.includes('Trilho') || spec.includes('Corrediça') || spec.includes('Laminado')) {
    // slides
    traversedWeightSteel += len * 0.85; // heavy duty slide
    traversedWeightAlu += len * 0.85;
  }
});

console.log('Traversed metal weight: Steel =', traversedWeightSteel.toFixed(1), 'kg, Alu =', traversedWeightAlu.toFixed(1), 'kg');


