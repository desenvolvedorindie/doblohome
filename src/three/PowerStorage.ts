import * as THREE from 'three';
import { MaterialLibrary } from './Materials';
import { TextureGenerator } from './Textures';

/**
 * Construtor 3D dos Sistemas de Armazenamento e Gerenciamento Elétrico:
 * - Bateria LiFePO4 Kingbo 560Ah (7.168 kWh) com tela JK BMS 4.3"
 * - Controlador de Carga Solar MPPT Kingbo 60A (230Vdc FV) com dissipador e display LCD
 */
export class PowerStorageBuilder {
  /**
   * Constrói a Bateria Kingbo LiFePO4 de 560Ah
   */
  static buildKingboBattery(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    const mats = MaterialLibrary.materials;
    const batGroup = new THREE.Group();
    batGroup.name = "KingboBattery560Ah";

    const length = 0.52; // Comprimento longitudinal (520 mm)
    const width = 0.27;  // Largura transversal (270 mm)
    const height = 0.24; // Altura (240 mm)

    // 1. Carcaça Principal em Aço Carbono Preto Eletrostático
    const caseGeo = new THREE.BoxGeometry(width, height, length);
    const caseMesh = new THREE.Mesh(caseGeo, mats.kingboCase);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    batGroup.add(caseMesh);

    // 2. Tampa Superior Reforçada
    const lidGeo = new THREE.BoxGeometry(width + 0.015, 0.022, length + 0.015);
    const lidMesh = new THREE.Mesh(lidGeo, mats.kingboCase);
    lidMesh.position.set(0, height / 2 + 0.011, 0);
    lidMesh.castShadow = true;
    batGroup.add(lidMesh);

    // 3. Textura Serigrafada na Tampa Superior (Identificação dos Bornes e JK BMS)
    const topFaceGeo = new THREE.PlaneGeometry(width * 0.94, length * 0.94);
    topFaceGeo.rotateX(-Math.PI / 2);
    const topFaceMesh = new THREE.Mesh(topFaceGeo, mats.kingboTop);
    topFaceMesh.position.set(0, height / 2 + 0.0225, 0);
    batGroup.add(topFaceMesh);

    // 4. Painel Frontal/Lateral Serigrafado com Logo KINGBO POWER e Especificações
    // Lado voltado para o corredor (+X)
    const sidePlateGeo = new THREE.PlaneGeometry(length * 0.90, height * 0.82);
    sidePlateGeo.rotateY(Math.PI / 2);
    const sidePlate = new THREE.Mesh(sidePlateGeo, mats.kingboFrontLabel);
    sidePlate.position.set(width / 2 + 0.001, 0, 0);
    batGroup.add(sidePlate);

    // Face voltada para a frente (+Z)
    const frontPlateGeo = new THREE.PlaneGeometry(width * 0.88, height * 0.78);
    const frontPlate = new THREE.Mesh(frontPlateGeo, mats.kingboFrontLabel);
    frontPlate.position.set(0, 0, length / 2 + 0.001);
    batGroup.add(frontPlate);

    // 5. Moldura Rebaixada da Tela JK BMS 4.3"
    const screenBezelGeo = new THREE.BoxGeometry(0.16, 0.006, 0.105);
    const screenBezel = new THREE.Mesh(screenBezelGeo, mats.kingboCase);
    screenBezel.position.set(0, height / 2 + 0.024, 0);
    batGroup.add(screenBezel);

    // Tela LCD Digital JK Smart BMS Ativa com Emissão de Luz
    const screenGeo = new THREE.PlaneGeometry(0.145, 0.09);
    screenGeo.rotateX(-Math.PI / 2);
    const screenMesh = new THREE.Mesh(screenGeo, mats.kingboScreen);
    screenMesh.position.set(0, height / 2 + 0.0275, 0);
    batGroup.add(screenMesh);

    // 6. Borne Terminal Positivo (+) Reforçado com Parafuso M8 em Latão
    const termPosBaseGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.028, 20);
    const termPosBase = new THREE.Mesh(termPosBaseGeo, mats.kingboTerminalPos);
    termPosBase.position.set(-width / 2 + 0.065, height / 2 + 0.035, -length / 2 + 0.08);
    batGroup.add(termPosBase);

    const boltPosGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.020, 12);
    const boltPos = new THREE.Mesh(boltPosGeo, mats.kingboBrass);
    boltPos.position.set(-width / 2 + 0.065, height / 2 + 0.052, -length / 2 + 0.08);
    batGroup.add(boltPos);

    // 7. Borne Terminal Negativo (-) Reforçado com Parafuso M8 em Latão
    const termNegBaseGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.028, 20);
    const termNegBase = new THREE.Mesh(termNegBaseGeo, mats.kingboTerminalNeg);
    termNegBase.position.set(width / 2 - 0.065, height / 2 + 0.035, -length / 2 + 0.08);
    batGroup.add(termNegBase);

    const boltNegGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.020, 12);
    const boltNeg = new THREE.Mesh(boltNegGeo, mats.kingboBrass);
    boltNeg.position.set(width / 2 - 0.065, height / 2 + 0.052, -length / 2 + 0.08);
    batGroup.add(boltNeg);

    // 8. Alças Laterais de Transporte em Aço Inoxidável (Heavy-duty Handles)
    [-1, 1].forEach((dir) => {
      const handleGroup = new THREE.Group();
      const barGeo = new THREE.BoxGeometry(0.012, 0.024, 0.14);
      const barMesh = new THREE.Mesh(barGeo, mats.kingboHandle);
      barMesh.position.set(0, 0, 0);
      handleGroup.add(barMesh);

      const standGeo = new THREE.BoxGeometry(0.025, 0.012, 0.016);
      const stand1 = new THREE.Mesh(standGeo, mats.kingboHandle);
      stand1.position.set(-0.012, 0, 0.06);
      handleGroup.add(stand1);

      const stand2 = new THREE.Mesh(standGeo, mats.kingboHandle);
      stand2.position.set(-0.012, 0, -0.06);
      handleGroup.add(stand2);

      handleGroup.position.set(dir * (width / 2 + 0.018), height / 2 - 0.04, 0);
      if (dir < 0) handleGroup.rotation.y = Math.PI;
      batGroup.add(handleGroup);
    });

    // 9. LED de Operação Normal do JK BMS
    const ledGeo = new THREE.SphereGeometry(0.005, 12, 12);
    const led = new THREE.Mesh(ledGeo, mats.b2bLedGreen || mats.kingboScreen);
    led.position.set(0.07, height / 2 + 0.026, 0.05);
    batGroup.add(led);

    // 10. Metadados Elétricos Completos para Hover / Raycaster
    const batUserData = {
      isElectrical: true,
      isElectricalRoot: true,
      electricalType: 'battery' as const,
      name: 'Bateria Kingbo LiFePO4 560Ah (7.168 kWh)',
      category: 'Armazenamento de Energia LiFePO4',
      voltage: '12.8 Vdc (Bulk 14.4V / Float 13.8V)',
      capacity: '560 Ah • 7.168 Wh (7.168 kWh)',
      current: '200A Descarga Contínua (Inversor 2500W)',
      power: '7.168 Wh Armazenados (5.734 Wh Úteis @ 80% DOD)',
      material: 'Aço Carbono Preto Fosco + Células Grau A Prismáticas',
      purpose: 'Alimentação off-grid de todas as cargas da van e geladeira 12V',
      efficiency: '≥ 9.000 Ciclos de Vida Útil (20+ anos)',
      features: [
        'JK Smart BMS Integrado 200A',
        'Display Touch 4.3" Colorido Ativo',
        'Balanceamento Ativo 2.0A entre células',
        'Monitoramento Bluetooth no Smartphone'
      ]
    };
    batGroup.userData = batUserData;
    batGroup.traverse((c) => {
      if ((c as any).isMesh) {
        c.userData = { ...batUserData, isElectricalRoot: false, electricalRoot: batGroup };
      }
    });

    // 11. Etiqueta / Sprite 3D Flutuante
    const batLabel = TextureGenerator.createDimensionSprite(
      "KINGBO LiFePO4 560Ah",
      "12.8V • 7.168 kWh • JK BMS 4.3\"",
      "rgba(10, 24, 18, 0.94)",
      "#10b981"
    );
    batLabel.position.set(-0.25, 0.75 + height / 2 + 0.22, zCenter);
    if (labelsGroup) {
      labelsGroup.add(batLabel);
    } else {
      batGroup.add(batLabel);
    }

    // X=−0.25, Y=0.75m (interior do veículo), Z=zCenter
    batGroup.position.set(-0.25, 0.75, zCenter);
    targetGroup.add(batGroup);
  }

  /**
   * Constrói o Controlador de Carga Solar MPPT Kingbo 60A (230Vdc entrada FV)
   */
  static buildKingboMPPT(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    const mats = MaterialLibrary.materials;
    const mppt = new THREE.Group();
    mppt.name = "KingboMPPT60A";

    const W = 0.202;  // largura (X)
    const H = 0.215;  // altura  (Y)
    const D = 0.100;  // profundidade (Z)

    // 1. Carcaça principal
    const caseGeo = new THREE.BoxGeometry(W, H, D);
    const caseMesh = new THREE.Mesh(caseGeo, mats.mpptCase);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    mppt.add(caseMesh);

    // 2. Dissipador de calor em alumínio
    const finCount = 7;
    const finW = W * 0.88;
    const finH = H * 0.70;
    const finD = 0.012;
    const finSpacing = (W * 0.80) / (finCount - 1);
    for (let i = 0; i < finCount; i++) {
      const finGeo = new THREE.BoxGeometry(finD, finH, 0.028);
      const fin = new THREE.Mesh(finGeo, mats.mpptHeatsink);
      fin.position.set(
        -finW / 2 + i * finSpacing + (W * 0.10) / 2,
        H * 0.05,
        D / 2 + 0.014
      );
      mppt.add(fin);
    }

    // 3. Display LCD
    const lcdW = W * 0.60;
    const lcdH = H * 0.30;
    const lcdGeo = new THREE.PlaneGeometry(lcdW, lcdH);
    const lcd = new THREE.Mesh(lcdGeo, mats.mpptScreen);
    lcd.position.set(0, H * 0.18, -D / 2 - 0.001);
    lcd.rotation.y = Math.PI;
    mppt.add(lcd);

    // 4. Botão de toque LCD
    const btnGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.006, 12);
    const btn = new THREE.Mesh(btnGeo, mats.mpptButton);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(W * 0.30, H * 0.18, -D / 2 - 0.004);
    mppt.add(btn);

    // 5. Terminais PV
    const termGeo = new THREE.BoxGeometry(0.022, 0.018, 0.022);
    const termPVPos = new THREE.Mesh(termGeo, mats.mpptTerminalPV);
    termPVPos.position.set(-W * 0.18, H / 2 + 0.009, -D * 0.15);
    mppt.add(termPVPos);

    const termPVNeg = new THREE.Mesh(termGeo, mats.mpptTerminalPV);
    termPVNeg.position.set(W * 0.18, H / 2 + 0.009, -D * 0.15);
    mppt.add(termPVNeg);

    // 6. Terminais Bateria
    const termBatPos = new THREE.Mesh(termGeo, mats.mpptTerminalBat);
    termBatPos.position.set(-W * 0.18, -H / 2 - 0.009, -D * 0.15);
    mppt.add(termBatPos);

    const termBatNeg = new THREE.Mesh(termGeo, mats.mpptTerminalBat);
    termBatNeg.position.set(W * 0.18, -H / 2 - 0.009, -D * 0.15);
    mppt.add(termBatNeg);

    // 7. Cabo PV
    const pvCablePoints = [
      new THREE.Vector3(-W * 0.18, H / 2 + 0.009, -D * 0.15),
      new THREE.Vector3(-W * 0.18, H / 2 + 0.35,  -D * 0.15),
      new THREE.Vector3(-W * 0.18, H / 2 + 0.75,   0.0)
    ];
    const pvCurve = new THREE.CatmullRomCurve3(pvCablePoints);
    const pvCableGeo = new THREE.TubeGeometry(pvCurve, 10, 0.005, 6, false);
    mppt.add(new THREE.Mesh(pvCableGeo, mats.cableRed));

    // 8. Cabo Bateria
    const batCablePoints = [
      new THREE.Vector3(W * 0.18,  -H / 2 - 0.009, -D * 0.15),
      new THREE.Vector3(W * 0.18,  -H / 2 - 0.08,  -D * 0.15),
      new THREE.Vector3(-0.50,     -H / 2 - 0.08,  -D * 0.15)
    ];
    const batCurve = new THREE.CatmullRomCurve3(batCablePoints);
    const batCableGeo = new THREE.TubeGeometry(batCurve, 10, 0.005, 6, false);
    mppt.add(new THREE.Mesh(batCableGeo, mats.cableBlack));

    // 9. Label
    const mpptLabel = TextureGenerator.createDimensionSprite(
      "KINGBO MPPT 60A",
      "12–96V · 230Vdc PV · RS485+WiFi · η≥96.5%",
      "rgba(14, 30, 24, 0.94)",
      "#10b981"
    );
    mpptLabel.position.set(0.25, 0.85 + H / 2 + 0.22, zCenter);
    if (labelsGroup) {
      labelsGroup.add(mpptLabel);
    } else {
      mppt.add(mpptLabel);
    }

    // 10. Metadados Elétricos Completos para Hover / Raycaster
    const mpptUserData = {
      isElectrical: true,
      isElectricalRoot: true,
      electricalType: 'mppt' as const,
      name: 'Controlador Solar MPPT Kingbo 60A',
      category: 'Gerenciamento Solar Fotovoltaico',
      voltage: 'Entrada FV até 230 Vdc • Bateria 12V/24V/48V',
      capacity: 'Até 720W em 12V (864W @ 14.4V)',
      current: '60 A contínuos de carga',
      power: 'Rastreamento MPPT Ultra-Rápido (99.5%)',
      material: 'Dissipador em Alumínio Anodizado + Display LCD',
      purpose: 'Converte a alta tensão dos painéis solares na curva LiFePO4 ideal',
      efficiency: 'Eficiência de conversão η ≥ 96.5%',
      features: [
        'Tensão de entrada máxima de 230Vdc',
        'Comunicação RS485 + WiFi integrada',
        'Display LCD retroiluminado com telemetria',
        'Proteção contra sobretensão, curto e inversão'
      ]
    };
    mppt.userData = mpptUserData;
    mppt.traverse((c) => {
      if ((c as any).isMesh) {
        c.userData = { ...mpptUserData, isElectricalRoot: false, electricalRoot: mppt };
      }
    });

    // X=+0.25, Y=0.85m, Z=zCenter
    mppt.position.set(0.25, 0.85, zCenter);
    mppt.rotation.y = 0;

    targetGroup.add(mppt);
  }

  /**
   * Constrói o Carregador Inteligente DC-DC B2B1230 (12V 30A com Bluetooth)
   * Extrai corrente do alternador da Doblò para carregar a bateria Kingbo LiFePO4
   */
  static buildB2BCharger(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    const mats = MaterialLibrary.materials;
    const b2b = new THREE.Group();
    b2b.name = "B2BCharger1230";

    const W = 0.190; // largura (X) - 19 cm
    const H = 0.130; // altura  (Y) - 13 cm
    const D = 0.058; // espessura (Z) - 5.8 cm

    // 1. Carcaça principal em alumínio azul cobalto
    const caseGeo = new THREE.BoxGeometry(W, H, D);
    const caseMesh = new THREE.Mesh(caseGeo, mats.b2bCase || mats.mpptCase);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    b2b.add(caseMesh);

    // 2. Abas de montagem laterais com furos para parafusos
    const flangeW = 0.016;
    const flangeGeo = new THREE.BoxGeometry(flangeW, H * 0.85, 0.003);
    const flangeL = new THREE.Mesh(flangeGeo, mats.aluminumProfileSilver || mats.b2bHeatsink);
    flangeL.position.set(-W / 2 - flangeW / 2, 0, -D / 2 + 0.002);
    b2b.add(flangeL);

    const flangeR = new THREE.Mesh(flangeGeo, mats.aluminumProfileSilver || mats.b2bHeatsink);
    flangeR.position.set(W / 2 + flangeW / 2, 0, -D / 2 + 0.002);
    b2b.add(flangeR);

    // 3. Aletas de dissipação nas laterais
    const finCount = 5;
    const finH = H * 0.75;
    const finSpacing = finH / (finCount - 1);
    for (let i = 0; i < finCount; i++) {
      const yOffset = -finH / 2 + i * finSpacing;
      const finGeo = new THREE.BoxGeometry(0.008, 0.003, D * 0.7);
      
      const finLeft = new THREE.Mesh(finGeo, mats.b2bHeatsink);
      finLeft.position.set(-W / 2 - 0.004, yOffset, 0);
      b2b.add(finLeft);

      const finRight = new THREE.Mesh(finGeo, mats.b2bHeatsink);
      finRight.position.set(W / 2 + 0.004, yOffset, 0);
      b2b.add(finRight);
    }

    // 4. Painel frontal serigrafado com acabamento escovado
    const faceW = W * 0.88;
    const faceH = H * 0.82;
    const faceGeo = new THREE.PlaneGeometry(faceW, faceH);
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.7
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, 0, D / 2 + 0.001);
    b2b.add(face);

    // 5. LED Indicador Bluetooth (Azul neon pulsante)
    const btLedGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.004, 12);
    btLedGeo.rotateX(Math.PI / 2);
    const btLed = new THREE.Mesh(btLedGeo, mats.b2bLedBlue);
    btLed.position.set(W * 0.28, H * 0.22, D / 2 + 0.003);
    b2b.add(btLed);

    // Ícone / Badge de Bluetooth (placa pequena emissiva)
    const btBadgeGeo = new THREE.PlaneGeometry(0.016, 0.016);
    const btBadgeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95
    });
    const btBadge = new THREE.Mesh(btBadgeGeo, btBadgeMat);
    btBadge.position.set(W * 0.28, H * 0.22, D / 2 + 0.005);
    b2b.add(btBadge);

    // 6. LEDs de Status do B2B (Power, Charge, LiFePO4)
    const ledSpacing = 0.014;
    for (let i = 0; i < 3; i++) {
      const ledGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.003, 10);
      ledGeo.rotateX(Math.PI / 2);
      const led = new THREE.Mesh(ledGeo, mats.b2bLedGreen);
      led.position.set(-W * 0.28 + i * ledSpacing, H * 0.22, D / 2 + 0.003);
      b2b.add(led);
    }

    // 7. Borneiras de Alta Corrente (Alternador IN vs Bateria OUT)
    const blockGeo = new THREE.BoxGeometry(0.026, 0.022, 0.020);
    
    // Entrada Alternador (+)
    const altPos = new THREE.Mesh(blockGeo, mats.b2bTerminalAlt || mats.mpptTerminalPV);
    altPos.position.set(-W * 0.26, -H / 2 - 0.010, 0);
    b2b.add(altPos);

    // Entrada Alternador (-)
    const altNeg = new THREE.Mesh(blockGeo, mats.weldedSteelMetalon);
    altNeg.position.set(-W * 0.10, -H / 2 - 0.010, 0);
    b2b.add(altNeg);

    // Conector D+ (Sinal da Ignição do Veículo)
    const dPlusGeo = new THREE.BoxGeometry(0.012, 0.014, 0.012);
    const dPlusMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.5, roughness: 0.3 });
    const dPlus = new THREE.Mesh(dPlusGeo, dPlusMat);
    dPlus.position.set(0, -H / 2 - 0.007, 0);
    b2b.add(dPlus);

    // Saída LiFePO4 (+)
    const outPos = new THREE.Mesh(blockGeo, mats.mpptTerminalBat);
    outPos.position.set(W * 0.10, -H / 2 - 0.010, 0);
    b2b.add(outPos);

    // Saída LiFePO4 (-)
    const outNeg = new THREE.Mesh(blockGeo, mats.weldedSteelMetalon);
    outNeg.position.set(W * 0.26, -H / 2 - 0.010, 0);
    b2b.add(outNeg);

    // 8. Fio do Alternador (vindo da dianteira / cofre do motor da Doblò)
    const altCablePoints = [
      new THREE.Vector3(-W * 0.26, -H / 2 - 0.010, 0),
      new THREE.Vector3(-W * 0.26, -H / 2 - 0.10, 0),
      new THREE.Vector3(-0.35,     -H / 2 - 0.10, 0.50), // corre para frente em direção ao motor
      new THREE.Vector3(-0.35,     -H / 2 - 0.05, 1.30)  // dianteira do cofre do motor
    ];
    const altCurve = new THREE.CatmullRomCurve3(altCablePoints);
    const altCableGeo = new THREE.TubeGeometry(altCurve, 14, 0.0055, 6, false);
    b2b.add(new THREE.Mesh(altCableGeo, mats.cableRed));

    // 9. Fio de Saída do B2B para a Bateria LiFePO4 Kingbo 560Ah
    const outCablePoints = [
      new THREE.Vector3(W * 0.10, -H / 2 - 0.010, 0),
      new THREE.Vector3(W * 0.10, -H / 2 - 0.08, 0),
      new THREE.Vector3(-0.25,    -H / 2 - 0.08, -0.15) // conecta aos bornes da bateria
    ];
    const outCurve = new THREE.CatmullRomCurve3(outCablePoints);
    const outCableGeo = new THREE.TubeGeometry(outCurve, 10, 0.0055, 6, false);
    b2b.add(new THREE.Mesh(outCableGeo, mats.cableRed));

    // 10. Label 3D do B2B1230
    const b2bLabel = TextureGenerator.createDimensionSprite(
      "CARREGADOR DC-DC B2B1230",
      "12V · 30A (390W) · Alternador Doblò → LiFePO4 · Bluetooth",
      "rgba(15, 23, 42, 0.94)",
      "#38bdf8"
    );
    b2bLabel.position.set(0.0, 0.62 + H / 2 + 0.18, zCenter - 0.25);
    if (labelsGroup) {
      labelsGroup.add(b2bLabel);
    } else {
      b2b.add(b2bLabel);
    }

    // 11. Metadados Elétricos Completos para Hover / Raycaster
    const b2bUserData = {
      isElectrical: true,
      isElectricalRoot: true,
      electricalType: 'b2b' as const,
      name: 'Carregador DC-DC B2B1230 (30A)',
      category: 'Recarga Veicular Alternador → LiFePO4',
      voltage: 'Entrada: 10.5V–16V (Alternador) • Saída: 14.4V LiFePO4',
      capacity: 'Injeta +30 Ah por hora de motor ligado',
      current: '30 A contínuos de recarga',
      power: '390 W a 432 W injetados continuamente',
      material: 'Alumínio Azul Cobalto com Aletas de Refrigeração',
      purpose: 'Recarrega a Kingbo 560Ah enquanto você dirige a Fiat Doblò',
      efficiency: 'Eficiência de conversão ≥ 92%',
      features: [
        'Detecção automática de motor ligado (sinal D+)',
        'Proteção contra descarga da bateria de partida',
        'Bluetooth 5.0 LE com aplicativo dedicado',
        'Curva de carga LiFePO4 de 4 estágios'
      ]
    };
    b2b.userData = b2bUserData;
    b2b.traverse((c) => {
      if ((c as any).isMesh) {
        c.userData = { ...b2bUserData, isElectricalRoot: false, electricalRoot: b2b };
      }
    });

    // Posição no interior do veículo: centralizado abaixo do leito (X=0.0, Y=0.62m, Z=zCenter - 0.25)
    b2b.position.set(0.0, 0.62, zCenter - 0.25);
    b2b.rotation.y = 0;

    targetGroup.add(b2b);
  }

  /**
   * Constrói a Fonte e Carregador Automotivo Smart Connect Usina 150A 12V Bivolt
   * Permite recarga ultra-rápida (até 150A / 2.160W) conectada à rede elétrica (110V/220V Shore Power)
   */
  static buildUsinaCharger(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    const mats = MaterialLibrary.materials;
    const usina = new THREE.Group();
    usina.name = "UsinaSmartConnect150A";

    const W = 0.320; // largura (X) - 32 cm
    const H = 0.088; // altura  (Y) - 8.8 cm
    const D = 0.180; // profundidade (Z) - 18 cm

    // 1. Carcaça em chapa de aço vermelha eletrostática característica Usina Spark
    const caseGeo = new THREE.BoxGeometry(W, H, D);
    const caseMesh = new THREE.Mesh(caseGeo, mats.usinaCase || mats.cableRed);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    usina.add(caseMesh);

    // 2. Abas de fixação inferiores nos cantos com furos
    const mountGeo = new THREE.BoxGeometry(W + 0.035, 0.003, D * 0.7);
    const mountPlate = new THREE.Mesh(mountGeo, mats.weldedSteelMetalon);
    mountPlate.position.set(0, -H / 2 + 0.0015, 0);
    usina.add(mountPlate);

    // 3. Painel frontal preto serigrafado
    const faceW = W * 0.94;
    const faceH = H * 0.90;
    const faceGeo = new THREE.PlaneGeometry(faceW, faceH);
    const faceMesh = new THREE.Mesh(faceGeo, mats.usinaFace || mats.mpptCase);
    faceMesh.position.set(0, 0, D / 2 + 0.001);
    usina.add(faceMesh);

    // 4. Coolers duplos de ventilação inteligente Smart Cooler (dois fans de 60mm)
    const fanRadius = 0.026;
    const fanOffsets = [-0.085, 0.085];
    fanOffsets.forEach((fx) => {
      // Moldura circular do cooler
      const rimGeo = new THREE.RingGeometry(fanRadius * 0.88, fanRadius, 24);
      const rim = new THREE.Mesh(rimGeo, mats.usinaCooler || mats.weldedSteelMetalon);
      rim.position.set(fx, 0, D / 2 + 0.002);
      usina.add(rim);

      // Grade de proteção frontal tipo teia
      const gridGeo = new THREE.CircleGeometry(fanRadius * 0.86, 16);
      const gridMat = new THREE.MeshBasicMaterial({ color: 0x111827, wireframe: true });
      const grid = new THREE.Mesh(gridGeo, gridMat);
      grid.position.set(fx, 0, D / 2 + 0.003);
      usina.add(grid);

      // Núcleo central do cooler
      const hubGeo = new THREE.CircleGeometry(0.008, 16);
      const hub = new THREE.Mesh(hubGeo, mats.usinaCooler);
      hub.position.set(fx, 0, D / 2 + 0.004);
      usina.add(hub);
    });

    // 5. Display Digital Smart Connect (Voltímetro e Amperímetro vermelho LED duplo)
    const dispW = 0.060;
    const dispH = 0.026;
    const dispGeo = new THREE.PlaneGeometry(dispW, dispH);
    const dispMesh = new THREE.Mesh(dispGeo, mats.usinaDisplay);
    dispMesh.position.set(0, H * 0.16, D / 2 + 0.002);
    usina.add(dispMesh);

    // Borda preta do display
    const dispFrameGeo = new THREE.PlaneGeometry(dispW + 0.006, dispH + 0.006);
    const dispFrame = new THREE.Mesh(dispFrameGeo, mats.usinaCooler);
    dispFrame.position.set(0, H * 0.16, D / 2 + 0.0015);
    usina.add(dispFrame);

    // 6. Botão de Ajuste Fino de Tensão (Trimpot 12.5V a 14.4V) e Chave Liga/Desliga
    const knobGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.006, 14);
    knobGeo.rotateX(Math.PI / 2);
    const knob = new THREE.Mesh(knobGeo, mats.aluminumProfileSilver);
    knob.position.set(-0.022, -H * 0.18, D / 2 + 0.003);
    usina.add(knob);

    const switchGeo = new THREE.BoxGeometry(0.012, 0.018, 0.006);
    const switchMesh = new THREE.Mesh(switchGeo, mats.usinaCase);
    switchMesh.position.set(0.022, -H * 0.18, D / 2 + 0.003);
    usina.add(switchMesh);

    // 7. Bornes reforçados de alta corrente (150A) em latão maciço na traseira/lateral
    const termBlockGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.025, 16);
    termBlockGeo.rotateX(Math.PI / 2);

    // Borne Positivo (+) 150A
    const termPos = new THREE.Mesh(termBlockGeo, mats.usinaBrassTerminal);
    termPos.position.set(-W * 0.35, -H * 0.10, -D / 2 - 0.010);
    usina.add(termPos);

    // Borne Negativo (-) 150A
    const termNeg = new THREE.Mesh(termBlockGeo, mats.weldedSteelMetalon);
    termNeg.position.set(-W * 0.20, -H * 0.10, -D / 2 - 0.010);
    usina.add(termNeg);

    // 8. Cabo de Saída reforçado de 35mm² conectando a Usina 150A à Bateria Kingbo 560Ah
    const cablePosPoints = [
      new THREE.Vector3(-W * 0.35, -H * 0.10, -D / 2 - 0.010),
      new THREE.Vector3(-W * 0.35, -H * 0.10, -D / 2 - 0.08),
      new THREE.Vector3(-0.25,     0.15,      -0.08) // chega ao borne positivo da bateria LiFePO4
    ];
    const cablePosCurve = new THREE.CatmullRomCurve3(cablePosPoints);
    const cablePosGeo = new THREE.TubeGeometry(cablePosCurve, 10, 0.007, 8, false);
    usina.add(new THREE.Mesh(cablePosGeo, mats.cableRed));

    const cableNegPoints = [
      new THREE.Vector3(-W * 0.20, -H * 0.10, -D / 2 - 0.010),
      new THREE.Vector3(-W * 0.20, -H * 0.10, -D / 2 - 0.08),
      new THREE.Vector3(-0.20,     0.15,      -0.08) // chega ao borne negativo
    ];
    const cableNegCurve = new THREE.CatmullRomCurve3(cableNegPoints);
    const cableNegGeo = new THREE.TubeGeometry(cableNegCurve, 10, 0.007, 8, false);
    usina.add(new THREE.Mesh(cableNegGeo, mats.cableBlack));

    // 9. Cabo de Entrada AC (Tomada Bivolt 110V/220V - Shore Power)
    const acCablePoints = [
      new THREE.Vector3(W * 0.35, -H * 0.10, -D / 2 - 0.010),
      new THREE.Vector3(W * 0.35, -H * 0.10, -D / 2 - 0.18),
      new THREE.Vector3(0.55,     -0.10,      -D / 2 - 0.25) // corre para a lateral da van (conector de camping)
    ];
    const acCurve = new THREE.CatmullRomCurve3(acCablePoints);
    const acCableGeo = new THREE.TubeGeometry(acCurve, 10, 0.005, 6, false);
    usina.add(new THREE.Mesh(acCableGeo, mats.weldedSteelMetalon));

    // Plugue de Tomada Industrial AC (Shore Power)
    const plugGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.038, 14);
    plugGeo.rotateZ(Math.PI / 2);
    const plugMesh = new THREE.Mesh(plugGeo, mats.mpptScreen);
    plugMesh.position.set(0.55, -0.10, -D / 2 - 0.25);
    usina.add(plugMesh);

    // 10. Label 3D Flutuante da Fonte Usina 150A
    const usinaLabel = TextureGenerator.createDimensionSprite(
      "FONTE USINA 150A SMART CONNECT",
      "Bivolt 110/220V · 150A (2.160W) · Shore Power Camping",
      "rgba(30, 10, 10, 0.94)",
      "#ef4444"
    );
    usinaLabel.position.set(-0.28, 0.52 + H / 2 + 0.18, zCenter - 0.28);
    if (labelsGroup) {
      labelsGroup.add(usinaLabel);
    } else {
      usina.add(usinaLabel);
    }

    // 11. Metadados Elétricos Completos para Hover / Raycaster
    const usinaUserData = {
      isElectrical: true,
      isElectricalRoot: true,
      electricalType: 'usina' as const,
      name: 'Fonte Usina Smart Connect 150A',
      category: 'Shore Power / Recarga Rápida AC (Camping)',
      voltage: 'Entrada Bivolt 110V/220V AC • Saída Ajustável 12.5V–14.4V',
      capacity: 'Até 150 Ah injetados por hora na tomada',
      current: '150 A nominais contínuos',
      power: 'Até 2.160 W de potência de carga',
      material: 'Gabinete Vermelho Spark + Coolers Duplos de 60mm',
      purpose: 'Recarga ultra-rápida em campings ou tomadas externas residenciais',
      efficiency: 'Rendimento superior a 88%',
      features: [
        'Tecnologia Smart Connect com microcontrolador',
        'Display digital voltímetro e amperímetro',
        'Ventilação inteligente Smart Cooler termostatizada',
        'Suporta carregar e alimentar todas as cargas simultaneamente'
      ]
    };
    usina.userData = usinaUserData;
    usina.traverse((c) => {
      if ((c as any).isMesh) {
        c.userData = { ...usinaUserData, isElectricalRoot: false, electricalRoot: usina };
      }
    });

    // Posição no interior do veículo: apoiado na central técnica (X=-0.28, Y=0.52m, Z=zCenter - 0.28)
    usina.position.set(-0.28, 0.52, zCenter - 0.28);
    usina.rotation.y = 0;

    targetGroup.add(usina);
  }
}

