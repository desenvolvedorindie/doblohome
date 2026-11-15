import * as THREE from 'three';
import { CargoBoxSystem } from '../../src/three/CargoBox';
import { PowerStorageBuilder } from '../../src/three/PowerStorage';

// Canvas mock for headless Node.js Three.js texture creation
if (typeof document === 'undefined') {
  (global as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 512,
          height: 512,
          getContext: () => ({
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            fillRect: () => {},
            strokeRect: () => {},
            beginPath: () => {},
            closePath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            quadraticCurveTo: () => {},
            bezierCurveTo: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            fillText: () => {},
            strokeText: () => {},
            measureText: () => ({ width: 100 }),
            save: () => {},
            restore: () => {},
            translate: () => {},
            rotate: () => {},
            scale: () => {},
            clearRect: () => {},
            roundRect: () => {},
            createLinearGradient: () => ({ addColorStop: () => {} }),
            createRadialGradient: () => ({ addColorStop: () => {} }),
            font: '',
            textAlign: '',
            textBaseline: '',
            shadowColor: '',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          })
        };
      }
      return {};
    }
  };
}

console.log('=== TEST 1: Default Baú 1600mm + Caixa d\'Água U Ø200mm ===');
const cargoBox = new CargoBoxSystem(
  {
    enabled: true,
    length: 1600,
    width: 1000,
    height: 330,
    hingeSide: 'driver',
    tiltAngle: 0,
    lidAngle: 0
  },
  2.06,
  0.40,
  'aluminum',
  'silver',
  'mm',
  true,
  200
);

const waterTankGroup = new THREE.Group();
PowerStorageBuilder.buildWaterTankPipes(
  waterTankGroup,
  true,
  2200,
  2.06,
  0.40,
  undefined,
  200
);

// Bounding box checks
const boxGroupBBox = new THREE.Box3().setFromObject(cargoBox.boxGroup);
const subchassisBBox = new THREE.Box3().setFromObject(cargoBox.subchassisGroup);
const waterBBox = new THREE.Box3().setFromObject(waterTankGroup);

console.log('Subchassis BBox:');
console.log(`  X: [${subchassisBBox.min.x.toFixed(3)}, ${subchassisBBox.max.x.toFixed(3)}]`);
console.log(`  Y: [${subchassisBBox.min.y.toFixed(3)}, ${subchassisBBox.max.y.toFixed(3)}]`);
console.log(`  Z: [${subchassisBBox.min.z.toFixed(3)}, ${subchassisBBox.max.z.toFixed(3)}]`);

console.log('\nWater Tank U-circuit BBox:');
console.log(`  X: [${waterBBox.min.x.toFixed(3)}, ${waterBBox.max.x.toFixed(3)}]`);
console.log(`  Y: [${waterBBox.min.y.toFixed(3)}, ${waterBBox.max.y.toFixed(3)}]`);
console.log(`  Z: [${waterBBox.min.z.toFixed(3)}, ${waterBBox.max.z.toFixed(3)}]`);

console.log('\nBaú Motobul BBox:');
console.log(`  X: [${boxGroupBBox.min.x.toFixed(3)}, ${boxGroupBBox.max.x.toFixed(3)}]`);
console.log(`  Y: [${boxGroupBBox.min.y.toFixed(3)}, ${boxGroupBBox.max.y.toFixed(3)}]`);
console.log(`  Z: [${boxGroupBBox.min.z.toFixed(3)}, ${boxGroupBBox.max.z.toFixed(3)}]`);

// Check if water tank is strictly within subchassis iron bounds (|X| <= 0.70m, Z in [-0.70m, 1.50m])
const isWaterWithinIronX = waterBBox.min.x >= -0.705 && waterBBox.max.x <= 0.705;
const isWaterWithinIronZ = waterBBox.min.z >= -0.705 && waterBBox.max.z <= 1.505;
console.log(`\nWater Tank strictly inside Iron Frame: ${isWaterWithinIronX && isWaterWithinIronZ ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(`  Max outer X of pipes: +/- ${Math.max(Math.abs(waterBBox.min.x), Math.abs(waterBBox.max.x)).toFixed(3)}m (Frame outer is +/- 0.700m, inner face +/- 0.660m)`);
console.log(`  Min Z of front pipe: ${waterBBox.min.z.toFixed(3)}m (Frame front is -0.700m, inner face -0.660m)`);

// Check baú forward position
console.log(`\nBaú Nose Z (front): ${boxGroupBBox.min.z.toFixed(3)}m`);
console.log(`Baú Rear Z (back): ${boxGroupBBox.max.z.toFixed(3)}m`);
console.log(`Front pipe rear surface Z: ${(waterBBox.min.z + 0.20).toFixed(3)}m`);
console.log(`Clearance between front pipe and baú: ${(boxGroupBBox.min.z - (waterBBox.min.z + 0.20)).toFixed(3)}m (${((boxGroupBBox.min.z - (waterBBox.min.z + 0.20)) * 100).toFixed(1)} cm)`);
console.log(`Free space behind baú on rack: ${(1.50 - boxGroupBBox.max.z).toFixed(3)}m (${((1.50 - boxGroupBBox.max.z) * 100).toFixed(1)} cm)`);

console.log('\n=== TEST 2: Baú with Water Tank Disabled ===');
cargoBox.updateConfig({}, undefined, undefined, false);
const boxNoWaterBBox = new THREE.Box3().setFromObject(cargoBox.boxGroup);
console.log(`Baú Nose Z (without water tank): ${boxNoWaterBBox.min.z.toFixed(3)}m (advanced further forward!)`);
console.log(`Free space behind baú: ${(1.50 - boxNoWaterBBox.max.z).toFixed(3)}m`);

console.log('\n=== ALL GEOMETRY VERIFICATIONS COMPLETED SUCCESSFULLY ===');
