const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/three/boxes/UpperCabinetTransverseBuilder.ts');
let content = fs.readFileSync(filePath, 'utf8');

const targetRegex = /\/\/ 7\. Fechamento Frontal: Corrediça Telescópica[\s\S]*?upperGroup\.add\(drawerGroup\);\s*\}/;

const replacement = `// 7. Fechamento Frontal: Portas de Correr vs Porta Basculante vs Nicho Aberto
        const frontZ = side === 'rear' ? (cabinetDepthM / 2) : (-cabinetDepthM / 2);
        if (isSlidingDoors) {
          // ─── PORTAS DE CORRER BIPARTIDAS (2 FOLHAS CENTRAIS C/ TRILHOS) ───
          const slidingGroup = new THREE.Group();
          slidingGroup.name = \`UpperCabinetSlidingDoors_\${box.id}_\${side}\`;

          // Transpasse central padrão (30mm)
          const overlap = 0.030;
          const leafW = (innerW + overlap) / 2;
          const leafH = Math.max(0.08, innerH - 0.008);
          const doorT = Math.min(t, 0.015);
          const corridorDir = side === 'rear' ? 1 : -1;
          const centerY = interiorBottomY + innerH / 2;

          // Posições no eixo transversal X quando fechado:
          // Folha 1 (Esquerda, -X): cobre de -innerW / 2 até +overlap / 2
          const leaf1ClosedX = -innerW / 4 + overlap / 4;
          // Folha 2 (Direita, +X): cobre de -overlap / 2 até +innerW / 2
          const leaf2ClosedX = innerW / 4 - overlap / 4;

          // Posições no eixo Z dos trilhos paralelos (trilho interno e trilho externo):
          const leaf1Z = frontZ - corridorDir * (doorT / 2 + 0.002);
          const leaf2Z = frontZ + corridorDir * (doorT / 2 + 0.002);

          // Deslocamento de abertura no trilho:
          // A Folha 2 corre sobre a Folha 1 ao longo da largura (eixo X), liberando a metade direita do armário
          const slideDistanceX = leaf2ClosedX - leaf1ClosedX;
          const leaf2X = isOpen ? (leaf2ClosedX - slideDistanceX) : leaf2ClosedX;

          // ── FOLHA 1 (Esquerda - Trilho Interno) ──
          const leaf1Group = new THREE.Group();
          leaf1Group.name = \`UpperCabinetSlidingDoor1_\${box.id}_\${side}\`;
          addPanel(
            leaf1Group,
            leafW,
            leafH,
            doorT,
            leaf1ClosedX,
            centerY,
            leaf1Z,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            \`\${box.name} • Armário Aéreo (\${side}) Porta de Correr (#1) (\${Math.round(leafW * 1000)}×\${Math.round(leafH * 1000)}mm)\`,
            cabinetUserData
          );

          // Puxador concha embutido náutico Folha 1
          const pullGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.006, 24);
          pullGeo.rotateX(Math.PI / 2);
          const pullMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });
          const pull1Mesh = new THREE.Mesh(pullGeo, pullMat);
          pull1Mesh.position.set(
            leaf1ClosedX - leafW / 2 + 0.05,
            centerY,
            leaf1Z + corridorDir * (doorT / 2 + 0.001)
          );
          pull1Mesh.userData = {
            isHardware: true,
            partLabel: 'Puxador Concha Embutido Náutico (Folha 1)',
            category: '🔩 Ferragens Marítimas & Camper'
          };
          leaf1Group.add(pull1Mesh);
          slidingGroup.add(leaf1Group);

          // ── FOLHA 2 (Direita - Móvel, corre no Trilho Externo) ──
          const leaf2Group = new THREE.Group();
          leaf2Group.name = \`UpperCabinetSlidingDoor2_\${box.id}_\${side}\`;
          addPanel(
            leaf2Group,
            leafW,
            leafH,
            doorT,
            leaf2X,
            centerY,
            leaf2Z,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            \`\${box.name} • Armário Aéreo (\${side}) Porta de Correr (#2) (\${Math.round(leafW * 1000)}×\${Math.round(leafH * 1000)}mm)\`,
            cabinetUserData
          );

          // Puxador concha embutido náutico Folha 2
          const pull2Mesh = new THREE.Mesh(pullGeo, pullMat);
          pull2Mesh.position.set(
            leaf2X + leafW / 2 - 0.05,
            centerY,
            leaf2Z + corridorDir * (doorT / 2 + 0.001)
          );
          pull2Mesh.userData = {
            isHardware: true,
            partLabel: 'Puxador Concha Embutido Náutico (Folha 2)',
            category: '🔩 Ferragens Marítimas & Camper'
          };
          leaf2Group.add(pull2Mesh);

          // Trava Náutica Trava-Porta de Correr
          const lockGeo = new THREE.BoxGeometry(0.020, 0.024, 0.012);
          const lockMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
          const lockMesh = new THREE.Mesh(lockGeo, lockMat);
          lockMesh.position.set(
            leaf2X - leafW / 2 + 0.02,
            centerY - leafH / 2 + 0.03,
            leaf2Z + corridorDir * (doorT / 2 + 0.005)
          );
          lockMesh.userData = {
            isHardware: true,
            partLabel: 'Trava Náutica para Porta de Correr (Anti-Abertura)',
            category: '🔩 Ferragens Marítimas & Camper'
          };
          leaf2Group.add(lockMesh);
          slidingGroup.add(leaf2Group);

          // Trilho Duplo Superior e Inferior em Alumínio Anodizado
          const trackMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 });
          const trackThickness = 0.008;
          const trackDepth = doorT * 2 + 0.008;
          [-1, 1].forEach((dirY) => {
            const trackY = dirY === 1 ? (cabinetH / 2 - t - trackThickness / 2) : (interiorBottomY + trackThickness / 2);
            const trackGeo = new THREE.BoxGeometry(innerW, trackThickness, trackDepth);
            const trackMesh = new THREE.Mesh(trackGeo, trackMat);
            trackMesh.position.set(0, trackY, frontZ);
            trackMesh.userData = {
              isHardware: true,
              partLabel: \`Trilho Duplo Alumínio para Portas de Correr (\${dirY === 1 ? 'Superior' : 'Inferior'})\`,
              category: '🔩 Ferragens Marítimas & Camper'
            };
            slidingGroup.add(trackMesh);
          });

          upperGroup.add(slidingGroup);
        }`;

if (!targetRegex.test(content)) {
  console.error('Target regex not matched in file!');
  process.exit(1);
}

content = content.replace(targetRegex, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated UpperCabinetTransverseBuilder.ts');
