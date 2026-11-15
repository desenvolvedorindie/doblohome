import * as THREE from 'three';
import { TextureGenerator } from '../Textures';

export function initSolarMaterials(materials: Record<string, any>) {
  // 1. Textura procedural do silício monocristalino
  const solarTex = TextureGenerator.createSolarPanelTexture(6, 12);
  const brushedMetalTex = TextureGenerator.createBrushedMetalTexture();

  // 2. Material fotovoltaico da placa solar (vidro temperado antirreflexo)
  materials.solarCell = new THREE.MeshStandardMaterial({
    map: solarTex,
    metalness: 0.65,
    roughness: 0.18,
    bumpMap: solarTex,
    bumpScale: 0.002,
    envMapIntensity: 1.2
  });

  // 2.1 Painel Solar Flexível 100W (Modelagem Física Pura sem Textura de Imagem)
  materials.flexiblePanelSubstrate = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.38,
    metalness: 0.08,
    envMapIntensity: 1.1
  });

  materials.monocrystallineWafer = new THREE.MeshStandardMaterial({
    color: 0x070b12,
    roughness: 0.14,
    metalness: 0.75,
    envMapIntensity: 1.6
  });

  materials.silverBusbar = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.16,
    metalness: 0.95,
    envMapIntensity: 1.8
  });

  materials.etfeEncapsulant = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    reflectivity: 0.9
  });

  materials.flexiblePanelBack = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.85,
    metalness: 0.05
  });

  materials.grommetMetal = new THREE.MeshStandardMaterial({
    color: 0xecf0f5,
    metalness: 0.96,
    roughness: 0.16,
    envMapIntensity: 1.6
  });

  materials.eyeletBolt = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.94,
    roughness: 0.2
  });

  materials.eyeletBracket = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc,
    metalness: 0.90,
    roughness: 0.28
  });

  materials.junctionBox = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.12,
    roughness: 0.45
  });

  materials.cableRed = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.05,
    roughness: 0.52
  });
  materials.cableBlack = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    metalness: 0.05,
    roughness: 0.52
  });

  materials.mc4Connector = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.25,
    roughness: 0.35
  });

  materials.panelFrame = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.35,
    map: brushedMetalTex
  });

  materials.panelBacksheet = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.8,
    metalness: 0.1
  });

  const extrusionBlackTex = TextureGenerator.createExtrusionMetalTexture(true);
  const extrusionSilverTex = TextureGenerator.createExtrusionMetalTexture(false);

  materials.aluminumProfileSilver = new THREE.MeshStandardMaterial({
    color: 0xd6dee6,
    metalness: 0.92,
    roughness: 0.24,
    map: extrusionSilverTex,
    bumpMap: extrusionSilverTex,
    bumpScale: 0.0006,
    envMapIntensity: 1.5
  });

  materials.aluminumProfileBlack = new THREE.MeshStandardMaterial({
    color: 0x1a212d,
    metalness: 0.86,
    roughness: 0.32,
    map: extrusionBlackTex,
    bumpMap: extrusionBlackTex,
    bumpScale: 0.0006,
    envMapIntensity: 1.3
  });

  materials.aluminumTubeSilver = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.90,
    roughness: 0.28,
    envMapIntensity: 1.4,
    side: THREE.DoubleSide
  });

  materials.aluminumTubeBlack = new THREE.MeshStandardMaterial({
    color: 0x222a36,
    metalness: 0.85,
    roughness: 0.35,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide
  });

  materials.aluminumCutFace = new THREE.MeshStandardMaterial({
    color: 0xe8edf2,
    metalness: 0.95,
    roughness: 0.18,
    envMapIntensity: 1.6,
    side: THREE.DoubleSide
  });

  materials.steelCutFace = new THREE.MeshStandardMaterial({
    color: 0xd4dbe2,
    metalness: 0.94,
    roughness: 0.22,
    envMapIntensity: 1.6,
    side: THREE.DoubleSide
  });
  materials.metalonCutFace = materials.steelCutFace;

  materials.extrusionBracket = new THREE.MeshStandardMaterial({
    color: 0xc8d0da,
    metalness: 0.88,
    roughness: 0.32,
    bumpMap: extrusionSilverTex,
    bumpScale: 0.0004
  });

  materials.allenScrew = new THREE.MeshStandardMaterial({
    color: 0xedf2f7,
    metalness: 0.96,
    roughness: 0.15
  });

  materials.tNut = new THREE.MeshStandardMaterial({
    color: 0xa0aec0,
    metalness: 0.94,
    roughness: 0.22
  });

  const metalonTex = TextureGenerator.createMetalonSteelTexture();
  materials.weldedSteelMetalon = new THREE.MeshStandardMaterial({
    color: 0x333b47,
    metalness: 0.82,
    roughness: 0.42,
    map: metalonTex,
    bumpMap: metalonTex,
    bumpScale: 0.0015,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide
  });

  // Material plástico injetado de alta resistência (PEAD preto fosco/acetinado) para os CAPs/Ponteiras dos Metalons
  materials.metalonCap = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    roughness: 0.62,
    metalness: 0.06,
    envMapIntensity: 0.9,
    side: THREE.DoubleSide
  });
}
