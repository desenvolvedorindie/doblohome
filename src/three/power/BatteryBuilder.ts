import * as THREE from 'three';
import { MaterialLibrary } from '../Materials';
import { TextureGenerator } from '../Textures';

export class BatteryBuilder {
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

    // 3. Textura Serigrafada na Tampa Superior
    const topFaceGeo = new THREE.PlaneGeometry(width * 0.94, length * 0.94);
    topFaceGeo.rotateX(-Math.PI / 2);
    const topFaceMesh = new THREE.Mesh(topFaceGeo, mats.kingboTop);
    topFaceMesh.position.set(0, height / 2 + 0.0225, 0);
    batGroup.add(topFaceMesh);

    // 4. Painel Frontal/Lateral Serigrafado
    const sidePlateGeo = new THREE.PlaneGeometry(length * 0.90, height * 0.82);
    sidePlateGeo.rotateY(Math.PI / 2);
    const sidePlate = new THREE.Mesh(sidePlateGeo, mats.kingboFrontLabel);
    sidePlate.position.set(width / 2 + 0.001, 0, 0);
    batGroup.add(sidePlate);

    const frontPlateGeo = new THREE.PlaneGeometry(width * 0.88, height * 0.78);
    const frontPlate = new THREE.Mesh(frontPlateGeo, mats.kingboFrontLabel);
    frontPlate.position.set(0, 0, length / 2 + 0.001);
    batGroup.add(frontPlate);

    // 5. Moldura e Tela LCD Digital JK Smart BMS
    const screenBezelGeo = new THREE.BoxGeometry(0.16, 0.006, 0.105);
    const screenBezel = new THREE.Mesh(screenBezelGeo, mats.kingboCase);
    screenBezel.position.set(0, height / 2 + 0.024, 0);
    batGroup.add(screenBezel);

    const screenGeo = new THREE.PlaneGeometry(0.145, 0.09);
    screenGeo.rotateX(-Math.PI / 2);
    const screenMesh = new THREE.Mesh(screenGeo, mats.kingboScreen);
    screenMesh.position.set(0, height / 2 + 0.0275, 0);
    batGroup.add(screenMesh);

    // 6. Borne Terminal Positivo (+)
    const termPosBaseGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.028, 20);
    const termPosBase = new THREE.Mesh(termPosBaseGeo, mats.kingboTerminalPos);
    termPosBase.position.set(-width / 2 + 0.065, height / 2 + 0.035, -length / 2 + 0.08);
    batGroup.add(termPosBase);

    const boltPosGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.020, 12);
    const boltPos = new THREE.Mesh(boltPosGeo, mats.kingboBrass);
    boltPos.position.set(-width / 2 + 0.065, height / 2 + 0.052, -length / 2 + 0.08);
    batGroup.add(boltPos);

    // 7. Borne Terminal Negativo (-)
    const termNegBaseGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.028, 20);
    const termNegBase = new THREE.Mesh(termNegBaseGeo, mats.kingboTerminalNeg);
    termNegBase.position.set(width / 2 - 0.065, height / 2 + 0.035, -length / 2 + 0.08);
    batGroup.add(termNegBase);

    const boltNegGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.020, 12);
    const boltNeg = new THREE.Mesh(boltNegGeo, mats.kingboBrass);
    boltNeg.position.set(width / 2 - 0.065, height / 2 + 0.052, -length / 2 + 0.08);
    batGroup.add(boltNeg);

    // 8. Alças Laterais de Transporte
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

    // 10. Metadados Elétricos
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

    batGroup.position.set(-0.25, 0.75, zCenter);
    targetGroup.add(batGroup);
  }
}
