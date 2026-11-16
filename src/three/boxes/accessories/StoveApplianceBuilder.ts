import * as THREE from 'three';
import { InternalBoxItem, StovePreset } from '../../../types';
import { DEFAULT_STOVE_PRESETS, loadStovePresets } from '../../../data/stovePresets';

/**
 * Constrói e instala o Fogareiro Portátil (NTK Duo Ceramik ou preset selecionado)
 * no interior do módulo (gaveta, bandeja corrediça ou baú), sobre o tampo superior
 * ou sobre a mesa/prateleira rebatível traseira.
 */
export function buildStoveApplianceAccessory(
  container: THREE.Group,
  w: number,
  l: number,
  h: number,
  box: InternalBoxItem,
  _isSelected: boolean,
  _isOpen: boolean = false,
  isBedOpen: boolean = false
) {
  const placement = box.stovePlacement || 'inside';

  // Quando a cama está aberta, o fogareiro posicionado em cima do móvel ('top') some para dar lugar à cama
  if (placement === 'top' && isBedOpen) {
    return;
  }

  const drawerSlide = container.getObjectByName('DrawerSlide') as THREE.Group | undefined;
  const targetParent = drawerSlide || container;

  const allPresets = loadStovePresets();
  const preset: StovePreset =
    (box.stovePresetId && allPresets.find(p => p.id === box.stovePresetId)) ||
    DEFAULT_STOVE_PRESETS[0];

  const isRotated = box.stoveRotation === 90;

  const swRaw = preset.width / 1000;
  const sdRaw = preset.depth / 1000;
  const shRaw = preset.height / 1000;

  let scale = 1;
  if (placement === 'inside') {
    const availW = Math.max(0.12, w - 0.036);
    const availD = Math.max(0.12, l - 0.036);
    const availH = Math.max(0.05, h - 0.024);
    const effW = isRotated ? sdRaw : swRaw;
    const effD = isRotated ? swRaw : sdRaw;
    scale = Math.min(1, availW / effW, availD / effD, availH / shRaw);
  }

  const sw = swRaw * scale;
  const sd = sdRaw * scale;
  const sh = shRaw * scale;

  const stoveGroup = new THREE.Group();
  stoveGroup.name = `StoveAppliance_${box.id}`;
  stoveGroup.rotation.y = isRotated ? Math.PI / 2 : 0;

  const isInox = preset.id === 'ntk-bistro-inox' || preset.material.toLowerCase().includes('inox');
  const isCeramic = preset.burnerType.toLowerCase().includes('cerâm') || preset.burnerType.toLowerCase().includes('ceram');

  // Materiais realistas do NTK Duo Ceramik
  const chassisMat = new THREE.MeshStandardMaterial({
    color: isInox ? 0xcbd5e1 : 0x5c3a21, // Bronze terroso esmaltado característico do NTK Duo Ceramik (ou inox)
    roughness: isInox ? 0.25 : 0.34,
    metalness: isInox ? 0.85 : 0.38
  });

  const darkSkirtMat = new THREE.MeshStandardMaterial({
    color: 0x111827, // Base inferior e painel preto fosco
    roughness: 0.6,
    metalness: 0.25
  });

  const enamelTrayMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Bandeja coletora em enamel atóxico preto brilhante
    roughness: 0.22,
    metalness: 0.32
  });

  const stainlessMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Aço inox escovado para aro do queimador e detalhes
    roughness: 0.22,
    metalness: 0.9
  });

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7, // Placa cerâmica porosa infravermelho (favo de mel)
    emissive: 0xea580c,
    emissiveIntensity: 0.22,
    roughness: 0.85,
    metalness: 0.02
  });

  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937, // Trempe / apoio de panelas em aço esmaltado
    roughness: 0.45,
    metalness: 0.55
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Conector de latão dourado Flex Fuel para botijão GLP
    roughness: 0.25,
    metalness: 0.88
  });

  const redAccentMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Trava de segurança / marcador de ignição Piezo
    roughness: 0.35,
    metalness: 0.2
  });

  // 1. 4 Sapatas emborrachadas na base
  const footH = sh * 0.1;
  const footGeo = new THREE.CylinderGeometry(0.011 * scale, 0.013 * scale, footH, 12);
  const footPositions: [number, number][] = [
    [-sw * 0.42, -sd * 0.40],
    [sw * 0.42, -sd * 0.40],
    [-sw * 0.42, sd * 0.40],
    [sw * 0.42, sd * 0.40]
  ];
  footPositions.forEach(([fx, fz]) => {
    const foot = new THREE.Mesh(footGeo, darkSkirtMat);
    foot.position.set(fx, -sh / 2 + footH / 2, fz);
    stoveGroup.add(foot);
  });

  // 2. Saia inferior e chassi principal em aço esmaltado epóxi
  const skirtH = sh * 0.14;
  const skirtGeo = new THREE.BoxGeometry(sw * 0.98, skirtH, sd * 0.98);
  const skirtMesh = new THREE.Mesh(skirtGeo, darkSkirtMat);
  skirtMesh.position.set(0, -sh / 2 + footH + skirtH / 2, 0);
  skirtMesh.castShadow = true;
  skirtMesh.receiveShadow = true;
  stoveGroup.add(skirtMesh);

  const bodyH = sh * 0.50;
  const bodyBaseY = -sh / 2 + footH + skirtH;
  const bodyCenterY = bodyBaseY + bodyH / 2;
  const bodyTopY = bodyBaseY + bodyH;

  const bodyGeo = new THREE.BoxGeometry(sw, bodyH, sd);
  const bodyMesh = new THREE.Mesh(bodyGeo, chassisMat);
  bodyMesh.position.set(0, bodyCenterY, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  stoveGroup.add(bodyMesh);

  // Helper para construir um conjunto queimador + bandeja + trempe
  const addBurnerAssembly = (bx: number, bz: number, radiusScale: number) => {
    const traySize = Math.min(sw * 0.56, sd * 0.78) * radiusScale;
    const trayGeo = new THREE.BoxGeometry(traySize, 0.008 * scale, traySize);
    const trayMesh = new THREE.Mesh(trayGeo, enamelTrayMat);
    trayMesh.position.set(bx, bodyTopY + 0.002 * scale, bz);
    trayMesh.receiveShadow = true;
    stoveGroup.add(trayMesh);

    // Rebaixo circular da bandeja
    const bowlOuterR = traySize * 0.36;
    const bowlGeo = new THREE.CylinderGeometry(bowlOuterR, bowlOuterR * 0.85, 0.006 * scale, 24);
    const bowlMesh = new THREE.Mesh(bowlGeo, enamelTrayMat);
    bowlMesh.position.set(bx, bodyTopY + 0.006 * scale, bz);
    stoveGroup.add(bowlMesh);

    // Anel protetor do queimador em aço inox
    const burnerOuterR = traySize * 0.23;
    const ringGeo = new THREE.CylinderGeometry(burnerOuterR, burnerOuterR * 1.06, 0.012 * scale, 24);
    const ringMesh = new THREE.Mesh(ringGeo, stainlessMat);
    ringMesh.position.set(bx, bodyTopY + 0.010 * scale, bz);
    stoveGroup.add(ringMesh);

    // Núcleo do queimador (Cerâmica infravermelho vs Coroa alumínio)
    const coreR = burnerOuterR * 0.78;
    const coreGeo = new THREE.CylinderGeometry(coreR, coreR, 0.0135 * scale, 24);
    const coreMesh = new THREE.Mesh(coreGeo, isCeramic ? ceramicMat : stainlessMat);
    coreMesh.position.set(bx, bodyTopY + 0.0105 * scale, bz);
    stoveGroup.add(coreMesh);

    if (isCeramic) {
      // Anel metálico central característico do queimador cerâmico
      const centerCapGeo = new THREE.CylinderGeometry(coreR * 0.22, coreR * 0.22, 0.015 * scale, 16);
      const centerCap = new THREE.Mesh(centerCapGeo, stainlessMat);
      centerCap.position.set(bx, bodyTopY + 0.011 * scale, bz);
      stoveGroup.add(centerCap);
    }

    // Trempe / Apoio de panelas removível com 4 hastes radiais
    const trempeH = Math.max(0.010 * scale, sh - (bodyTopY + sh / 2) - 0.004 * scale);
    const trempeY = bodyTopY + trempeH * 0.65;
    const trempeRingR = traySize * 0.42;

    const trempeRingGeo = new THREE.TorusGeometry(trempeRingR, 0.0032 * scale, 8, 28);
    trempeRingGeo.rotateX(Math.PI / 2);
    const trempeRing = new THREE.Mesh(trempeRingGeo, castIronMat);
    trempeRing.position.set(bx, trempeY, bz);
    trempeRing.castShadow = true;
    stoveGroup.add(trempeRing);

    // 4 braços de suporte da trempe
    const armLen = trempeRingR * 0.85;
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((ang) => {
      const armGroup = new THREE.Group();
      armGroup.position.set(bx, trempeY + 0.003 * scale, bz);
      armGroup.rotation.y = ang + Math.PI / 4;

      const armGeo = new THREE.BoxGeometry(armLen, 0.007 * scale, 0.004 * scale);
      const armMesh = new THREE.Mesh(armGeo, castIronMat);
      armMesh.position.set(trempeRingR * 0.62, 0, 0);
      armMesh.castShadow = true;
      armGroup.add(armMesh);
      stoveGroup.add(armGroup);
    });
  };

  const interactiveMeshes: THREE.Mesh[] = [bodyMesh, skirtMesh];

  if (preset.burnersCount >= 2) {
    // Fogareiro 2 Bocas
    addBurnerAssembly(sw * 0.24, 0, 0.72);
    addBurnerAssembly(-sw * 0.24, 0, 0.72);

    // 2 Botões frontais
    [-sw * 0.24, sw * 0.24].forEach((kx) => {
      const knobGeo = new THREE.CylinderGeometry(0.015 * scale, 0.016 * scale, 0.014 * scale, 18);
      knobGeo.rotateX(Math.PI / 2);
      const knob = new THREE.Mesh(knobGeo, darkSkirtMat);
      knob.position.set(kx, bodyCenterY, -sd / 2 - 0.007 * scale);
      stoveGroup.add(knob);
    });

    // Entrada lateral de mangueira GLP em latão
    const nozzleGeo = new THREE.CylinderGeometry(0.006 * scale, 0.006 * scale, 0.020 * scale, 12);
    nozzleGeo.rotateZ(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, brassMat);
    nozzle.position.set(-sw / 2 - 0.009 * scale, bodyCenterY, sd * 0.25);
    stoveGroup.add(nozzle);
  } else {
    // Fogareiro 1 Boca (NTK Duo Ceramik / Frontier / Bistro)
    // Queimador à esquerda (+X na visão traseira)
    addBurnerAssembly(sw * 0.13, 0, 1.0);

    // Compartimento lateral do cartucho Campgás à direita (-X)
    const bayW = sw * 0.26;
    const bayLidGeo = new THREE.BoxGeometry(bayW, 0.008 * scale, sd * 0.80);
    const bayLidMesh = new THREE.Mesh(bayLidGeo, chassisMat);
    bayLidMesh.position.set(-sw * 0.34, bodyTopY + 0.003 * scale, sd * 0.06);
    bayLidMesh.castShadow = true;
    stoveGroup.add(bayLidMesh);
    interactiveMeshes.push(bayLidMesh);

    // Ranhuras de ventilação na tampa do cartucho
    for (let i = -1; i <= 1; i++) {
      const ventGeo = new THREE.BoxGeometry(bayW * 0.55, 0.002 * scale, 0.008 * scale);
      const vent = new THREE.Mesh(ventGeo, darkSkirtMat);
      vent.position.set(-sw * 0.34, bodyTopY + 0.007 * scale, sd * 0.06 + i * 0.025 * scale);
      stoveGroup.add(vent);
    }

    // Painel de controle frontal direito (-X, face -Z)
    const panelGeo = new THREE.BoxGeometry(bayW * 0.96, bodyH * 0.86, 0.006 * scale);
    const panelMesh = new THREE.Mesh(panelGeo, darkSkirtMat);
    panelMesh.position.set(-sw * 0.34, bodyCenterY, -sd / 2 - 0.002 * scale);
    stoveGroup.add(panelMesh);
    interactiveMeshes.push(panelMesh);

    // Knob giratório de ignição Piezoelétrica + controle de chama
    const knobGeo = new THREE.CylinderGeometry(0.017 * scale, 0.019 * scale, 0.015 * scale, 20);
    knobGeo.rotateX(Math.PI / 2);
    const knobMesh = new THREE.Mesh(knobGeo, castIronMat);
    knobMesh.position.set(-sw * 0.31, bodyCenterY + 0.002 * scale, -sd / 2 - 0.009 * scale);
    stoveGroup.add(knobMesh);

    const indicatorGeo = new THREE.BoxGeometry(0.004 * scale, 0.012 * scale, 0.003 * scale);
    const indicator = new THREE.Mesh(indicatorGeo, redAccentMat);
    indicator.position.set(-sw * 0.31, bodyCenterY + 0.008 * scale, -sd / 2 - 0.017 * scale);
    stoveGroup.add(indicator);

    // Alavanca vertical de trava do cartucho (LOCK / UNLOCK)
    const lockSlotGeo = new THREE.BoxGeometry(0.010 * scale, bodyH * 0.55, 0.006 * scale);
    const lockLever = new THREE.Mesh(lockSlotGeo, redAccentMat);
    lockLever.position.set(-sw * 0.41, bodyCenterY, -sd / 2 - 0.006 * scale);
    stoveGroup.add(lockLever);

    // Adaptador lateral em latão dourado Flex Fuel (para mangueira de botijão GLP)
    if (preset.dualFuelAdapter) {
      const adapterNutGeo = new THREE.CylinderGeometry(0.009 * scale, 0.009 * scale, 0.008 * scale, 6);
      adapterNutGeo.rotateZ(Math.PI / 2);
      const adapterNut = new THREE.Mesh(adapterNutGeo, brassMat);
      adapterNut.position.set(-sw / 2 - 0.004 * scale, bodyCenterY, -sd * 0.14);
      stoveGroup.add(adapterNut);

      const nozzleGeo = new THREE.CylinderGeometry(0.0045 * scale, 0.0055 * scale, 0.016 * scale, 12);
      nozzleGeo.rotateZ(Math.PI / 2);
      const nozzle = new THREE.Mesh(nozzleGeo, brassMat);
      nozzle.position.set(-sw / 2 - 0.014 * scale, bodyCenterY, -sd * 0.14);
      stoveGroup.add(nozzle);
    }
  }

  // Metadados para Tooltip 3D e seleção da caixa
  const partData = {
    isAppliance: true,
    isStove: true,
    isInternalBox: true,
    boxId: box.id,
    boxName: box.name,
    boxRoot: container,
    applianceRoot: stoveGroup,
    partLabel: `${preset.name} (${preset.burnersCount} ${preset.burnersCount === 1 ? 'Boca' : 'Bocas'})`,
    name: `${preset.brand} ${preset.model}`,
    category: '🔥 Fogareiro Portátil a Gás (Flex Fuel)',
    power: `${preset.gasConsumptionGh} g/h • ${preset.burnerType}`,
    capacity: `${preset.burnersCount} ${preset.burnersCount === 1 ? 'Boca' : 'Bocas'} • ${preset.fuelType}`,
    dimensions: {
      widthMm: preset.width,
      depthMm: preset.depth,
      heightMm: preset.height
    },
    weightKg: preset.weightKg,
    material: preset.material,
    features: preset.features,
    purpose: `Fogareiro portátil instalado no módulo '${box.name}' (${placement === 'top'
        ? 'Sobre o Tampo / Bancada'
        : placement === 'rear_shelf'
          ? 'Sobre a Mesa Traseira Rebatível'
          : 'Interior / Gaveta / Bandeja'
      }). ${preset.ignitionType}.`
  };

  stoveGroup.userData = partData;
  interactiveMeshes.forEach((m) => {
    m.userData = partData;
  });

  // Posicionamento conforme o local escolhido
  if (placement === 'top') {
    stoveGroup.position.set(0, h / 2 + sh / 2 + 0.001, 0);
    container.add(stoveGroup);
  } else if (placement === 'rear_shelf') {
    const rearPivot = container.getObjectByName('RearFoldShelfPivot') as THREE.Group | undefined;
    const isRearShelfOpen = Boolean(rearPivot && Math.abs(rearPivot.rotation.x - Math.PI / 2) < 0.1);
    if (rearPivot && isRearShelfOpen) {
      const shelfTMm = box.panelThickness?.shelf || 18;
      const shelfT = shelfTMm / 1000;
      const shelfH = Math.max(0.15, Math.min(h - 0.04, 0.38));

      const uprightWrapper = new THREE.Group();
      uprightWrapper.name = `StoveRearShelfUpright_${box.id}`;
      uprightWrapper.position.set(0, -shelfH / 2, -shelfT - 0.003 - sh / 2);
      uprightWrapper.rotation.x = -Math.PI / 2;
      uprightWrapper.add(stoveGroup);
      rearPivot.add(uprightWrapper);
    } else {
      // Quando a prateleira traseira está fechada, guarda no interior do módulo
      const bottomY = -h / 2 + sh / 2 + 0.018;
      stoveGroup.position.set(0, bottomY, 0);
      targetParent.add(stoveGroup);
    }
  } else {
    if (drawerSlide && drawerSlide.userData?.trayTopY !== undefined) {
      const posX = drawerSlide.userData.cabCenterX || 0;
      const posZ = drawerSlide.userData.cabCenterZ || 0;
      const posY = drawerSlide.userData.trayTopY + sh / 2;
      stoveGroup.position.set(posX, posY, posZ);
    } else {
      const bottomY = -h / 2 + sh / 2 + 0.018;
      stoveGroup.position.set(0, bottomY, 0);
    }
    targetParent.add(stoveGroup);
  }
}
