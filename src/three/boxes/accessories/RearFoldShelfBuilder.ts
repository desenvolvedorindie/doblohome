import * as THREE from 'three';
import { InternalBoxItem, getFoldingBracketForHeight } from '../../../types';
import {
  PLYWOOD_THICKNESS,
  getWoodMaterialName
} from '../BoxGeometryHelpers';

export function buildRearFoldShelfAccessory(
  container: THREE.Group,
  w: number,
  l: number,
  h: number,
  box: InternalBoxItem,
  isSelected: boolean,
  isOpen: boolean
) {
  const isShelfOpen = box.isRearShelfOpen !== undefined ? box.isRearShelfOpen : isOpen;
  // A prateleira rebatível traseira é sempre fixada na carcaça estrutural fixa do módulo (container),
  // permanecendo estática na face traseira mesmo quando uma gaveta/bandeja corrediça se abre.
  const targetParent = container;

  // Cálculo da mão francesa comercial ideal pela altura disponível
  const bracketSpec = getFoldingBracketForHeight(Math.round(h * 1000), box.rearShelfBracketInches);

  // Dimensões da prancha da prateleira decorativa
  const shelfTMm = box.panelThickness?.shelf || 18;
  const shelfT = shelfTMm / 1000;
  const shelfW = Math.max(0.15, w - 0.03); // Margem de 1.5cm de cada lado para a moldura do baú
  const shelfH = Math.max(0.15, Math.min(h - 0.04, 0.38)); // Profundidade da bancada

  // Geometria estrutural da mão francesa (padrão comercial em chapa de aço inox estampada)
  const W_b = 0.022; // 22mm largura da canaleta
  const D_b = 0.016; // 16mm profundidade da canaleta
  const t_s = 0.002; // 2mm espessura da chapa estampada

  const Hv = Math.min(shelfH * 0.65, bracketSpec.heightMm / 1000);
  const Lh = Math.min(shelfH * 0.85, bracketSpec.lengthMm / 1000);

  const isDrawer = box.type === 'drawer';
  const faceZ = isDrawer ? -l / 2 - PLYWOOD_THICKNESS : -l / 2;
  const pivotY = h / 2 - 0.022;
  const pivotZ = faceZ - D_b + 0.004;

  // Materiais dos suportes dobráveis em aço inoxidável escovado brilhante
  const bracketSteelMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Inox escovado brilhante / prata metalizado
    metalness: 0.94,
    roughness: 0.18
  });

  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Pinos e rebites em inox polido
    metalness: 0.98,
    roughness: 0.12
  });

  const triggerGripMat = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Grip emborrachado preto da alavanca de destravamento rápido
    metalness: 0.25,
    roughness: 0.75
  });

  // Material da madeira decorativa da prateleira
  let woodColor = 0xdf9a57; // Pinus Finger-Joint / Golden Birch (tom quente)
  let woodRoughness = 0.45;
  const woodMetalness = 0.04;
  let finishLabel = 'Pinus Finger-Joint';

  const finish = box.rearShelfFinish || 'pine_block';
  if (finish === 'teak') {
    woodColor = 0xb45309; // Teca naval
    woodRoughness = 0.40;
    finishLabel = 'Teca Naval';
  } else if (finish === 'dark_wood') {
    woodColor = 0x58240c; // Imbuia / Madeira escura nobre
    woodRoughness = 0.50;
    finishLabel = 'Imbuia Nobre';
  } else if (finish === 'plywood') {
    woodColor = 0xd4a373; // Compensado naval
    woodRoughness = 0.65;
    finishLabel = 'Compensado Naval';
  }

  const shelfMat = new THREE.MeshStandardMaterial({
    color: isSelected ? 0x38bdf8 : woodColor,
    roughness: woodRoughness,
    metalness: woodMetalness
  });

  const edgeColor = isSelected ? 0x38bdf8 : (finish === 'dark_wood' ? 0x270f05 : 0x92400e);
  const shelfEdgeMat = new THREE.LineBasicMaterial({
    color: edgeColor,
    linewidth: 1,
    transparent: true,
    opacity: 0.8
  });

  const bracketOffsetX = shelfW * 0.32;
  const bracketXPositions = [-bracketOffsetX, bracketOffsetX];

  // ─── 1. PEÇAS FIXAS: CANALETAS VERTICAIS DE FIXAÇÃO NO BAÚ (Vertical Wall Arms) ───
  bracketXPositions.forEach((bx, idx) => {
    const fixedBracketGroup = new THREE.Group();
    fixedBracketGroup.name = `FoldingBracket_Base_${idx === 0 ? 'Left' : 'Right'}`;

    // Chapa de fundo da canaleta vertical encostada na madeira do baú
    const vertBackGeo = new THREE.BoxGeometry(W_b, Hv, t_s);
    const vertBackMesh = new THREE.Mesh(vertBackGeo, bracketSteelMat);
    vertBackMesh.position.set(bx, pivotY - Hv / 2, faceZ - t_s / 2);
    fixedBracketGroup.add(vertBackMesh);

    // Flanges laterais estruturais da canaleta em U
    const vertFlangeGeo = new THREE.BoxGeometry(t_s, Hv, D_b);
    const leftFlange = new THREE.Mesh(vertFlangeGeo, bracketSteelMat);
    leftFlange.position.set(bx - W_b / 2 + t_s / 2, pivotY - Hv / 2, faceZ - D_b / 2);
    fixedBracketGroup.add(leftFlange);

    const rightFlange = new THREE.Mesh(vertFlangeGeo, bracketSteelMat);
    rightFlange.position.set(bx + W_b / 2 - t_s / 2, pivotY - Hv / 2, faceZ - D_b / 2);
    fixedBracketGroup.add(rightFlange);

    // Parafusos escareados inox de fixação no painel
    [Hv * 0.15, Hv * 0.50, Hv * 0.85].forEach((offY) => {
      const screwGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 10);
      screwGeo.rotateX(Math.PI / 2);
      const screwMesh = new THREE.Mesh(screwGeo, rivetMat);
      screwMesh.position.set(bx, pivotY - offY, faceZ - t_s);
      fixedBracketGroup.add(screwMesh);
    });

    // Eixo / Pino fixo da articulação superior
    const mainPivotPinGeo = new THREE.CylinderGeometry(0.0035, 0.0035, W_b + 0.004, 16);
    mainPivotPinGeo.rotateZ(Math.PI / 2);
    const mainPivotPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
    mainPivotPin.position.set(bx, pivotY, pivotZ);
    fixedBracketGroup.add(mainPivotPin);

    // Pino fixo inferior da haste diagonal
    const lowerPivotY = pivotY - Hv * 0.75;
    const lowerPivotZ = faceZ - D_b * 0.65;
    const lowerPivotPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
    lowerPivotPin.position.set(bx, lowerPivotY, lowerPivotZ);
    fixedBracketGroup.add(lowerPivotPin);

    // Haste Diagonal Articulada com Trava
    if (isShelfOpen) {
      // MODO ABERTO: Haste a ~45°-60° com pino de trava encaixado sob o braço horizontal
      const upperLockY = pivotY - 0.009; // Posicionada sob a canaleta horizontal, abaixo da madeira
      const upperLockZ = faceZ - D_b - Lh * 0.62;
      const dY = upperLockY - lowerPivotY;
      const dZ = upperLockZ - lowerPivotZ;
      const strutLength = Math.sqrt(dY * dY + dZ * dZ);
      const strutAngle = Math.atan2(dZ, dY);

      const strutGeo = new THREE.BoxGeometry(0.012, strutLength, 0.004);
      const strutMesh = new THREE.Mesh(strutGeo, bracketSteelMat);
      strutMesh.position.set(bx, (lowerPivotY + upperLockY) / 2, (lowerPivotZ + upperLockZ) / 2);
      strutMesh.rotation.x = strutAngle;
      fixedBracketGroup.add(strutMesh);

      const lockPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
      lockPin.position.set(bx, upperLockY, upperLockZ);
      fixedBracketGroup.add(lockPin);
    } else {
      // MODO FECHADO: Haste articulada dobrada recolhida dentro da canaleta
      const foldStrutGeo = new THREE.BoxGeometry(0.012, Hv * 0.7, 0.004);
      const foldStrutMesh = new THREE.Mesh(foldStrutGeo, bracketSteelMat);
      foldStrutMesh.position.set(bx, pivotY - Hv * 0.45, faceZ - D_b / 2);
      fixedBracketGroup.add(foldStrutMesh);
    }

    fixedBracketGroup.userData = {
      isHardware: true,
      partLabel: `Suporte Articulado Dobrável c/ Trava Inox ${bracketSpec.inches}" (${bracketSpec.lengthMm} mm) (Par)`,
      name: 'Mão Francesa Dobrável Inox c/ Gatilho (2PCS)',
      category: '🔩 Ferragens de Sustentação & Articulação',
      purpose: 'Suporte dobrável de aço inox escovado com trava automática 90° e gatilho de liberação rápida para bancada/mesa traseira'
    };

    targetParent.add(fixedBracketGroup);
  });

  // ─── 2. GRUPO MÓVEL / ARTICULADO (TAMPO DE MADEIRA + BRAÇOS HORIZONTAIS C/ GATILHO) ───
  const shelfPivot = new THREE.Group();
  shelfPivot.name = 'RearFoldShelfPivot';
  shelfPivot.position.set(0, pivotY, pivotZ);

  if (isShelfOpen) {
    shelfPivot.rotation.x = Math.PI / 2;
  }

  // Tampo de Madeira Maciça de 18mm
  const shelfGeo = new THREE.BoxGeometry(shelfW, shelfH, shelfT);
  const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
  shelfMesh.position.set(0, -shelfH / 2, -shelfT / 2 - 0.003);
  shelfMesh.castShadow = true;
  shelfMesh.receiveShadow = true;
  const shelfWoodMaterial = finish === 'plywood'
    ? 'Compensado Naval'
    : (finish === 'dark_wood' || finish === 'teak' ? 'Madeira Nobre Maciça' : getWoodMaterialName(box.material));

  shelfMesh.userData = {
    isWoodPart: true,
    dimW: shelfW,
    dimH: shelfT,
    dimL: shelfH,
    thicknessMm: shelfTMm,
    partLabel: `${box.name} • Prateleira Rebatível Traseira [${finishLabel} ${shelfTMm}mm]`,
    isInternalBox: Boolean(box.id),
    boxId: box.id,
    boxRoot: container,
    isRearShelf: true,
    material: `${shelfWoodMaterial} ${shelfTMm}mm (${finishLabel})`,
    woodMaterial: shelfWoodMaterial,
    moduleName: box.name,
    partType: 'shelf'
  };
  shelfPivot.add(shelfMesh);

  const shelfEdgeGeo = new THREE.EdgesGeometry(shelfGeo);
  const shelfEdgeLine = new THREE.LineSegments(shelfEdgeGeo, shelfEdgeMat);
  shelfEdgeLine.position.copy(shelfMesh.position);
  shelfPivot.add(shelfEdgeLine);

  // Braços Horizontais aparafusados sob o tampo de madeira (Giram junto com o tampo)
  bracketXPositions.forEach((bx) => {
    // Canaleta do braço horizontal em U invertido
    const armGeo = new THREE.BoxGeometry(W_b - 0.003, Lh, D_b - 0.003);
    const armMesh = new THREE.Mesh(armGeo, bracketSteelMat);
    armMesh.position.set(bx, -Lh / 2, (D_b - 0.003) / 2 - 0.003);
    shelfPivot.add(armMesh);

    // Nariz frontal arredondado característico da mão francesa estampada
    const noseGeo = new THREE.CylinderGeometry(0.006, 0.006, W_b - 0.004, 12);
    noseGeo.rotateZ(Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, bracketSteelMat);
    noseMesh.position.set(bx, -Lh + 0.006, (D_b - 0.003) / 2 - 0.003);
    shelfPivot.add(noseMesh);

    // Alavanca / Gatilho de Liberação Rápida com mola (Release Trigger)
    const triggerY = -Lh * 0.45;
    const leverBarGeo = new THREE.BoxGeometry(0.008, 0.045, 0.003);
    const leverBarMesh = new THREE.Mesh(leverBarGeo, bracketSteelMat);
    leverBarMesh.position.set(bx, triggerY, (D_b - 0.003) + 0.002);
    shelfPivot.add(leverBarMesh);

    const triggerTabGeo = new THREE.BoxGeometry(0.010, 0.006, 0.012);
    const triggerTabMesh = new THREE.Mesh(triggerTabGeo, triggerGripMat);
    triggerTabMesh.position.set(bx, triggerY - 0.015, (D_b - 0.003) + 0.006);
    shelfPivot.add(triggerTabMesh);
  });

  targetParent.add(shelfPivot);
}
