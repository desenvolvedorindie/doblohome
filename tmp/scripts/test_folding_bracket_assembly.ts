import * as THREE from 'three';
import { getFoldingBracketForHeight } from '../../src/types';

console.log('Testing Complete Folding Shelf Assembly (Wood + 2PCS Metal Brackets)...');

const h = 0.40;
const l = 0.80;
const w = 0.60;
const shelfW = Math.max(0.15, w - 0.03);
const shelfH = Math.max(0.15, Math.min(h - 0.04, 0.38));
const shelfT = 0.018;

const bracketSpec = getFoldingBracketForHeight(Math.round(h * 1000));
console.log('Bracket Spec:', bracketSpec);

const faceZ = -l / 2;
const pivotY = h / 2 - 0.022;

const W_b = 0.022; // 22mm largura do canal
const D_b = 0.016; // 16mm profundidade do canal
const t_s = 0.002; // 2mm espessura da chapa

const Hv = Math.min(shelfH * 0.65, bracketSpec.heightMm / 1000);
const Lh = Math.min(shelfH * 0.85, bracketSpec.lengthMm / 1000);

const pivotZ = faceZ - D_b + 0.004;

function buildAssembly(isOpen: boolean) {
  const container = new THREE.Group();

  const bracketSteelMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.94,
    roughness: 0.18
  });
  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.98,
    roughness: 0.12
  });
  const triggerGripMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.2,
    roughness: 0.8
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xdf9a57,
    roughness: 0.45,
    metalness: 0.04
  });

  const bracketOffsetX = shelfW * 0.32;
  const bracketXPositions = [-bracketOffsetX, bracketOffsetX];

  // 1. Peças FIXAS na parede/face do baú (Vertical Channels)
  bracketXPositions.forEach((bx) => {
    // Canaleta vertical
    const vertBackGeo = new THREE.BoxGeometry(W_b, Hv, t_s);
    const vertBackMesh = new THREE.Mesh(vertBackGeo, bracketSteelMat);
    vertBackMesh.position.set(bx, pivotY - Hv / 2, faceZ - t_s / 2);
    container.add(vertBackMesh);

    const vertFlangeGeo = new THREE.BoxGeometry(t_s, Hv, D_b);
    const leftFlange = new THREE.Mesh(vertFlangeGeo, bracketSteelMat);
    leftFlange.position.set(bx - W_b / 2 + t_s / 2, pivotY - Hv / 2, faceZ - D_b / 2);
    container.add(leftFlange);

    const rightFlange = new THREE.Mesh(vertFlangeGeo, bracketSteelMat);
    rightFlange.position.set(bx + W_b / 2 - t_s / 2, pivotY - Hv / 2, faceZ - D_b / 2);
    container.add(rightFlange);

    // Parafusos
    [Hv * 0.15, Hv * 0.50, Hv * 0.85].forEach((offY) => {
      const screwGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 10);
      screwGeo.rotateX(Math.PI / 2);
      const screwMesh = new THREE.Mesh(screwGeo, rivetMat);
      screwMesh.position.set(bx, pivotY - offY, faceZ - t_s);
      container.add(screwMesh);
    });

    // Pino fixo superior
    const mainPivotPinGeo = new THREE.CylinderGeometry(0.0035, 0.0035, W_b + 0.004, 16);
    mainPivotPinGeo.rotateZ(Math.PI / 2);
    const mainPivotPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
    mainPivotPin.position.set(bx, pivotY, pivotZ);
    container.add(mainPivotPin);

    // Pino inferior da diagonal
    const lowerPivotY = pivotY - Hv * 0.75;
    const lowerPivotZ = faceZ - D_b * 0.65;
    const lowerPivotPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
    lowerPivotPin.position.set(bx, lowerPivotY, lowerPivotZ);
    container.add(lowerPivotPin);

    // Diagonal strut
    if (isOpen) {
      const upperLockY = pivotY - 0.006;
      const upperLockZ = faceZ - D_b - Lh * 0.62;
      const dY = upperLockY - lowerPivotY;
      const dZ = upperLockZ - lowerPivotZ;
      const strutLength = Math.sqrt(dY * dY + dZ * dZ);
      const strutAngle = Math.atan2(dZ, dY);

      const strutGeo = new THREE.BoxGeometry(0.014, strutLength, 0.005);
      const strutMesh = new THREE.Mesh(strutGeo, bracketSteelMat);
      strutMesh.position.set(bx, (lowerPivotY + upperLockY) / 2, (lowerPivotZ + upperLockZ) / 2);
      strutMesh.rotation.x = -strutAngle + Math.PI / 2;
      container.add(strutMesh);

      const lockPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
      lockPin.position.set(bx, upperLockY, upperLockZ);
      container.add(lockPin);
    } else {
      // Strut recolhido
      const foldStrutGeo = new THREE.BoxGeometry(0.012, Hv * 0.7, 0.004);
      const foldStrutMesh = new THREE.Mesh(foldStrutGeo, bracketSteelMat);
      foldStrutMesh.position.set(bx, pivotY - Hv * 0.45, faceZ - D_b / 2);
      container.add(foldStrutMesh);
    }
  });

  // 2. Grupo ARTICULADO (Gira no pino superior: Madeira + Braços Horizontais)
  const pivotGroup = new THREE.Group();
  pivotGroup.name = 'ShelfPivotGroup';
  pivotGroup.position.set(0, pivotY, pivotZ);

  if (isOpen) {
    pivotGroup.rotation.x = Math.PI / 2;
  }

  // Prancha de madeira:
  // Em coordenadas locais do pivotGroup:
  // Quando rotation.x = 0 (fechada): fica pendurada para baixo ao longo de -Y.
  // A face externa (visível) fica em -Z.
  // Os braços de metal ficam em +Z (entre a madeira e o baú).
  const woodGeo = new THREE.BoxGeometry(shelfW, shelfH, shelfT);
  const woodMesh = new THREE.Mesh(woodGeo, woodMat);
  woodMesh.position.set(0, -shelfH / 2, -shelfT / 2 - 0.004);
  woodMesh.castShadow = true;
  woodMesh.receiveShadow = true;
  pivotGroup.add(woodMesh);

  // Braços horizontais do suporte (giram junto com a madeira)
  bracketXPositions.forEach((bx) => {
    // Canaleta horizontal do braço
    const armGeo = new THREE.BoxGeometry(W_b - 0.003, Lh, D_b - 0.003);
    const armMesh = new THREE.Mesh(armGeo, bracketSteelMat);
    armMesh.position.set(bx, -Lh / 2, (D_b - 0.003) / 2 - 0.003);
    pivotGroup.add(armMesh);

    // Nariz frontal arredondado
    const noseGeo = new THREE.CylinderGeometry(0.006, 0.006, W_b - 0.004, 12);
    noseGeo.rotateZ(Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, bracketSteelMat);
    noseMesh.position.set(bx, -Lh + 0.006, (D_b - 0.003) / 2 - 0.003);
    pivotGroup.add(noseMesh);

    // Alavanca / Gatilho de Liberação Rápida (Trigger Lever c/ grip preto)
    const triggerY = -Lh * 0.45;
    const leverBarGeo = new THREE.BoxGeometry(0.008, 0.045, 0.003);
    const leverBarMesh = new THREE.Mesh(leverBarGeo, bracketSteelMat);
    leverBarMesh.position.set(bx, triggerY, (D_b - 0.003) + 0.002);
    pivotGroup.add(leverBarMesh);

    const triggerTabGeo = new THREE.BoxGeometry(0.010, 0.006, 0.012);
    const triggerTabMesh = new THREE.Mesh(triggerTabGeo, triggerGripMat);
    triggerTabMesh.position.set(bx, triggerY - 0.015, (D_b - 0.003) + 0.006);
    pivotGroup.add(triggerTabMesh);
  });

  container.add(pivotGroup);
  return container;
}

const openAsm = buildAssembly(true);
const openBB = new THREE.Box3().setFromObject(openAsm);
console.log('Open Assembly Bounding Box:', {
  x: [openBB.min.x.toFixed(3), openBB.max.x.toFixed(3)],
  y: [openBB.min.y.toFixed(3), openBB.max.y.toFixed(3)],
  z: [openBB.min.z.toFixed(3), openBB.max.z.toFixed(3)]
});

const closedAsm = buildAssembly(false);
const closedBB = new THREE.Box3().setFromObject(closedAsm);
console.log('Closed Assembly Bounding Box:', {
  x: [closedBB.min.x.toFixed(3), closedBB.max.x.toFixed(3)],
  y: [closedBB.min.y.toFixed(3), closedBB.max.y.toFixed(3)],
  z: [closedBB.min.z.toFixed(3), closedBB.max.z.toFixed(3)]
});

console.log('🎉 ASSEMBLY TEST PASSED SUCCESSFULLY!');
