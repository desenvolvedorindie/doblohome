import * as THREE from 'three';
import { MaterialLibrary } from '../Materials';
import { TextureGenerator } from '../Textures';

export class UsinaChargerBuilder {
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

    // 1. Carcaça em chapa de aço vermelha
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

    // 4. Coolers duplos de ventilação inteligente
    const fanRadius = 0.026;
    const fanOffsets = [-0.085, 0.085];
    fanOffsets.forEach((fx) => {
      const rimGeo = new THREE.RingGeometry(fanRadius * 0.88, fanRadius, 24);
      const rim = new THREE.Mesh(rimGeo, mats.usinaCooler || mats.weldedSteelMetalon);
      rim.position.set(fx, 0, D / 2 + 0.002);
      usina.add(rim);

      const gridGeo = new THREE.CircleGeometry(fanRadius * 0.86, 16);
      const gridMat = new THREE.MeshBasicMaterial({ color: 0x111827, wireframe: true });
      const grid = new THREE.Mesh(gridGeo, gridMat);
      grid.position.set(fx, 0, D / 2 + 0.003);
      usina.add(grid);

      const hubGeo = new THREE.CircleGeometry(0.008, 16);
      const hub = new THREE.Mesh(hubGeo, mats.usinaCooler);
      hub.position.set(fx, 0, D / 2 + 0.004);
      usina.add(hub);
    });

    // 5. Display Digital Smart Connect
    const dispW = 0.060;
    const dispH = 0.026;
    const dispGeo = new THREE.PlaneGeometry(dispW, dispH);
    const dispMesh = new THREE.Mesh(dispGeo, mats.usinaDisplay);
    dispMesh.position.set(0, H * 0.16, D / 2 + 0.002);
    usina.add(dispMesh);

    const dispFrameGeo = new THREE.PlaneGeometry(dispW + 0.006, dispH + 0.006);
    const dispFrame = new THREE.Mesh(dispFrameGeo, mats.usinaCooler);
    dispFrame.position.set(0, H * 0.16, D / 2 + 0.0015);
    usina.add(dispFrame);

    // 6. Botão de Ajuste Fino e Chave
    const knobGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.006, 14);
    knobGeo.rotateX(Math.PI / 2);
    const knob = new THREE.Mesh(knobGeo, mats.aluminumProfileSilver);
    knob.position.set(-0.022, -H * 0.18, D / 2 + 0.003);
    usina.add(knob);

    const switchGeo = new THREE.BoxGeometry(0.012, 0.018, 0.006);
    const switchMesh = new THREE.Mesh(switchGeo, mats.usinaCase);
    switchMesh.position.set(0.022, -H * 0.18, D / 2 + 0.003);
    usina.add(switchMesh);

    // 7. Bornes reforçados de alta corrente (150A)
    const termBlockGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.025, 16);
    termBlockGeo.rotateX(Math.PI / 2);

    const termPos = new THREE.Mesh(termBlockGeo, mats.usinaBrassTerminal);
    termPos.position.set(-W * 0.35, -H * 0.10, -D / 2 - 0.010);
    usina.add(termPos);

    const termNeg = new THREE.Mesh(termBlockGeo, mats.weldedSteelMetalon);
    termNeg.position.set(-W * 0.20, -H * 0.10, -D / 2 - 0.010);
    usina.add(termNeg);

    // 8. Cabos opcionais
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

    // 9. Metadados Elétricos
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

    usina.position.set(-0.28, 0.52, zCenter - 0.28);
    usina.rotation.y = 0;

    targetGroup.add(usina);
  }
}
