import * as THREE from 'three';

console.log('Testing LED Profile with Aluminum Housing + White Plastic Diffuser + White End Caps...');

const S = 0.016; // 16mm
const length = 0.60; // 600mm
const ledColorHex = 0xfef3c7;
const brightness = 0.85;

// 1. Aluminum profile shape (90-degree corner with lips)
const profileShape = new THREE.Shape();
profileShape.moveTo(0, 0);
profileShape.lineTo(0, S);
profileShape.lineTo(0.0028, S);
profileShape.lineTo(0.0028, S - 0.0014);
profileShape.lineTo(0.0014, S - 0.0025);
profileShape.lineTo(0.0014, 0.0014);
profileShape.lineTo(S - 0.0025, 0.0014);
profileShape.lineTo(S - 0.0014, 0.0028);
profileShape.lineTo(S, 0.0028);
profileShape.lineTo(S, 0);
profileShape.closePath();

const profileGeo = new THREE.ExtrudeGeometry(profileShape, {
  depth: length,
  bevelEnabled: false
});

const aluminumMat = new THREE.MeshStandardMaterial({
  color: 0x94a3b8, // cinza anodizado
  metalness: 0.85,
  roughness: 0.30
});
const profileMesh = new THREE.Mesh(profileGeo, aluminumMat);
profileMesh.name = 'LedCorner_AluminumProfile';

// 2. White Plastic Diffuser shape (domed 45-deg lens)
const diffuserShape = new THREE.Shape();
const midX = S / 2 + 0.0006;
const midY = S / 2 + 0.0006;
const inMidX = S / 2 - 0.0004;
const inMidY = S / 2 - 0.0004;

diffuserShape.moveTo(0.0025, S - 0.0010);
diffuserShape.quadraticCurveTo(midX, midY, S - 0.0010, 0.0025);
diffuserShape.lineTo(S - 0.0022, 0.0035);
diffuserShape.quadraticCurveTo(inMidX, inMidY, 0.0035, S - 0.0022);
diffuserShape.closePath();

const diffuserGeo = new THREE.ExtrudeGeometry(diffuserShape, {
  depth: Math.max(0.02, length - 0.004),
  bevelEnabled: false
});

const whitePlasticMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc, // Plástico branco puro leitoso
  roughness: 0.45,
  metalness: 0.0,
  emissive: ledColorHex,
  emissiveIntensity: brightness * 0.45
});
const diffuserMesh = new THREE.Mesh(diffuserGeo, whitePlasticMat);
diffuserMesh.name = 'LedCorner_WhitePlasticDiffuser';
diffuserMesh.position.z = 0.002;

// 3. White Plastic End Caps (ponteiras plásticas brancas triangulares nas extremidades)
const capShape = new THREE.Shape();
capShape.moveTo(0, 0);
capShape.lineTo(0, S);
capShape.lineTo(S, 0);
capShape.closePath();

const capGeo = new THREE.ExtrudeGeometry(capShape, {
  depth: 0.0015,
  bevelEnabled: false
});
const capMat = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9, // Plástico branco fosco das ponteiras
  roughness: 0.5,
  metalness: 0.0
});

const cap1 = new THREE.Mesh(capGeo, capMat);
cap1.name = 'LedCorner_WhitePlasticCap_Start';
cap1.position.set(0, 0, -0.001);

const cap2 = new THREE.Mesh(capGeo, capMat);
cap2.name = 'LedCorner_WhitePlasticCap_End';
cap2.position.set(0, 0, length - 0.0005);

// 4. Internal LED COB Strip (fita de LED amarela no fundo da calha)
const stripGeo = new THREE.BoxGeometry(0.006, 0.0006, Math.max(0.02, length - 0.006));
const stripMat = new THREE.MeshStandardMaterial({
  color: 0xfbbf24,
  emissive: ledColorHex,
  emissiveIntensity: brightness * 1.5,
  roughness: 0.3
});
const stripMesh = new THREE.Mesh(stripGeo, stripMat);
stripMesh.name = 'LedCorner_CobLedStrip';
stripMesh.position.set(0.005, 0.005, length / 2);
stripMesh.rotation.z = -Math.PI / 4;

const group = new THREE.Group();
group.add(profileMesh);
group.add(diffuserMesh);
group.add(cap1);
group.add(cap2);
group.add(stripMesh);

const bb = new THREE.Box3().setFromObject(group);
console.log('Bounding Box:', {
  min: [bb.min.x.toFixed(4), bb.min.y.toFixed(4), bb.min.z.toFixed(4)],
  max: [bb.max.x.toFixed(4), bb.max.y.toFixed(4), bb.max.z.toFixed(4)]
});

console.log('Meshes created successfully:');
group.traverse((c: any) => {
  if (c.isMesh) {
    console.log(` - ${c.name}: color=0x${c.material.color.getHexString()}, emissive=0x${c.material.emissive?.getHexString() || 'none'}`);
  }
});

console.log('✅ TEST PASSED SUCCESSFULLY!');
