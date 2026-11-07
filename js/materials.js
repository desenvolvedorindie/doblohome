/**
 * Biblioteca de Materiais PBR (Physically Based Rendering)
 * Para o sistema solar, Fiat Doblò, trilhos, corrediças e esteira porta-cabos
 */

const MaterialLibrary = {
  materials: {},

  init: function () {
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
    // 2.1.1 Substrato Laminado Polimérico Branco (Base de ETFE/TPT com borda)
    this.materials.flexiblePanelSubstrate = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.38,
      metalness: 0.08,
      envMapIntensity: 1.1
    });

    // 2.1.2 Placa Fotovoltaica Monocristalina (Silício escuro com reflexo antirreflexo)
    this.materials.monocrystallineWafer = new THREE.MeshStandardMaterial({
      color: 0x070b12,
      roughness: 0.14,
      metalness: 0.75,
      envMapIntensity: 1.6
    });

    // 2.1.3 Fitas de Contato e Barramentos de Prata (Busbars condutores em 3D)
    this.materials.silverBusbar = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.16,
      metalness: 0.95,
      envMapIntensity: 1.8
    });

    // 2.1.4 Película Protetora Superior ETFE (Camada transparente brilhante)
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

    // 2.1.5 Backsheet traseiro do painel flexível
    this.materials.flexiblePanelBack = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.85,
      metalness: 0.05
    });

    // Ilhoses metálicos de fixação (anéis de reforço em aço inoxidável / níquel)
    this.materials.grommetMetal = new THREE.MeshStandardMaterial({
      color: 0xecf0f5,
      metalness: 0.96,
      roughness: 0.16,
      envMapIntensity: 1.6
    });

    // Parafuso Allen e arruela de fixação dos ilhoses no perfil
    this.materials.eyeletBolt = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.94,
      roughness: 0.2
    });

    // Presilha / suporte de fixação do ilhós à ranhura T do perfil
    this.materials.eyeletBracket = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.90,
      roughness: 0.28
    });

    // Caixa de junção frontal do painel flexível
    this.materials.junctionBox = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.12,
      roughness: 0.45
    });

    // Cabos solares flexíveis fotovoltaicos (4mm² com proteção UV)
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

    // Conectores solares industriais MC4 macho e fêmea
    this.materials.mc4Connector = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.25,
      roughness: 0.35
    });

    // 3. Moldura de alumínio do painel solar (Anodizado Prata)
    this.materials.panelFrame = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.35,
      map: brushedMetalTex
    });

    // 4. Backsheet traseiro (Tedlar branco isolante)
    this.materials.panelBacksheet = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.8,
      metalness: 0.1
    });

    // 5. Perfil de Alumínio Estrutural (T-Slot 40x40 Cor Natural de Alumínio Prata Anodizado)
    const extrusionBlackTex = TextureGenerator.createExtrusionMetalTexture(true);
    const extrusionSilverTex = TextureGenerator.createExtrusionMetalTexture(false);

    // Cor Natural de Alumínio Anodizado (Prata Acetinado com Estrias Metálicas)
    this.materials.aluminumProfileSilver = new THREE.MeshStandardMaterial({
      color: 0xd6dee6,
      metalness: 0.92,
      roughness: 0.24,
      map: extrusionSilverTex,
      bumpMap: extrusionSilverTex,
      bumpScale: 0.0006,
      envMapIntensity: 1.5
    });

    // Variante Preto Anodizado
    this.materials.aluminumProfileBlack = new THREE.MeshStandardMaterial({
      color: 0x1a212d,
      metalness: 0.86,
      roughness: 0.32,
      map: extrusionBlackTex,
      bumpMap: extrusionBlackTex,
      bumpScale: 0.0006,
      envMapIntensity: 1.3
    });

    // Face cortada na serra de precisão (seção transversal com corte usinado brilhante)
    this.materials.aluminumCutFace = new THREE.MeshStandardMaterial({
      color: 0xe8edf2,
      metalness: 0.95,
      roughness: 0.18,
      envMapIntensity: 1.6
    });

    // Cantoneiras em L 4040 injetadas (Alumínio natural fundido/jateado)
    this.materials.extrusionBracket = new THREE.MeshStandardMaterial({
      color: 0xc8d0da,
      metalness: 0.88,
      roughness: 0.32,
      bumpMap: extrusionSilverTex,
      bumpScale: 0.0004
    });

    // Parafusos Allen sextavados M8 (Aço Inox brilhante / Zincado)
    this.materials.allenScrew = new THREE.MeshStandardMaterial({
      color: 0xedf2f7,
      metalness: 0.96,
      roughness: 0.15
    });

    // Porcas T-Nut deslizantes zincadas
    this.materials.tNut = new THREE.MeshStandardMaterial({
      color: 0xa0aec0,
      metalness: 0.94,
      roughness: 0.22
    });

    // 5b. Tubo de Aço Carbono Estrutural / Ferro Soldado (Metalon 40x40 com acabamento epóxi)
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

    // 6. Trilhos telescópicos pesados (Aço Zincado / Inox Heavy Duty)
    this.materials.telescopicRail = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15
    });

    this.materials.telescopicInner = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.8,
      roughness: 0.25,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2
    });

    // 7. Esteira Porta-Cabos (Lagarta articulada em Nylon PA66 preto)
    this.materials.cableChain = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.75,
      metalness: 0.15
    });

    // 8. Cabos elétricos solares (Fotovoltaicos 6mm² Vermelho e Preto UV)
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

    // 11. Pintura da Fiat Doblò (Branco Glacier / Prata Metálico com verniz)
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

    // 12. Vidros da Doblò (Parabrisa e janelas)
    this.materials.carGlass = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.65,
      roughness: 0.05,
      metalness: 0.8
    });

    // 13. Pneus (Borracha preta)
    this.materials.tireRubber = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.9,
      metalness: 0.05
    });

    // 14. Rodas / Calotas
    this.materials.wheelRim = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.3
    });

    // 15. Linhas técnicas de cota
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

    // 16. Marcador do contorno do teto (220 x 140 cm)
    this.materials.roofOutline = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 0.06,
      gapSize: 0.04,
      linewidth: 2
    });

    // 17. Controlador MPPT Kingbo 60A — Caixa e componentes
    // Carcaça principal em ABS/alumínio preto fosco com dissipador
    this.materials.mpptCase = new THREE.MeshStandardMaterial({
      color: 0x1a1f2e,
      metalness: 0.55,
      roughness: 0.42
    });
    // Dissipador de calor em alumínio anodizado (aletas externas)
    this.materials.mpptHeatsink = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      metalness: 0.88,
      roughness: 0.28,
      envMapIntensity: 1.3
    });
    // Display LCD colorido do MPPT
    this.materials.mpptScreen = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.55,
      roughness: 0.08,
      metalness: 0.0
    });
    // Terminais de entrada FV (parafuso bronze)
    this.materials.mpptTerminalPV = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.92,
      roughness: 0.18
    });
    // Terminais de saída bateria (parafuso cobre)
    this.materials.mpptTerminalBat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.88,
      roughness: 0.20
    });
    // Tampa/botão frontal
    this.materials.mpptButton = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.3,
      roughness: 0.5
    });
  },

  get: function (name) {
    return this.materials[name];
  }
};

