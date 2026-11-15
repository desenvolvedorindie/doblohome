import * as THREE from 'three';
import { MaterialLibrary } from '../Materials';
import { TextureGenerator } from '../Textures';

export class B2BChargerBuilder {
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

    // 4. Painel frontal serigrafado
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

    // 5. LED Indicador Bluetooth
    const btLedGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.004, 12);
    btLedGeo.rotateX(Math.PI / 2);
    const btLed = new THREE.Mesh(btLedGeo, mats.b2bLedBlue);
    btLed.position.set(W * 0.28, H * 0.22, D / 2 + 0.003);
    b2b.add(btLed);

    const btBadgeGeo = new THREE.PlaneGeometry(0.016, 0.016);
    const btBadgeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95
    });
    const btBadge = new THREE.Mesh(btBadgeGeo, btBadgeMat);
    btBadge.position.set(W * 0.28, H * 0.22, D / 2 + 0.005);
    b2b.add(btBadge);

    // 6. LEDs de Status do B2B
    const ledSpacing = 0.014;
    for (let i = 0; i < 3; i++) {
      const ledGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.003, 10);
      ledGeo.rotateX(Math.PI / 2);
      const led = new THREE.Mesh(ledGeo, mats.b2bLedGreen);
      led.position.set(-W * 0.28 + i * ledSpacing, H * 0.22, D / 2 + 0.003);
      b2b.add(led);
    }

    // 7. Borneiras de Alta Corrente
    const blockGeo = new THREE.BoxGeometry(0.026, 0.022, 0.020);

    const altPos = new THREE.Mesh(blockGeo, mats.b2bTerminalAlt || mats.mpptTerminalPV);
    altPos.position.set(-W * 0.26, -H / 2 - 0.010, 0);
    b2b.add(altPos);

    const altNeg = new THREE.Mesh(blockGeo, mats.weldedSteelMetalon);
    altNeg.position.set(-W * 0.10, -H / 2 - 0.010, 0);
    b2b.add(altNeg);

    const dPlusGeo = new THREE.BoxGeometry(0.012, 0.014, 0.012);
    const dPlusMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.5, roughness: 0.3 });
    const dPlus = new THREE.Mesh(dPlusGeo, dPlusMat);
    dPlus.position.set(0, -H / 2 - 0.007, 0);
    b2b.add(dPlus);

    const outPos = new THREE.Mesh(blockGeo, mats.mpptTerminalBat);
    outPos.position.set(W * 0.10, -H / 2 - 0.010, 0);
    b2b.add(outPos);

    const outNeg = new THREE.Mesh(blockGeo, mats.weldedSteelMetalon);
    outNeg.position.set(W * 0.26, -H / 2 - 0.010, 0);
    b2b.add(outNeg);

    // 8. Cabos opcionais
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

    // 9. Metadados Elétricos
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

    b2b.position.set(0.0, 0.62, zCenter - 0.25);
    b2b.rotation.y = 0;

    targetGroup.add(b2b);
  }
}
