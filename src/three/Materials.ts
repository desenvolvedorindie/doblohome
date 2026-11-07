import * as THREE from 'three';
import { TextureGenerator } from './Textures';

/**
 * Biblioteca de Materiais PBR (Physically Based Rendering)
 * Para o sistema solar, Fiat Doblò, trilhos, corrediças e esteira porta-cabos
 */
export const MaterialLibrary = {
  materials: {} as Record<string, any>,
  initialized: false,

  init: function () {
    if (this.initialized) return;

    // 1. Textura procedural do silício monocristalino
    const solarTex = TextureGenerator.createSolarPanelTexture(6, 12);
    const brushedMetalTex = TextureGenerator.createBrushedMetalTexture();

    // 2. Material fotovoltaico da placa solar (vidro temperado antirreflexo)
    this.materials.solarCell = new THREE.MeshStandardMaterial({
      map: solarTex,
      metalness: 0.65,
      roughness: 0.18,
      bumpMap: solarTex,
      bumpScale: 0.002,
      envMapIntensity: 1.2
    });

    // 2.1 Painel Solar Flexível 100W (Modelagem Física Pura sem Textura de Imagem)
    this.materials.flexiblePanelSubstrate = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.38,
      metalness: 0.08,
      envMapIntensity: 1.1
    });

    this.materials.monocrystallineWafer = new THREE.MeshStandardMaterial({
      color: 0x070b12,
      roughness: 0.14,
      metalness: 0.75,
      envMapIntensity: 1.6
    });

    this.materials.silverBusbar = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.16,
      metalness: 0.95,
      envMapIntensity: 1.8
    });

    this.materials.etfeEncapsulant = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9
    });

    this.materials.flexiblePanelBack = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.85,
      metalness: 0.05
    });

    this.materials.grommetMetal = new THREE.MeshStandardMaterial({
      color: 0xecf0f5,
      metalness: 0.96,
      roughness: 0.16,
      envMapIntensity: 1.6
    });

    this.materials.eyeletBolt = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.94,
      roughness: 0.2
    });

    this.materials.eyeletBracket = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.90,
      roughness: 0.28
    });

    this.materials.junctionBox = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.12,
      roughness: 0.45
    });

    this.materials.cableRed = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      metalness: 0.05,
      roughness: 0.52
    });
    this.materials.cableBlack = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.05,
      roughness: 0.52
    });

    this.materials.mc4Connector = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.25,
      roughness: 0.35
    });

    this.materials.panelFrame = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.35,
      map: brushedMetalTex
    });

    this.materials.panelBacksheet = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.8,
      metalness: 0.1
    });

    const extrusionBlackTex = TextureGenerator.createExtrusionMetalTexture(true);
    const extrusionSilverTex = TextureGenerator.createExtrusionMetalTexture(false);

    this.materials.aluminumProfileSilver = new THREE.MeshStandardMaterial({
      color: 0xd6dee6,
      metalness: 0.92,
      roughness: 0.24,
      map: extrusionSilverTex,
      bumpMap: extrusionSilverTex,
      bumpScale: 0.0006,
      envMapIntensity: 1.5
    });

    this.materials.aluminumProfileBlack = new THREE.MeshStandardMaterial({
      color: 0x1a212d,
      metalness: 0.86,
      roughness: 0.32,
      map: extrusionBlackTex,
      bumpMap: extrusionBlackTex,
      bumpScale: 0.0006,
      envMapIntensity: 1.3
    });

    this.materials.aluminumCutFace = new THREE.MeshStandardMaterial({
      color: 0xe8edf2,
      metalness: 0.95,
      roughness: 0.18,
      envMapIntensity: 1.6
    });

    this.materials.extrusionBracket = new THREE.MeshStandardMaterial({
      color: 0xc8d0da,
      metalness: 0.88,
      roughness: 0.32,
      bumpMap: extrusionSilverTex,
      bumpScale: 0.0004
    });

    this.materials.allenScrew = new THREE.MeshStandardMaterial({
      color: 0xedf2f7,
      metalness: 0.96,
      roughness: 0.15
    });

    this.materials.tNut = new THREE.MeshStandardMaterial({
      color: 0xa0aec0,
      metalness: 0.94,
      roughness: 0.22
    });

    const metalonTex = TextureGenerator.createMetalonSteelTexture();
    this.materials.weldedSteelMetalon = new THREE.MeshStandardMaterial({
      color: 0x333b47,
      metalness: 0.82,
      roughness: 0.42,
      map: metalonTex,
      bumpMap: metalonTex,
      bumpScale: 0.0015,
      envMapIntensity: 1.2
    });

    this.materials.telescopicRail = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15
    });

    this.materials.telescopicInner = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.8,
      roughness: 0.25,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.2
    });

    this.materials.cableChain = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.75,
      metalness: 0.15
    });

    this.materials.solarCableRed = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.5,
      metalness: 0.2
    });
    this.materials.solarCableBlack = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.5,
      metalness: 0.2
    });

    this.materials.carPaint = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.45,
      roughness: 0.25
    });

    this.materials.carBumper = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.2
    });

    this.materials.carGlass = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.65,
      roughness: 0.05,
      metalness: 0.8
    });

    this.materials.tireRubber = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.9,
      metalness: 0.05
    });

    this.materials.wheelRim = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.3
    });

    this.materials.dimensionLine = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });

    this.materials.dimensionLineAccent = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });

    this.materials.roofOutline = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 0.06,
      gapSize: 0.04,
      linewidth: 2
    });

    this.materials.mpptCase = new THREE.MeshStandardMaterial({
      color: 0x1a1f2e,
      metalness: 0.55,
      roughness: 0.42
    });
    this.materials.mpptHeatsink = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      metalness: 0.88,
      roughness: 0.28,
      envMapIntensity: 1.3
    });
    this.materials.mpptScreen = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: new THREE.Color(0x0ea5e9),
      emissiveIntensity: 0.55,
      roughness: 0.08,
      metalness: 0.0
    });
    this.materials.mpptTerminalPV = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.92,
      roughness: 0.18
    });
    this.materials.mpptTerminalBat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.88,
      roughness: 0.20
    });
    this.materials.mpptButton = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.3,
      roughness: 0.5
    });

    // 9.1 Carregador Inteligente DC-DC B2B1230 12V 30A (Alternador Doblò -> LiFePO4)
    this.materials.b2bCase = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Carcaça em alumínio anodizado azul cobalto automotivo
      metalness: 0.65,
      roughness: 0.32,
      envMapIntensity: 1.2
    });
    this.materials.b2bHeatsink = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Aletas de refrigeração preto acetinado
      metalness: 0.85,
      roughness: 0.25
    });
    this.materials.b2bLedGreen = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: new THREE.Color(0x22c55e),
      emissiveIntensity: 0.95,
      roughness: 0.1,
      metalness: 0.1
    });
    this.materials.b2bLedBlue = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 1.2,
      roughness: 0.05,
      metalness: 0.1
    });
    this.materials.b2bTerminalAlt = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Terminal alternador IN (dourado/amarelo de alta corrente)
      metalness: 0.92,
      roughness: 0.20
    });

    // 9.2 Fonte e Carregador Automotivo Smart Connect Usina 150A 12V Bivolt
    this.materials.usinaCase = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Vermelho Ferrari/Spark característico das fontes Usina
      metalness: 0.52,
      roughness: 0.28,
      envMapIntensity: 1.1
    });
    this.materials.usinaFace = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Frente preta serigrafada com aberturas de ventilação
      metalness: 0.35,
      roughness: 0.65
    });
    this.materials.usinaDisplay = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Display voltímetro/amperímetro digital vermelho de 7 segmentos
      emissive: new THREE.Color(0xef4444),
      emissiveIntensity: 1.4,
      roughness: 0.05,
      metalness: 0.0
    });
    this.materials.usinaBrassTerminal = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Bornes reforçados de 150A em latão polido
      metalness: 0.95,
      roughness: 0.15
    });
    this.materials.usinaCooler = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.7,
      roughness: 0.4
    });

    // 10. Baú de Teto Motobul Off Road & Mecanismos de Basculamento
    this.materials.cargoBoxShell = new THREE.MeshStandardMaterial({
      color: 0x727f8d, // Cinza ardósia / cimento militar texturizado fiel à foto do Motobul Off Road
      roughness: 0.52,
      metalness: 0.12,
      envMapIntensity: 0.95
    });

    this.materials.cargoBoxBase = new THREE.MeshStandardMaterial({
      color: 0x161a22, // Cuba inferior preta acetinada
      roughness: 0.70,
      metalness: 0.06
    });

    this.materials.cargoBoxRib = new THREE.MeshStandardMaterial({
      color: 0x626e7b, // Nervuras de reforço estrutural com sutil contraste
      roughness: 0.48,
      metalness: 0.14
    });

    this.materials.cargoBoxLatch = new THREE.MeshStandardMaterial({
      color: 0x181c24, // Fechos e travas de polímero preto de alta resistência
      metalness: 0.40,
      roughness: 0.45
    });

    this.materials.cargoBoxLock = new THREE.MeshStandardMaterial({
      color: 0xd4d8df, // Chapa e miolo da fechadura central em zinco/inox com chave
      metalness: 0.88,
      roughness: 0.22,
      envMapIntensity: 1.4
    });

    this.materials.cargoBoxEmblem = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.85,
      roughness: 0.2
    });

    this.materials.gasStrutCylinder = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Cilindro do pistão a gás em preto fosco eletrostático
      metalness: 0.82,
      roughness: 0.32
    });

    this.materials.gasStrutRod = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Haste cromada espelhada
      metalness: 0.98,
      roughness: 0.06,
      envMapIntensity: 1.8
    });

    this.materials.gasStrutMount = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Terminal esférico / olhal
      metalness: 0.88,
      roughness: 0.25
    });

    this.materials.stainlessHinge = new THREE.MeshStandardMaterial({
      color: 0xd1d5db, // Dobradiça industrial aço inox 304 escovado
      metalness: 0.94,
      roughness: 0.22,
      envMapIntensity: 1.5
    });

    this.materials.toggleClamp = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc, // Corpo de aço zincado do fecho rápido
      metalness: 0.90,
      roughness: 0.22
    });

    this.materials.toggleClampGrip = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Manopla vermelha de vinil do engate rápido
      metalness: 0.05,
      roughness: 0.35
    });

    this.materials.rubberRestPad = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Coxim de borracha para assentamento do rack
      roughness: 0.92,
      metalness: 0.02
    });

    this.initialized = true;
  },

  get: function (name: string): any {
    if (!this.initialized) this.init();
    return this.materials[name];
  }
};

