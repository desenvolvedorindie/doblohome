import * as THREE from 'three';
import { AwningSystem } from '../../src/three/AwningSystem';
import { AwningConfig } from '../../src/types';

// Let's inspect the coordinates of vehicle, rack, and awning
console.log('=== VEHICLE & RACK ANALYSIS ===');
// Doblo cabin: Z = -0.40, L = 2.70 -> Z min = -1.75 (rear), Z max = +0.95 (front)
// Windshield: Z = +0.98
// Hood: Z = +0.82 to +2.05 (front bumper at ~2.05)
// Rear glass: Z = -1.755 (rear bumper at ~ -2.05)
// Roof sheet: Z = 0, L = 2.22 -> Z min = -1.11, Z max = +1.11

// Rack base: length = 2.20, zCenter = +0.40
// Rack Z min = 0.40 - 1.10 = -0.70
// Rack Z max = 0.40 + 1.10 = +1.50

console.log('Vehicle Roof: [-1.11, +1.11]');
console.log('Vehicle Rear Glass: -1.755');
console.log('Rack Base: [-0.70, +1.50]');
console.log('Note: Rack Base front (+1.50) is over the windshield (+0.98) and hood (+1.48)!');
console.log('Rack Base rear (-0.70) is more than 1 meter IN FRONT of the vehicle rear (-1.755)!');

// Now let's inspect the AwningSystem
const rearClosed: AwningConfig = {
  enabled: true,
  type: 'rear',
  side: 'passenger',
  lengthMm: 1400,
  extensionMm: 2000,
  isOpen: false
};
const rearClosedSys = new AwningSystem(rearClosed, 2.06, 0.40);
const boxRearClosed = new THREE.Box3().setFromObject(rearClosedSys.group);
console.log('\nRear Awning (CLOSED) Z bounds:', boxRearClosed.min.z.toFixed(3), 'to', boxRearClosed.max.z.toFixed(3));

const rearOpen: AwningConfig = {
  enabled: true,
  type: 'rear',
  side: 'passenger',
  lengthMm: 1400,
  extensionMm: 2000,
  isOpen: true
};
const rearOpenSys = new AwningSystem(rearOpen, 2.06, 0.40);
const boxRearOpen = new THREE.Box3().setFromObject(rearOpenSys.group);
console.log('Rear Awning (OPEN) Z bounds:', boxRearOpen.min.z.toFixed(3), 'to', boxRearOpen.max.z.toFixed(3));
console.log('Notice: boxRearOpen.max.z =', boxRearOpen.max.z.toFixed(3), '-> POSITIVE Z IS THE FRONT OF THE CAR!');

const batwingClosed: AwningConfig = {
  enabled: true,
  type: 'batwing_270',
  side: 'passenger',
  lengthMm: 2000,
  extensionMm: 2200,
  isOpen: false
};
const batClosedSys = new AwningSystem(batwingClosed, 2.06, 0.40);
const boxBatClosed = new THREE.Box3().setFromObject(batClosedSys.group);
console.log('\nBatwing (CLOSED) Z bounds:', boxBatClosed.min.z.toFixed(3), 'to', boxBatClosed.max.z.toFixed(3));

const batwingOpen: AwningConfig = {
  enabled: true,
  type: 'batwing_270',
  side: 'passenger',
  lengthMm: 2000,
  extensionMm: 2200,
  isOpen: true
};
const batOpenSys = new AwningSystem(batwingOpen, 2.06, 0.40);
const boxBatOpen = new THREE.Box3().setFromObject(batOpenSys.group);
console.log('Batwing (OPEN) Z bounds:', boxBatOpen.min.z.toFixed(3), 'to', boxBatOpen.max.z.toFixed(3));
console.log('Batwing (OPEN) X bounds:', boxBatOpen.min.x.toFixed(3), 'to', boxBatOpen.max.x.toFixed(3));

