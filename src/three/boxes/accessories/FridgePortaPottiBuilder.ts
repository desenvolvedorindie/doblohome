import * as THREE from 'three';
import { InternalBoxItem } from '../../../types';
import { getBoxThickness } from '../BoxGeometryHelpers';
import { DEFAULT_FRIDGE_PRESETS, loadFridgePresets } from '../../../data/fridgePresets';
import { DEFAULT_PORTAPOTTI_PRESETS, loadPortaPottiPresets } from '../../../data/portaPottiPresets';

/**
 * Constrói e instala a Geladeira Portátil 12V/24V (Resfri Ar 35L ou preset selecionado)
 * no interior do módulo (gavetão corrediço, bandeja retrátil ou baú).
 */
export function buildFridgeApplianceAccessory(
  container: THREE.Group,
  w: number,
  l: number,
  h: number,
  box: InternalBoxItem,
  _isSelected: boolean
) {
  const drawerSlide = container.getObjectByName('DrawerSlide') as THREE.Group;
  const targetParent = drawerSlide || container;

  const allPresets = loadFridgePresets();
  const preset = (box.fridgePresetId && allPresets.find(p => p.id === box.fridgePresetId)) || DEFAULT_FRIDGE_PRESETS[0];

  const fw = preset.width / 1000;
  const fd = preset.depth / 1000;
  const fh = preset.height / 1000;

  const fridgeGroup = new THREE.Group();
  fridgeGroup.name = `FridgeAppliance_${box.id}`;

  // 1. Corpo principal em polipropileno/ABS grafite escuro
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1f2630,
    roughness: 0.55,
    metalness: 0.15
  });

  const bodyGeo = new THREE.BoxGeometry(fw, fh * 0.88, fd);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.set(0, -fh * 0.06, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  fridgeGroup.add(bodyMesh);

  // 2. Tampa superior com fecho e puxador
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x333d4b,
    roughness: 0.45,
    metalness: 0.2
  });
  const lidGeo = new THREE.BoxGeometry(fw + 0.004, fh * 0.12, fd + 0.004);
  const lidMesh = new THREE.Mesh(lidGeo, lidMat);
  lidMesh.position.set(0, fh / 2 - (fh * 0.12) / 2, 0);
  lidMesh.castShadow = true;
  fridgeGroup.add(lidMesh);

  // 3. Fecho/trava frontal
  const latchMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.3,
    metalness: 0.8
  });
  const latchGeo = new THREE.BoxGeometry(fw * 0.28, 0.016, 0.018);
  const latchMesh = new THREE.Mesh(latchGeo, latchMat);
  latchMesh.position.set(0, fh / 2 - 0.015, -fd / 2 - 0.004);
  fridgeGroup.add(latchMesh);

  // 4. Grelhas de ventilação lateral para o compressor
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
    metalness: 0.3
  });
  const grilleGeo = new THREE.BoxGeometry(0.006, fh * 0.35, fd * 0.28);
  const grilleL = new THREE.Mesh(grilleGeo, grilleMat);
  grilleL.position.set(fw / 2 + 0.001, -fh * 0.15, fd * 0.25);
  fridgeGroup.add(grilleL);

  const grilleR = new THREE.Mesh(grilleGeo, grilleMat);
  grilleR.position.set(-fw / 2 - 0.001, -fh * 0.15, fd * 0.25);
  fridgeGroup.add(grilleR);

  // 6. Alças laterais de transporte
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.6
  });
  const handleGeo = new THREE.BoxGeometry(0.012, 0.03, fd * 0.24);
  const handleL = new THREE.Mesh(handleGeo, handleMat);
  handleL.position.set(fw / 2 + 0.004, fh * 0.15, 0);
  fridgeGroup.add(handleL);

  const handleR = new THREE.Mesh(handleGeo, handleMat);
  handleR.position.set(-fw / 2 - 0.004, fh * 0.15, 0);
  fridgeGroup.add(handleR);

  // ── ROTAÇÃO & POSICIONAMENTO DA GELADEIRA NO MÓDULO ──
  const isRotated90 = (box.fridgeRotation === 90 || box.fridgeRotation === 270);
  if (box.fridgeRotation !== undefined) {
    fridgeGroup.rotation.y = (box.fridgeRotation * Math.PI) / 180;
  } else if (drawerSlide) {
    // Se a bandeja desliza para a esquerda ou direita e a profundidade da geladeira for maior que a largura do módulo, rotaciona 90°
    const slideDir = drawerSlide.userData.slideDirection;
    if ((slideDir === 'left' || slideDir === 'right') && preset.depth > preset.width && w > l) {
      fridgeGroup.rotation.y = Math.PI / 2;
    }
  }

  const isInsideDrawer = Boolean(drawerSlide && drawerSlide.userData?.dL !== undefined);
  const trayT = (drawerSlide?.userData?.tBottom) || 0.015;
  const availW = isInsideDrawer ? Math.max(0.01, drawerSlide.userData.dW - 2 * trayT - 0.006) : Math.max(0.01, w - 0.04);
  const availD = isInsideDrawer ? Math.max(0.01, drawerSlide.userData.dL - 2 * trayT - 0.006) : Math.max(0.01, l - 0.04);

  const effectiveW = isRotated90 ? fd : fw;
  const effectiveD = isRotated90 ? fw : fd;
  const slackX = Math.max(0, (availW - effectiveW) / 2);
  const slackZ = Math.max(0, (availD - effectiveD) / 2);

  let alignXOffset = 0;
  if (box.fridgeAlignX === 'left') alignXOffset = -slackX;
  else if (box.fridgeAlignX === 'right') alignXOffset = slackX;

  let alignZOffset = 0;
  if (box.fridgeAlignZ === 'front') alignZOffset = -slackZ;
  else if (box.fridgeAlignZ === 'back') alignZOffset = slackZ;

  const fineOffsetX = (box.fridgeOffsetX || 0) / 1000;
  const fineOffsetZ = (box.fridgeOffsetZ || 0) / 1000;

  // Posição no interior do módulo (assentada no fundo ou na bandeja corrediça deslizante)
  if (drawerSlide && drawerSlide.userData?.trayTopY !== undefined) {
    const posX = (drawerSlide.userData.cabCenterX || 0) + alignXOffset + fineOffsetX;
    const posZ = (drawerSlide.userData.cabCenterZ || 0) + alignZOffset + fineOffsetZ;
    const posY = drawerSlide.userData.trayTopY + fh / 2;
    fridgeGroup.position.set(posX, posY, posZ);
  } else {
    const posX = alignXOffset + fineOffsetX;
    const posZ = alignZOffset + fineOffsetZ;
    const tConfig = getBoxThickness(box);
    const hasBottom = Boolean(box.panels?.bottom);
    const bottomThickness = hasBottom ? tConfig.bottom : 0;
    const bottomY = -h / 2 + fh / 2 + bottomThickness;
    fridgeGroup.position.set(posX, bottomY, posZ);
  }

  const partData = {
    isAppliance: true,
    isFridge: true,
    boxId: box.id,
    boxRoot: container,
    applianceRoot: fridgeGroup,
    partLabel: `${preset.name} (${preset.volumeLiters}L)`,
    name: `${preset.brand} ${preset.model} (12V/24V)`,
    category: '❄️ Refrigeração Automotiva 12V',
    power: `${preset.powerEcoWatts}W ECO / ${preset.powerMaxWatts}W MAX`,
    capacity: `${preset.volumeLiters} Litros (${preset.canCapacity350ml || 46} latas 350ml)`,
    dimensions: {
      widthMm: preset.width,
      depthMm: preset.depth,
      heightMm: preset.height
    },
    weightKg: preset.weightKg,
    voltage: preset.voltage,
    tempRange: preset.tempRange,
    features: preset.features,
    purpose: `Geladeira veicular portátil instalada no módulo '${box.name}'. Opera com compressor 12V e controle Bluetooth via smartphone.`
  };

  fridgeGroup.userData = partData;
  fridgeGroup.traverse((c: any) => {
    if (c.isMesh) {
      c.userData = partData;
    }
  });

  targetParent.add(fridgeGroup);
}

/**
 * Constrói e instala o Vaso Sanitário Químico Portátil Porta Potti (Seaflo 20L ou preset selecionado)
 * no interior do módulo (gavetão corrediço, bandeja retrátil ou baú).
 */
export function buildPortaPottiApplianceAccessory(
  container: THREE.Group,
  w: number,
  l: number,
  h: number,
  box: InternalBoxItem,
  _isSelected: boolean
) {
  const drawerSlide = container.getObjectByName('DrawerSlide') as THREE.Group;
  const targetParent = drawerSlide || container;

  const allPresets = loadPortaPottiPresets();
  const preset = (box.portaPottiPresetId && allPresets.find(p => p.id === box.portaPottiPresetId)) || DEFAULT_PORTAPOTTI_PRESETS[0];

  // Dimensões nominais do porta potti ajustadas à escala do módulo
  const pw = preset.width / 1000;   // Largura real do preset (transversal)
  const pd = preset.depth / 1000;   // Profundidade real do preset (longitudinal)
  const ph = preset.height / 1000;  // Altura total real do preset

  const portaPottiGroup = new THREE.Group();
  portaPottiGroup.name = `PortaPottiAppliance_${box.id}`;

  // Materiais plásticos ABS com acabamento semi-brilhante sanitário
  const lowerTankMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Cinza claro / polietileno de alta densidade
    roughness: 0.45,
    metalness: 0.08
  });

  const upperTankMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Branco marfim suave sanitário
    roughness: 0.35,
    metalness: 0.05
  });

  const seatLidMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Branco brilhante ABS
    roughness: 0.25,
    metalness: 0.05
  });

  // 1. Tanque inferior de dejetos (Waste Tank) - ~48% da altura
  const lowerH = ph * 0.48;
  const lowerGeo = new THREE.BoxGeometry(pw * 0.96, lowerH, pd * 0.96);
  const lowerMesh = new THREE.Mesh(lowerGeo, lowerTankMat);
  lowerMesh.position.set(0, -ph / 2 + lowerH / 2, 0);
  lowerMesh.castShadow = true;
  lowerMesh.receiveShadow = true;
  portaPottiGroup.add(lowerMesh);

  // 2. Tanque superior de água limpa e bacia sanitária - ~44% da altura
  const upperH = ph * 0.44;
  const upperGeo = new THREE.BoxGeometry(pw, upperH, pd);
  const upperMesh = new THREE.Mesh(upperGeo, upperTankMat);
  upperMesh.position.set(0, -ph / 2 + lowerH + upperH / 2, 0);
  upperMesh.castShadow = true;
  upperMesh.receiveShadow = true;
  portaPottiGroup.add(upperMesh);

  // 3. Assento e Tampa com Fechamento Suave (Soft Close Lid)
  const lidH = 0.022;
  const lidGeo = new THREE.BoxGeometry(pw * 0.94, lidH, pd * 0.94);
  const lidMesh = new THREE.Mesh(lidGeo, seatLidMat);
  lidMesh.position.set(0, -ph / 2 + lowerH + upperH + lidH / 2, 0);
  lidMesh.castShadow = true;
  portaPottiGroup.add(lidMesh);

  // Friso de relevo ergonômico na tampa
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.4
  });
  const rimGeo = new THREE.BoxGeometry(pw * 0.88, 0.006, pd * 0.88);
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.set(0, -ph / 2 + lowerH + upperH + lidH + 0.003, 0);
  portaPottiGroup.add(rimMesh);

  // 4. Botão da Bomba de Pistão Manual (Top Corner)
  const pumpGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.024, 16);
  const pumpMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Azul Seaflo
    metalness: 0.3,
    roughness: 0.3
  });
  const pumpMesh = new THREE.Mesh(pumpGeo, pumpMat);
  pumpMesh.position.set(-pw * 0.36, -ph / 2 + lowerH + upperH + 0.012, -pd * 0.36);
  portaPottiGroup.add(pumpMesh);

  // 5. Tampa de abastecimento do reservatório de água limpa
  const capGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.014, 16);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.2,
    roughness: 0.4
  });
  const capMesh = new THREE.Mesh(capGeo, capMat);
  capMesh.position.set(pw * 0.36, -ph / 2 + lowerH + upperH + 0.007, -pd * 0.36);
  portaPottiGroup.add(capMesh);

  // ── ROTAÇÃO & POSICIONAMENTO DO SANITÁRIO QUÍMICO NO MÓDULO ──
  const isRotated90 = (box.portaPottiRotation === 90 || box.portaPottiRotation === 270);
  if (box.portaPottiRotation !== undefined) {
    portaPottiGroup.rotation.y = (box.portaPottiRotation * Math.PI) / 180;
  }

  const isInsideDrawer = Boolean(drawerSlide && drawerSlide.userData?.dL !== undefined);
  const trayT = (drawerSlide?.userData?.tBottom) || 0.015;
  const availW = isInsideDrawer ? Math.max(0.01, drawerSlide.userData.dW - 2 * trayT - 0.006) : Math.max(0.01, w - 0.04);
  const availD = isInsideDrawer ? Math.max(0.01, drawerSlide.userData.dL - 2 * trayT - 0.006) : Math.max(0.01, l - 0.04);

  const effectiveW = isRotated90 ? pd : pw;
  const effectiveD = isRotated90 ? pw : pd;
  const slackX = Math.max(0, (availW - effectiveW) / 2);
  const slackZ = Math.max(0, (availD - effectiveD) / 2);

  let alignXOffset = 0;
  if (box.portaPottiAlignX === 'left') alignXOffset = -slackX;
  else if (box.portaPottiAlignX === 'right') alignXOffset = slackX;

  let alignZOffset = 0;
  if (box.portaPottiAlignZ === 'front') alignZOffset = -slackZ;
  else if (box.portaPottiAlignZ === 'back') alignZOffset = slackZ;

  const fineOffsetX = (box.portaPottiOffsetX || 0) / 1000;
  const fineOffsetZ = (box.portaPottiOffsetZ || 0) / 1000;

  // Posição no interior do módulo (assentado no piso do gavetão, bandeja corrediça ou baú)
  if (drawerSlide && drawerSlide.userData?.trayTopY !== undefined) {
    const posX = (drawerSlide.userData.cabCenterX || 0) + alignXOffset + fineOffsetX;
    const posZ = (drawerSlide.userData.cabCenterZ || 0) + alignZOffset + fineOffsetZ;
    const posY = drawerSlide.userData.trayTopY + ph / 2;
    portaPottiGroup.position.set(posX, posY, posZ);
  } else {
    const posX = alignXOffset + fineOffsetX;
    const posZ = alignZOffset + fineOffsetZ;
    const tConfig = getBoxThickness(box);
    const hasBottom = Boolean(box.panels?.bottom);
    const bottomThickness = hasBottom ? tConfig.bottom : 0;
    const bottomY = -h / 2 + ph / 2 + bottomThickness;
    portaPottiGroup.position.set(posX, bottomY, posZ);
  }

  const partData = {
    isAppliance: true,
    isPortaPotti: true,
    boxId: box.id,
    boxRoot: container,
    applianceRoot: portaPottiGroup,
    partLabel: `${preset.name} (${preset.wasteCapacityLiters}L)`,
    name: `${preset.brand} ${preset.model} (${preset.wasteCapacityLiters}L Dejetos)`,
    category: '🚽 Sanitário Químico Portátil',
    capacity: `${preset.wasteCapacityLiters}L Dejetos / ${preset.freshWaterCapacityLiters}L Água Limpa`,
    dimensions: {
      widthMm: preset.width,
      depthMm: preset.depth,
      heightMm: preset.height
    },
    weightKg: preset.weightEmptyKg,
    weightFullKg: preset.weightFullKg,
    maxLoadKg: preset.maxLoadKg,
    flushType: preset.flushType,
    material: preset.material,
    hasSoftClose: preset.hasSoftClose,
    features: preset.features,
    purpose: `Vaso sanitário químico portátil instalado no módulo '${box.name}'. Conta com reservatório de dejetos de 20L, tampa Soft Close e válvula hermética antivazamento.`
  };

  portaPottiGroup.userData = partData;
  portaPottiGroup.traverse((c: any) => {
    if (c.isMesh) {
      c.userData = partData;
    }
  });

  targetParent.add(portaPottiGroup);
}
