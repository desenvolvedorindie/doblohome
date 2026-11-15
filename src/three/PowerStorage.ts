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
   * Constrói o grupo 3D da Bateria Kingbo LiFePO4 de 560Ah sem posicionamento fixo
   */
  static createBatteryMesh(): THREE.Group {
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

    return batGroup;
  }

  /**
   * Constrói a Bateria Kingbo LiFePO4 de 560Ah (Posicionada no Veículo)
   */
  static buildKingboBattery(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    const batGroup = this.createBatteryMesh();
    const height = 0.24;

    // Etiqueta / Sprite 3D Flutuante
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
   * Constrói o grupo 3D do Controlador de Carga Solar MPPT Kingbo 60A sem posicionamento fixo
   */
  static createMPPTMesh(options?: { includeCables?: boolean }): THREE.Group {
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

    // 7. Cabos opcionais (usados na visão solta original)
    if (options?.includeCables) {
      const pvCablePoints = [
        new THREE.Vector3(-W * 0.18, H / 2 + 0.009, -D * 0.15),
        new THREE.Vector3(-W * 0.18, H / 2 + 0.35, -D * 0.15),
        new THREE.Vector3(-W * 0.18, H / 2 + 0.75, 0.0)
      ];
      const pvCurve = new THREE.CatmullRomCurve3(pvCablePoints);
      const pvCableGeo = new THREE.TubeGeometry(pvCurve, 10, 0.005, 6, false);
      mppt.add(new THREE.Mesh(pvCableGeo, mats.cableRed));

      const batCablePoints = [
        new THREE.Vector3(W * 0.18, -H / 2 - 0.009, -D * 0.15),
        new THREE.Vector3(W * 0.18, -H / 2 - 0.08, -D * 0.15),
        new THREE.Vector3(-0.50, -H / 2 - 0.08, -D * 0.15)
      ];
      const batCurve = new THREE.CatmullRomCurve3(batCablePoints);
      const batCableGeo = new THREE.TubeGeometry(batCurve, 10, 0.005, 6, false);
      mppt.add(new THREE.Mesh(batCableGeo, mats.cableBlack));
    }

    // 8. Metadados Elétricos Completos para Hover / Raycaster
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

    return mppt;
  }

  /**
   * Constrói o Controlador de Carga Solar MPPT Kingbo 60A (Posicionado no Veículo)
   */
  static buildKingboMPPT(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    const mppt = this.createMPPTMesh({ includeCables: true });
    const H = 0.215;

    // Label
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

    // X=+0.25, Y=0.85m, Z=zCenter
    mppt.position.set(0.25, 0.85, zCenter);
    mppt.rotation.y = 0;

    targetGroup.add(mppt);
  }

  /**
   * Constrói o grupo 3D do Carregador Inteligente DC-DC B2B1230 sem posicionamento fixo
   */
  static createB2BMesh(options?: { includeCables?: boolean }): THREE.Group {
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

    // 8. Cabos opcionais (usados na visão solta original)
    if (options?.includeCables) {
      const altCablePoints = [
        new THREE.Vector3(-W * 0.26, -H / 2 - 0.010, 0),
        new THREE.Vector3(-W * 0.26, -H / 2 - 0.10, 0),
        new THREE.Vector3(-0.35, -H / 2 - 0.10, 0.50),
        new THREE.Vector3(-0.35, -H / 2 - 0.05, 1.30)
      ];
      const altCurve = new THREE.CatmullRomCurve3(altCablePoints);
      const altCableGeo = new THREE.TubeGeometry(altCurve, 14, 0.0055, 6, false);
      b2b.add(new THREE.Mesh(altCableGeo, mats.cableRed));

      const outCablePoints = [
        new THREE.Vector3(W * 0.10, -H / 2 - 0.010, 0),
        new THREE.Vector3(W * 0.10, -H / 2 - 0.08, 0),
        new THREE.Vector3(-0.25, -H / 2 - 0.08, -0.15)
      ];
      const outCurve = new THREE.CatmullRomCurve3(outCablePoints);
      const outCableGeo = new THREE.TubeGeometry(outCurve, 10, 0.0055, 6, false);
      b2b.add(new THREE.Mesh(outCableGeo, mats.cableRed));
    }

    // 9. Metadados Elétricos Completos para Hover / Raycaster
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

    return b2b;
  }

  /**
   * Constrói o Carregador Inteligente DC-DC B2B1230 (Posicionado no Veículo)
   */
  static buildB2BCharger(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    const b2b = this.createB2BMesh({ includeCables: true });
    const H = 0.130;

    // Label 3D do B2B1230
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

    // Posição no interior do veículo: centralizado abaixo do leito (X=0.0, Y=0.62m, Z=zCenter - 0.25)
    b2b.position.set(0.0, 0.62, zCenter - 0.25);
    b2b.rotation.y = 0;

    targetGroup.add(b2b);
  }

  /**
   * Constrói o grupo 3D da Fonte Usina Smart Connect sem posicionamento fixo
   */
  static createUsinaMesh(options?: { includeCables?: boolean }): THREE.Group {
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

    // 8. Cabos opcionais (usados na visão solta original)
    if (options?.includeCables) {
      const cablePosPoints = [
        new THREE.Vector3(-W * 0.35, -H * 0.10, -D / 2 - 0.010),
        new THREE.Vector3(-W * 0.35, -H * 0.10, -D / 2 - 0.08),
        new THREE.Vector3(-0.25, 0.15, -0.08)
      ];
      const cablePosCurve = new THREE.CatmullRomCurve3(cablePosPoints);
      const cablePosGeo = new THREE.TubeGeometry(cablePosCurve, 10, 0.007, 8, false);
      usina.add(new THREE.Mesh(cablePosGeo, mats.cableRed));

      const cableNegPoints = [
        new THREE.Vector3(-W * 0.20, -H * 0.10, -D / 2 - 0.010),
        new THREE.Vector3(-W * 0.20, -H * 0.10, -D / 2 - 0.08),
        new THREE.Vector3(-0.20, 0.15, -0.08)
      ];
      const cableNegCurve = new THREE.CatmullRomCurve3(cableNegPoints);
      const cableNegGeo = new THREE.TubeGeometry(cableNegCurve, 10, 0.007, 8, false);
      usina.add(new THREE.Mesh(cableNegGeo, mats.cableBlack));

      const acCablePoints = [
        new THREE.Vector3(W * 0.35, -H * 0.10, -D / 2 - 0.010),
        new THREE.Vector3(W * 0.35, -H * 0.10, -D / 2 - 0.18),
        new THREE.Vector3(0.55, -0.10, -D / 2 - 0.25)
      ];
      const acCurve = new THREE.CatmullRomCurve3(acCablePoints);
      const acCableGeo = new THREE.TubeGeometry(acCurve, 10, 0.005, 6, false);
      usina.add(new THREE.Mesh(acCableGeo, mats.weldedSteelMetalon));

      const plugGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.038, 14);
      plugGeo.rotateZ(Math.PI / 2);
      const plugMesh = new THREE.Mesh(plugGeo, mats.mpptScreen);
      plugMesh.position.set(0.55, -0.10, -D / 2 - 0.25);
      usina.add(plugMesh);
    }

    // 9. Metadados Elétricos Completos para Hover / Raycaster
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

    return usina;
  }

  /**
   * Constrói a Fonte e Carregador Automotivo Smart Connect Usina 150A 12V Bivolt (Posicionado no Veículo)
   */
  static buildUsinaCharger(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    const usina = this.createUsinaMesh({ includeCables: true });
    const H = 0.088;

    // Label 3D Flutuante da Fonte Usina 150A
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

    // Posição no interior do veículo: apoiado na central técnica (X=-0.28, Y=0.52m, Z=zCenter - 0.28)
    usina.position.set(-0.28, 0.52, zCenter - 0.28);
    usina.rotation.y = 0;

    targetGroup.add(usina);
  }

  /**
   * Curva paramétrica para o joelho PVC 90° (Quarter Arc Curve)
   */
  static QuarterArcCurve = class extends THREE.Curve<THREE.Vector3> {
    constructor(
      public centerX: number,
      public centerZ: number,
      public radius: number,
      public startAngle: number,
      public endAngle: number
    ) {
      super();
    }
    getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
      const angle = this.startAngle + t * (this.endAngle - this.startAngle);
      return optionalTarget.set(
        this.centerX + this.radius * Math.cos(angle),
        0,
        this.centerZ + this.radius * Math.sin(angle)
      );
    }
  };

  /**
   * Constrói a Caixa d'Água em formato de U 100% instalada DENTRO da estrutura de ferro (subchassi 1,40m × 2,20m):
   * - O circuito fica na dianteira da van (extremidade -Z, sobre a cabine/para-brisa) abraçando o baú
   * - 2 Canos de PVC laterais longitudinais (1 de cada lado do baú, encostados na face interna das longarinas)
   * - 2 Joelhos de 90° em PVC na dianteira conectando as longarinas ao cano transversal
   * - 1 Cano transversal dianteiro interligando o circuito hidráulico por dentro da travessa frontal
   * - 2 Tampões (caps) traseiros com registros esfera de saída de água em latão voltados para o porta-malas (+Z)
   * - Bocal de abastecimento rápido superior com tampa rosqueável e válvula de respiro
   */
  static buildWaterTankPipes(
    targetGroup: THREE.Group,
    enabled: boolean,
    lengthMmInput: number,
    baseY: number,
    zCenter: number,
    labelsGroup?: THREE.Group,
    diameterMmInput: number = 200,
    cargoBoxEnabled: boolean = true,
    cargoBoxLengthM: number = 1.60
  ) {
    if (!enabled) return;

    const mats = MaterialLibrary.materials;
    const BASE_MAX_MM = 2200; // Comprimento total da base da estrutura (2,20 m)
    const lengthMm = Math.max(400, Math.min(BASE_MAX_MM, Math.round(lengthMmInput || BASE_MAX_MM)));
    const diameterMm = Math.max(80, Math.min(350, Math.round(diameterMmInput || 200)));
    const radiusMm = +(diameterMm / 2).toFixed(1);
    const lateralLengthM = lengthMm / 1000;
    const radiusM = radiusMm / 1000;
    const radiusDm = radiusMm / 100;

    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.25
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.45,
      metalness: 0.20
    });
    const waterAccentMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.3
    });
    const clampMat = mats.stainlessHinge || new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.25,
      metalness: 0.85
    });
    const brassMat = mats.kingboBrass || new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.3,
      metalness: 0.8
    });

    const baseHalfWidth = 0.70; // Metade da largura de 1.40m do quadro de ferro
    // A tubulação fica 100% DENTRO da estrutura de ferro (encostada na face interna da longarina 40x40 em ±0.66m)
    const frameInnerX = baseHalfWidth - 0.04; // 0.66m
    const pipeOffsetX = frameInnerX - radiusM; // Dentro do ferro
    const pipeCenterY = baseY + 0.02;

    // Coordenadas em Z da van Doblò:
    // Dianteira da van (para-brisa / capô) = +Z
    // Traseira da van (porta-malas) = -Z
    const zFrontFrame = zCenter + (BASE_MAX_MM / 2) / 1000; // Dianteira extrema da estrutura de ferro (+Z)
    const zRearFrame = zCenter - (BASE_MAX_MM / 2) / 1000; // Traseira extrema da estrutura de ferro (-Z)
    const zInnerFront = zFrontFrame - 0.04;                 // Face interna da travessa dianteira de ferro
    const zInnerRear = zRearFrame + 0.04;                  // Face interna da travessa traseira de ferro

    // Cano transversal frontal montado 100% dentro do ferro (imediatamente atrás da travessa dianteira)
    const zFrontPipe = zInnerFront - radiusM;
    const bendR = Math.max(0.06, radiusM * 1.35);          // Raio de curvatura dos joelhos 90° (~0.135m)

    // O cano transversal conecta as bolsas dos 2 joelhos de 90° ao longo do eixo X na dianteira
    const frontPipeSpan = (pipeOffsetX - bendR) * 2;
    const frontPipeLengthM = Math.max(0.20, frontPipeSpan);

    // Canos laterais longitudinais (estendem-se dos joelhos dianteiros em direção à traseira -Z)
    const zPipeStart = zFrontPipe - bendR; // Ponto de encaixe com o joelho dianteiro
    const maxAvailableLateral = zPipeStart - zInnerRear;
    const lateralPipeLengthM = Math.max(0.20, Math.min(lateralLengthM - bendR, maxAvailableLateral));
    const zRearEnd = zPipeStart - lateralPipeLengthM; // Ponto traseiro de término junto ao porta-malas (-Z)

    // Cálculo do volume de água contínuo em U:
    // 2 canos laterais + 1 cano frontal + 2 joelhos de 90° (arco total = π * bendR)
    const totalEffectiveLengthM = 2 * lateralLengthM + frontPipeLengthM + Math.PI * bendR;
    const singleLateralLiters = +(Math.PI * radiusDm * radiusDm * (lateralLengthM * 10)).toFixed(1);
    const frontCircuitLiters = +(Math.PI * radiusDm * radiusDm * ((frontPipeLengthM + Math.PI * bendR) * 10)).toFixed(1);
    const totalLiters = +(Math.PI * radiusDm * radiusDm * (totalEffectiveLengthM * 10)).toFixed(1);

    const waterTankMasterGroup = new THREE.Group();
    waterTankMasterGroup.name = "WaterTank_UShape_Assembly";

    // ──────────────────────────────────────────────────────────────────────────
    // 1. CANOS LATERAIS LONGITUDINAIS (1 de cada lado do baú, 100% dentro do ferro)
    // ──────────────────────────────────────────────────────────────────────────
    const sides: Array<{ sign: -1 | 1; sideName: string }> = [
      { sign: -1, sideName: 'Lado Esquerdo (Motorista)' },
      { sign: 1, sideName: 'Lado Direito (Passageiro)' }
    ];

    sides.forEach(({ sign, sideName }) => {
      const lateralPipeGroup = new THREE.Group();
      lateralPipeGroup.name = `WaterTankLateral_${sign < 0 ? 'Left' : 'Right'}`;

      // 1.1 Tubo cilíndrico reto ao longo de Z (da dianteira para a traseira da van)
      const bodyGeo = new THREE.CylinderGeometry(radiusM, radiusM, lateralPipeLengthM, 28);
      bodyGeo.rotateX(Math.PI / 2);
      const bodyMesh = new THREE.Mesh(bodyGeo, pipeMat);
      bodyMesh.position.set(sign * pipeOffsetX, pipeCenterY, zPipeStart - lateralPipeLengthM / 2);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      lateralPipeGroup.add(bodyMesh);

      // 1.2 Tampão traseiro de vedação em PVC voltado para o porta-malas (-Z)
      const capLen = 0.045;
      const capGeo = new THREE.CylinderGeometry(radiusM * 1.045, radiusM * 1.045, capLen, 28);
      capGeo.rotateX(Math.PI / 2);
      const rearCap = new THREE.Mesh(capGeo, capMat);
      rearCap.position.set(sign * pipeOffsetX, pipeCenterY, zRearEnd - capLen / 2 + 0.005);
      rearCap.castShadow = true;
      lateralPipeGroup.add(rearCap);

      // 1.3 Faixa lateral azul indicadora de reservatório
      const stripeLen = Math.max(0.15, lateralPipeLengthM - 0.12);
      const stripeGeo = new THREE.BoxGeometry(0.006, 0.024, stripeLen);
      const stripeMesh = new THREE.Mesh(stripeGeo, waterAccentMat);
      stripeMesh.position.set(sign * (pipeOffsetX - radiusM * 0.98), pipeCenterY + 0.015, zPipeStart - lateralPipeLengthM / 2);
      lateralPipeGroup.add(stripeMesh);

      // 1.4 Torneira / Registro esfera traseiro de saída d'água voltado para o vão traseiro da van (-Z)
      const valveBody = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.038, 12), brassMat);
      valveBody.rotation.x = Math.PI / 2;
      valveBody.position.set(sign * pipeOffsetX, pipeCenterY - radiusM * 0.42, zRearEnd - 0.024);
      lateralPipeGroup.add(valveBody);

      const valveHandle = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.038, 0.010), waterAccentMat);
      valveHandle.position.set(sign * pipeOffsetX, pipeCenterY - radiusM * 0.42 + 0.016, zRearEnd - 0.032);
      lateralPipeGroup.add(valveHandle);

      // 1.5 Abraçadeiras fixadas na face interna da longarina lateral de ferro
      const bracketCount = lateralPipeLengthM >= 1.4 ? 3 : 2;
      for (let i = 0; i < bracketCount; i++) {
        const frac = bracketCount === 2 ? (i === 0 ? 0.22 : 0.78) : (0.15 + i * 0.35);
        const bz = zPipeStart - lateralPipeLengthM * frac;

        // Cinta circular de aço inox ao redor do tubo
        const strapGeo = new THREE.CylinderGeometry(radiusM * 1.03, radiusM * 1.03, 0.022, 24);
        strapGeo.rotateX(Math.PI / 2);
        const strapMesh = new THREE.Mesh(strapGeo, clampMat);
        strapMesh.position.set(sign * pipeOffsetX, pipeCenterY, bz);
        lateralPipeGroup.add(strapMesh);

        // Suporte metálico de fixação na longarina de ferro 40x40
        const armLen = radiusM + 0.02;
        const armGeo = new THREE.BoxGeometry(armLen, 0.032, 0.026);
        const armMesh = new THREE.Mesh(armGeo, clampMat);
        armMesh.position.set(sign * (pipeOffsetX + armLen / 2), pipeCenterY - 0.015, bz);
        lateralPipeGroup.add(armMesh);
      }

      waterTankMasterGroup.add(lateralPipeGroup);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 2. DOIS JOELHOS DE 90° EM PVC (Na dianteira da van, dentro da estrutura)
    // ──────────────────────────────────────────────────────────────────────────
    const leftElbowCurve = new PowerStorageBuilder.QuarterArcCurve(
      -pipeOffsetX + bendR,
      zFrontPipe - bendR,
      bendR,
      Math.PI / 2,
      Math.PI
    );
    const leftElbowGeo = new THREE.TubeGeometry(leftElbowCurve, 16, radiusM, 24, false);
    const leftElbowMesh = new THREE.Mesh(leftElbowGeo, pipeMat);
    leftElbowMesh.position.y = pipeCenterY;
    leftElbowMesh.castShadow = true;
    leftElbowMesh.receiveShadow = true;
    waterTankMasterGroup.add(leftElbowMesh);

    const rightElbowCurve = new PowerStorageBuilder.QuarterArcCurve(
      pipeOffsetX - bendR,
      zFrontPipe - bendR,
      bendR,
      Math.PI / 2,
      0
    );
    const rightElbowGeo = new THREE.TubeGeometry(rightElbowCurve, 16, radiusM, 24, false);
    const rightElbowMesh = new THREE.Mesh(rightElbowGeo, pipeMat);
    rightElbowMesh.position.y = pipeCenterY;
    rightElbowMesh.castShadow = true;
    rightElbowMesh.receiveShadow = true;
    waterTankMasterGroup.add(rightElbowMesh);

    // Bolsas reforçadas dos joelhos (socket rings das conexões de 90° de PVC)
    const socketRingGeoZ = new THREE.CylinderGeometry(radiusM * 1.055, radiusM * 1.055, 0.032, 24);
    socketRingGeoZ.rotateX(Math.PI / 2);
    const socketRingGeoX = new THREE.CylinderGeometry(radiusM * 1.055, radiusM * 1.055, 0.032, 24);
    socketRingGeoX.rotateZ(Math.PI / 2);

    // Encaixes nos canos laterais (face Z)
    [-pipeOffsetX, pipeOffsetX].forEach((xPos) => {
      const ringZ = new THREE.Mesh(socketRingGeoZ, capMat);
      ringZ.position.set(xPos, pipeCenterY, zPipeStart);
      waterTankMasterGroup.add(ringZ);
    });

    // Encaixes no cano frontal (face X)
    [-pipeOffsetX + bendR, pipeOffsetX - bendR].forEach((xPos) => {
      const ringX = new THREE.Mesh(socketRingGeoX, capMat);
      ringX.position.set(xPos, pipeCenterY, zFrontPipe);
      waterTankMasterGroup.add(ringX);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 3. CANO TRANSVERSAL DIANTEIRO (100% dentro do ferro, na frente do baú)
    // ──────────────────────────────────────────────────────────────────────────
    const frontBodyGeo = new THREE.CylinderGeometry(radiusM, radiusM, frontPipeLengthM, 28);
    frontBodyGeo.rotateZ(Math.PI / 2);
    const frontBodyMesh = new THREE.Mesh(frontBodyGeo, pipeMat);
    frontBodyMesh.position.set(0, pipeCenterY, zFrontPipe);
    frontBodyMesh.castShadow = true;
    frontBodyMesh.receiveShadow = true;
    waterTankMasterGroup.add(frontBodyMesh);

    // Faixa azul indicadora no cano frontal
    const frontStripeGeo = new THREE.BoxGeometry(frontPipeLengthM * 0.70, 0.024, 0.006);
    const frontStripeMesh = new THREE.Mesh(frontStripeGeo, waterAccentMat);
    frontStripeMesh.position.set(0, pipeCenterY + 0.015, zFrontPipe + radiusM * 0.98);
    waterTankMasterGroup.add(frontStripeMesh);

    // Bocal superior de abastecimento central (tampa rosqueável azul)
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.030, 0.028, 16), capMat);
    neckMesh.position.set(0, pipeCenterY + radiusM + 0.012, zFrontPipe);
    waterTankMasterGroup.add(neckMesh);

    const fillerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.016, 16), waterAccentMat);
    fillerCap.position.set(0, pipeCenterY + radiusM + 0.030, zFrontPipe);
    waterTankMasterGroup.add(fillerCap);

    // Válvula de alívio / respiro de ar ao lado do bocal
    const breatherMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.022, 12), brassMat);
    breatherMesh.position.set(0.12, pipeCenterY + radiusM + 0.011, zFrontPipe);
    waterTankMasterGroup.add(breatherMesh);

    // Suportes frontais ancorados na face interna da travessa dianteira de ferro 40x40
    [-0.25, 0.25].forEach((fx) => {
      const frontStrap = new THREE.Mesh(socketRingGeoX.clone(), clampMat);
      frontStrap.position.set(fx, pipeCenterY, zFrontPipe);
      waterTankMasterGroup.add(frontStrap);

      const frontArmGeo = new THREE.BoxGeometry(0.032, 0.032, radiusM + 0.02);
      const frontArm = new THREE.Mesh(frontArmGeo, clampMat);
      frontArm.position.set(fx, pipeCenterY - 0.015, zFrontPipe + (radiusM * 0.5 + 0.01));
      waterTankMasterGroup.add(frontArm);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 4. METADADOS E TOOLTIP INTERATIVO
    // ──────────────────────────────────────────────────────────────────────────
    const waterUserData = {
      isElectrical: true,
      isElectricalRoot: true,
      electricalType: 'water' as const,
      name: `Caixa d'Água em U (2 Joelhos 90° + Canos PVC Ø${diameterMm}mm dentro do ferro)`,
      category: `Reservatório Hidráulico Contínuo em U ao Redor do Baú (Ø${diameterMm}mm)`,
      voltage: `Raio: ${radiusMm} mm (Ø${diameterMm} mm) • Extensão Total: ${totalEffectiveLengthM.toFixed(2)} m`,
      capacity: `${totalLiters} Litros Total (${singleLateralLiters}L lateral esq. + ${singleLateralLiters}L lateral dir. + ${frontCircuitLiters}L interligação frontal)`,
      current: `100% Interno no Quadro: 2× Laterais (${(lateralPipeLengthM * 1000).toFixed(0)}mm) + 1× Frontal (${(frontPipeLengthM * 1000).toFixed(0)}mm) + 2× Joelhos 90°`,
      power: `Peso da Água: +${totalLiters} kg cheio`,
      material: `Tubos PVC Série R Ø${diameterMm}mm + 2× Joelhos 90° com bolsa e anel + 2× Caps traseiros + Registros Latão 1/2"`,
      purpose: 'Reserva de água contínua em formato U instalada internamente no quadro de ferro abraçando o baú',
      efficiency: '100% embutido dentro da largura de 1,40m da estrutura de ferro (não projeta nas laterais da van)',
      features: [
        `Estrutura contínua em U dentro do ferro (${totalLiters} L)`,
        `2× Joelhos PVC 90° Ø${diameterMm}mm interligando a estrutura na dianteira`,
        `1× Cano frontal de ${(frontPipeLengthM * 1000).toFixed(0)}mm com bocal de abastecimento`,
        `2× Canos laterais longitudinais de ${(lateralPipeLengthM * 1000).toFixed(0)}mm`,
        '2× Registros traseiros de latão para saída de água na tampa da van',
        'Nível equalizado por gravidade e sem protuberâncias externas'
      ]
    };

    waterTankMasterGroup.userData = waterUserData;
    waterTankMasterGroup.traverse((c) => {
      if ((c as any).isMesh) {
        c.userData = { ...waterUserData, isElectricalRoot: false, electricalRoot: waterTankMasterGroup };
      }
    });

    targetGroup.add(waterTankMasterGroup);

    // ──────────────────────────────────────────────────────────────────────────
    // 5. ETIQUETA TÉCNICA 3D FLUTUANTE
    // ──────────────────────────────────────────────────────────────────────────
    const waterLabel = TextureGenerator.createDimensionSprite(
      `💧 CAIXA D'ÁGUA EM U (INTERNA): R=${radiusMm}mm / Ø${diameterMm}mm (${totalLiters} L)`,
      `2× Joelhos 90° • Frontal ${(frontPipeLengthM * 1000).toFixed(0)}mm • 2× Laterais ${(lateralPipeLengthM * 1000).toFixed(0)}mm`,
      'rgba(8, 47, 73, 0.94)',
      '#38bdf8'
    );
    waterLabel.position.set(0, pipeCenterY + radiusM + 0.18, zFrontPipe);
    if (labelsGroup) {
      labelsGroup.add(waterLabel);
    } else {
      targetGroup.add(waterLabel);
    }
  }
}

