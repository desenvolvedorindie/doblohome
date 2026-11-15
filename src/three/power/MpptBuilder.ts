import * as THREE from 'three';
import { MaterialLibrary } from '../Materials';
import { TextureGenerator } from '../Textures';

export class MpptBuilder {
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

    // 7. Cabos opcionais
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

    // 8. Metadados Elétricos
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

    mppt.position.set(0.25, 0.85, zCenter);
    mppt.rotation.y = 0;

    targetGroup.add(mppt);
  }
}
