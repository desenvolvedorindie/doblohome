const fs = require('fs');
const path = require('path');

// 1. Update SlatBedBuilder.ts
const slatBedPath = path.resolve('src/three/boxes/SlatBedBuilder.ts');
let slatBedCode = fs.readFileSync(slatBedPath, 'utf8');

// Replace hinged bed transverse legs:
const oldTransverseLegs = `      // Pés de apoio articulados nas quinas da folha dobrável (aparecem apenas quando aberto)
      if (isExtended) {
        const legSize = 0.035;
        const cornerGap = 0; // pés encostados na quina, sem espaçamento
        const centerOffset = cornerGap + legSize / 2;
        const localLegX = direction === 'left' ? (-hingeGap / 2 - leafW + centerOffset) : (hingeGap / 2 + leafW - centerOffset);
        const legZ1 = -l / 2 + centerOffset;
        const legZ2 = l / 2 - centerOffset;
        const localLegY = slatT + legH / 2;

        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          localLegX,
          localLegY,
          legZ1,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé de Apoio Traseiro (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          localLegX,
          localLegY,
          legZ2,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé de Apoio Dianteiro (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
      }`;

const newTransverseLegs = `      // Pés de apoio articulados nas quinas da folha dobrável
      const legSize = 0.035;
      const cornerGap = 0; // pés encostados na quina, sem espaçamento
      const centerOffset = cornerGap + legSize / 2;
      const localLegX = direction === 'left' ? (-hingeGap / 2 - leafW + centerOffset) : (hingeGap / 2 + leafW - centerOffset);
      const legZ1 = -l / 2 + centerOffset;
      const legZ2 = l / 2 - centerOffset;

      if (isExtended) {
        const localLegY = slatT + legH / 2;

        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          localLegX,
          localLegY,
          legZ1,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé de Apoio Traseiro (\${Math.round(legH * 1000)}×35×\${slatTMm}mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          localLegX,
          localLegY,
          legZ2,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé de Apoio Dianteiro (\${Math.round(legH * 1000)}×35×\${slatTMm}mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
      } else {
        // Modo fechado: pés articulados rebatidos planos ao longo da quina da folha
        // Garante que SEMPRE existam na lista de marcenaria e plano de corte
        const foldedLegGroup = new THREE.Group();
        foldedLegGroup.name = 'HingedBedFoldedLegs';
        const foldedLegY = slatT + legSize / 2;

        addPanel(
          foldedLegGroup,
          0.035,
          0.035,
          legH,
          localLegX,
          foldedLegY,
          legZ1 + legH / 2,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé de Apoio Traseiro (\${Math.round(legH * 1000)}×35×\${slatTMm}mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        addPanel(
          foldedLegGroup,
          0.035,
          0.035,
          legH,
          localLegX,
          foldedLegY,
          legZ2 - legH / 2,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé de Apoio Dianteiro (\${Math.round(legH * 1000)}×35×\${slatTMm}mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        hingePivot.add(foldedLegGroup);
      }`;

if (!slatBedCode.includes(oldTransverseLegs)) {
  console.error('Could not find oldTransverseLegs in SlatBedBuilder.ts');
  process.exit(1);
}
slatBedCode = slatBedCode.replace(oldTransverseLegs, newTransverseLegs);

// Replace hinged bed longitudinal legs:
const oldLongitudinalLegs = `      if (isExtended) {
        const legSize = 0.035;
        const cornerGap = 0; // pés encostados na quina, sem espaçamento
        const centerOffset = cornerGap + legSize / 2;
        const localLegZ = direction === 'rear' ? (hingeGap / 2 + leafL - centerOffset) : (-hingeGap / 2 - leafL + centerOffset);
        const legX1 = -w / 2 + centerOffset;
        const legX2 = w / 2 - centerOffset;
        const localLegY = slatT + legH / 2;

        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          legX1,
          localLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé Articulado Esq. (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          legX2,
          localLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé Articulado Dir. (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
      }`;

const newLongitudinalLegs = `      const legSize = 0.035;
      const cornerGap = 0; // pés encostados na quina, sem espaçamento
      const centerOffset = cornerGap + legSize / 2;
      const localLegZ = direction === 'rear' ? (hingeGap / 2 + leafL - centerOffset) : (-hingeGap / 2 - leafL + centerOffset);
      const legX1 = -w / 2 + centerOffset;
      const legX2 = w / 2 - centerOffset;

      if (isExtended) {
        const localLegY = slatT + legH / 2;

        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          legX1,
          localLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé Articulado Esq. (\${Math.round(legH * 1000)}×35×\${slatTMm}mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          legX2,
          localLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé Articulado Dir. (\${Math.round(legH * 1000)}×35×\${slatTMm}mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
      } else {
        const foldedLegGroup = new THREE.Group();
        foldedLegGroup.name = 'HingedBedFoldedLegs';
        const foldedLegY = slatT + legSize / 2;

        addPanel(
          foldedLegGroup,
          legH,
          0.035,
          0.035,
          legX1 + legH / 2,
          foldedLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé Articulado Esq. (\${Math.round(legH * 1000)}×35×\${slatTMm}mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        addPanel(
          foldedLegGroup,
          legH,
          0.035,
          0.035,
          legX2 - legH / 2,
          foldedLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé Articulado Dir. (\${Math.round(legH * 1000)}×35×\${slatTMm}mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        hingePivot.add(foldedLegGroup);
      }`;

if (!slatBedCode.includes(oldLongitudinalLegs)) {
  console.error('Could not find oldLongitudinalLegs in SlatBedBuilder.ts');
  process.exit(1);
}
slatBedCode = slatBedCode.replace(oldLongitudinalLegs, newLongitudinalLegs);

fs.writeFileSync(slatBedPath, slatBedCode, 'utf8');
console.log('1. SlatBedBuilder.ts updated successfully');
