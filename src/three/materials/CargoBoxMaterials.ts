import * as THREE from 'three';

export function initCargoBoxMaterials(materials: Record<string, any>) {
  materials.cargoBoxShell = new THREE.MeshStandardMaterial({
    color: 0x727f8d, // Cinza ardósia / cimento militar texturizado fiel à foto do Motobul Off Road
    roughness: 0.52,
    metalness: 0.12,
    envMapIntensity: 0.95
  });

  materials.cargoBoxBase = new THREE.MeshStandardMaterial({
    color: 0x161a22, // Cuba inferior preta acetinada
    roughness: 0.70,
    metalness: 0.06
  });

  materials.cargoBoxRib = new THREE.MeshStandardMaterial({
    color: 0x626e7b, // Nervuras de reforço estrutural com sutil contraste
    roughness: 0.48,
    metalness: 0.14
  });

  materials.cargoBoxLatch = new THREE.MeshStandardMaterial({
    color: 0x181c24, // Fechos e travas de polímero preto de alta resistência
    metalness: 0.40,
    roughness: 0.45
  });

  materials.cargoBoxLock = new THREE.MeshStandardMaterial({
    color: 0xd4d8df, // Chapa e miolo da fechadura central em zinco/inox com chave
    metalness: 0.88,
    roughness: 0.22,
    envMapIntensity: 1.4
  });

  materials.cargoBoxEmblem = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.85,
    roughness: 0.2
  });

  materials.gasStrutCylinder = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Cilindro do pistão a gás em preto fosco eletrostático
    metalness: 0.82,
    roughness: 0.32
  });

  materials.gasStrutRod = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Haste cromada espelhada
    metalness: 0.98,
    roughness: 0.06,
    envMapIntensity: 1.8
  });

  materials.gasStrutMount = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Terminal esférico / olhal
    metalness: 0.88,
    roughness: 0.25
  });

  materials.stainlessHinge = new THREE.MeshStandardMaterial({
    color: 0xd1d5db, // Dobradiça industrial aço inox 304 escovado
    metalness: 0.94,
    roughness: 0.22,
    envMapIntensity: 1.5
  });

  materials.toggleClamp = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc, // Corpo de aço zincado do fecho rápido
    metalness: 0.90,
    roughness: 0.22
  });

  materials.toggleClampGrip = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Manopla vermelha de vinil do engate rápido
    metalness: 0.05,
    roughness: 0.35
  });

  materials.rubberRestPad = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Coxim de borracha para assentamento do rack
    roughness: 0.92,
    metalness: 0.02
  });
}
