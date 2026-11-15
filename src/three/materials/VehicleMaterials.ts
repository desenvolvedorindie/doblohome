import * as THREE from 'three';
import { TextureGenerator } from '../Textures';

export function initVehicleMaterials(materials: Record<string, any>) {
  materials.telescopicRail = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.15
  });

  materials.telescopicInner = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.8,
    roughness: 0.25,
    emissive: new THREE.Color(0x0284c7),
    emissiveIntensity: 0.2
  });

  materials.cableChain = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.75,
    metalness: 0.15
  });

  materials.solarCableRed = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.5,
    metalness: 0.2
  });
  materials.solarCableBlack = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.5,
    metalness: 0.2
  });

  materials.carPaint = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.45,
    roughness: 0.25
  });

  materials.carBumper = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.8,
    metalness: 0.2
  });

  materials.carGlass = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.65,
    roughness: 0.05,
    metalness: 0.8
  });

  materials.tireRubber = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.9,
    metalness: 0.05
  });

  materials.wheelRim = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.3
  });

  materials.dimensionLine = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    linewidth: 2,
    transparent: true,
    opacity: 0.85
  });

  materials.dimensionLineAccent = new THREE.LineBasicMaterial({
    color: 0xf59e0b,
    linewidth: 2,
    transparent: true,
    opacity: 0.85
  });

  materials.roofOutline = new THREE.LineDashedMaterial({
    color: 0x94a3b8,
    dashSize: 0.06,
    gapSize: 0.04,
    linewidth: 2
  });

  // 8.9 Bateria LiFePO4 Kingbo 12.8V 560Ah (7.168 kWh com JK BMS 4.3")
  const kingboFrontTex = TextureGenerator.createKingboBatteryFrontTexture();
  const kingboScreenTex = TextureGenerator.createKingboBmsScreenTexture();
  const kingboTopTex = TextureGenerator.createKingboBatteryTopTexture();

  materials.kingboCase = new THREE.MeshStandardMaterial({
    color: 0x181e26, // Carcaça em aço carbono preto fosco / grafite eletrostático
    metalness: 0.62,
    roughness: 0.38,
    envMapIntensity: 1.2
  });

  materials.kingboFrontLabel = new THREE.MeshStandardMaterial({
    map: kingboFrontTex,
    roughness: 0.28,
    metalness: 0.25,
    bumpMap: kingboFrontTex,
    bumpScale: 0.001
  });

  materials.kingboTop = new THREE.MeshStandardMaterial({
    map: kingboTopTex,
    roughness: 0.32,
    metalness: 0.35
  });

  materials.kingboScreen = new THREE.MeshStandardMaterial({
    map: kingboScreenTex,
    emissive: new THREE.Color(0x0ea5e9),
    emissiveIntensity: 0.65,
    roughness: 0.05,
    metalness: 0.05
  });

  materials.kingboTerminalPos = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Borne positivo (+) vermelho vivo
    metalness: 0.75,
    roughness: 0.22
  });

  materials.kingboTerminalNeg = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Borne negativo (-) preto
    metalness: 0.75,
    roughness: 0.22
  });

  materials.kingboBrass = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Parafusos M8 de latão / cobre de alta condutividade
    metalness: 0.95,
    roughness: 0.15
  });

  materials.kingboHandle = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Alças de transporte em aço inoxidável escovado
    metalness: 0.88,
    roughness: 0.22
  });

  materials.mpptCase = new THREE.MeshStandardMaterial({
    color: 0x1a1f2e,
    metalness: 0.55,
    roughness: 0.42
  });
  materials.mpptHeatsink = new THREE.MeshStandardMaterial({
    color: 0x2d3748,
    metalness: 0.88,
    roughness: 0.28,
    envMapIntensity: 1.3
  });
  materials.mpptScreen = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: new THREE.Color(0x0ea5e9),
    emissiveIntensity: 0.55,
    roughness: 0.08,
    metalness: 0.0
  });
  materials.mpptTerminalPV = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.92,
    roughness: 0.18
  });
  materials.mpptTerminalBat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    metalness: 0.88,
    roughness: 0.20
  });
  materials.mpptButton = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    metalness: 0.3,
    roughness: 0.5
  });

  // 9.1 Carregador Inteligente DC-DC B2B1230 12V 30A (Alternador Doblò -> LiFePO4)
  materials.b2bCase = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, // Carcaça em alumínio anodizado azul cobalto automotivo
    metalness: 0.65,
    roughness: 0.32,
    envMapIntensity: 1.2
  });
  materials.b2bHeatsink = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Aletas de refrigeração preto acetinado
    metalness: 0.85,
    roughness: 0.25
  });
  materials.b2bLedGreen = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: new THREE.Color(0x22c55e),
    emissiveIntensity: 0.95,
    roughness: 0.1,
    metalness: 0.1
  });
  materials.b2bLedBlue = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x0284c7),
    emissiveIntensity: 1.2,
    roughness: 0.05,
    metalness: 0.1
  });
  materials.b2bTerminalAlt = new THREE.MeshStandardMaterial({
    color: 0xeab308, // Terminal alternador IN (dourado/amarelo de alta corrente)
    metalness: 0.92,
    roughness: 0.20
  });

  // 9.2 Fonte e Carregador Automotivo Smart Connect Usina 150A 12V Bivolt
  materials.usinaCase = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Vermelho Ferrari/Spark característico das fontes Usina
    metalness: 0.52,
    roughness: 0.28,
    envMapIntensity: 1.1
  });
  materials.usinaFace = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Frente preta serigrafada com aberturas de ventilação
    metalness: 0.35,
    roughness: 0.65
  });
  materials.usinaDisplay = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Display voltímetro/amperímetro digital vermelho de 7 segmentos
    emissive: new THREE.Color(0xef4444),
    emissiveIntensity: 1.4,
    roughness: 0.05,
    metalness: 0.0
  });
  materials.usinaBrassTerminal = new THREE.MeshStandardMaterial({
    color: 0xeab308, // Bornes reforçados de 150A em latão polido
    metalness: 0.95,
    roughness: 0.15
  });
  materials.usinaCooler = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    metalness: 0.7,
    roughness: 0.4
  });
}
