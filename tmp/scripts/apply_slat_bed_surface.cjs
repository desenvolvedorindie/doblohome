const fs = require('fs');
const path = require('path');

// 1. Update SlatBedBuilder.ts to support hinged slatted surface
const slatBedPath = path.resolve('src/three/boxes/SlatBedBuilder.ts');
let slatCode = fs.readFileSync(slatBedPath, 'utf8');

const oldTransverseStart = `    const isLateral = direction === 'left' || direction === 'right';
    // Espaçamento funcional entre as madeiras para compensar e acomodar o corpo da dobradiça (3mm)
    const hingeGap = 0.003;`;

const newTransverseStart = `    const isLateral = direction === 'left' || direction === 'right';
    const isSlattedHinged = box.hingedBedSurface === 'slatted';
    // Espaçamento funcional entre as madeiras para compensar e acomodar o corpo da dobradiça (3mm)
    const hingeGap = 0.003;`;

slatCode = slatCode.replace(oldTransverseStart, newTransverseStart);

// Base top panel in buildHingedBedPanels
const oldBasePanel = `    // 1. Tampo Fixo Base
    addPanel(
      container,
      w,
      slatT,
      l,
      0,
      ySlat,
      0,
      slatMat,
      edgeMat,
      box.id,
      container,
      \`\${box.name} • Cama Dobradiça - Tampo Fixo Base (\${Math.round(w * 1000)}×\${Math.round(l * 1000)}×\${slatTMm}mm)\`,
      { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'top', material: \`\${slatWoodMat} \${slatTMm}mm Impermeabilizado\` }
    );`;

const newBasePanel = `    // 1. Tampo Fixo Base (Tampo Inteiriço vs Estrado Ripado)
    if (!isSlattedHinged) {
      addPanel(
        container,
        w,
        slatT,
        l,
        0,
        ySlat,
        0,
        slatMat,
        edgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Tampo Fixo Base (\${Math.round(w * 1000)}×\${Math.round(l * 1000)}×\${slatTMm}mm)\`,
        { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'top', material: \`\${slatWoodMat} \${slatTMm}mm Impermeabilizado\` }
      );
    } else {
      const targetSlatW = 0.07;
      let numSlats = Math.max(6, Math.floor((isLateral ? l : w) / targetSlatW));
      if (numSlats % 2 !== 0) numSlats += 1;
      const totalSpan = isLateral ? l : w;
      const pitch = totalSpan / numSlats;
      const gap = 0.008;
      const slatDim = Math.max(0.025, pitch - gap);

      for (let i = 0; i < numSlats; i++) {
        const posAlong = -totalSpan / 2 + (i + 0.5) * pitch;
        if (isLateral) {
          addPanel(
            container,
            w,
            slatT,
            slatDim,
            0,
            ySlat,
            posAlong,
            slatMat,
            edgeMat,
            box.id,
            container,
            \`\${box.name} • Ripa Fixa da Cama (\${Math.round(w * 1000)}×\${Math.round(slatDim * 1000)}×\${slatTMm}mm)\`,
            { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: \`\${slatWoodMat} \${slatTMm}mm\` }
          );
        } else {
          addPanel(
            container,
            slatDim,
            slatT,
            l,
            posAlong,
            ySlat,
            0,
            slatMat,
            edgeMat,
            box.id,
            container,
            \`\${box.name} • Ripa Fixa da Cama (\${Math.round(slatDim * 1000)}×\${Math.round(l * 1000)}×\${slatTMm}mm)\`,
            { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: \`\${slatWoodMat} \${slatTMm}mm\` }
          );
        }
      }
    }`;

slatCode = slatCode.replace(oldBasePanel, newBasePanel);

// Lateral leaf panel
const oldLateralLeaf = `      addPanel(
        hingePivot,
        leafW,
        slatT,
        l,
        localLeafCenterX,
        localLeafCenterY,
        0,
        slatMat,
        mobileEdgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Folha Articulada (\${Math.round(leafW * 1000)}×\${Math.round(l * 1000)}×\${slatTMm}mm)\`,
        { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'door', material: \`\${slatWoodMat} \${slatTMm}mm Impermeabilizado\` }
      );`;

const newLateralLeaf = `      if (!isSlattedHinged) {
        addPanel(
          hingePivot,
          leafW,
          slatT,
          l,
          localLeafCenterX,
          localLeafCenterY,
          0,
          slatMat,
          mobileEdgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Folha Articulada (\${Math.round(leafW * 1000)}×\${Math.round(l * 1000)}×\${slatTMm}mm)\`,
          { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'door', material: \`\${slatWoodMat} \${slatTMm}mm Impermeabilizado\` }
        );
      } else {
        const targetSlatW = 0.07;
        let numSlats = Math.max(6, Math.floor(l / targetSlatW));
        if (numSlats % 2 !== 0) numSlats += 1;
        const pitch = l / numSlats;
        const gap = 0.008;
        const slatDimZ = Math.max(0.025, pitch - gap);

        for (let i = 0; i < numSlats; i++) {
          const zPos = -l / 2 + (i + 0.5) * pitch;
          addPanel(
            hingePivot,
            leafW,
            slatT,
            slatDimZ,
            localLeafCenterX,
            localLeafCenterY,
            zPos,
            slatMat,
            mobileEdgeMat,
            box.id,
            container,
            \`\${box.name} • Ripa Móvel da Folha (\${Math.round(leafW * 1000)}×\${Math.round(slatDimZ * 1000)}×\${slatTMm}mm)\`,
            { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: \`\${slatWoodMat} \${slatTMm}mm\` }
          );
        }
      }`;

slatCode = slatCode.replace(oldLateralLeaf, newLateralLeaf);

// Longitudinal leaf panel
const oldLongLeaf = `      addPanel(
        hingePivot,
        w,
        slatT,
        leafL,
        0,
        localLeafCenterY,
        localLeafCenterZ,
        slatMat,
        mobileEdgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Folha Articulada (\${Math.round(w * 1000)}×\${Math.round(leafL * 1000)}×\${slatTMm}mm)\`,
        { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'door', material: \`\${slatWoodMat} \${slatTMm}mm Impermeabilizado\` }
      );`;

const newLongLeaf = `      if (!isSlattedHinged) {
        addPanel(
          hingePivot,
          w,
          slatT,
          leafL,
          0,
          localLeafCenterY,
          localLeafCenterZ,
          slatMat,
          mobileEdgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Folha Articulada (\${Math.round(w * 1000)}×\${Math.round(leafL * 1000)}×\${slatTMm}mm)\`,
          { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'door', material: \`\${slatWoodMat} \${slatTMm}mm Impermeabilizado\` }
        );
      } else {
        const targetSlatW = 0.07;
        let numSlats = Math.max(6, Math.floor(w / targetSlatW));
        if (numSlats % 2 !== 0) numSlats += 1;
        const pitch = w / numSlats;
        const gap = 0.008;
        const slatDimX = Math.max(0.025, pitch - gap);

        for (let i = 0; i < numSlats; i++) {
          const xPos = -w / 2 + (i + 0.5) * pitch;
          addPanel(
            hingePivot,
            slatDimX,
            slatT,
            leafL,
            xPos,
            localLeafCenterY,
            localLeafCenterZ,
            slatMat,
            mobileEdgeMat,
            box.id,
            container,
            \`\${box.name} • Ripa Móvel da Folha (\${Math.round(slatDimX * 1000)}×\${Math.round(leafL * 1000)}×\${slatTMm}mm)\`,
            { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: \`\${slatWoodMat} \${slatTMm}mm\` }
          );
        }
      }`;

slatCode = slatCode.replace(oldLongLeaf, newLongLeaf);
fs.writeFileSync(slatBedPath, slatCode, 'utf8');
console.log('SlatBedBuilder.ts slatted hinged bed updated successfully');

// 2. Update PlannerSlatBedSection.tsx
const plannerBedPath = path.resolve('src/components/planner/PlannerSlatBedSection.tsx');
let plannerCode = fs.readFileSync(plannerBedPath, 'utf8');

const targetButtons = `            <button
              type="button"
              onClick={() => updateInternalBox(selectedBox.id, { bedMode: 'hinged' })}
              style={{
                padding: '7px 8px',
                borderRadius: '6px',
                border: isHinged ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                background: isHinged ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                color: isHinged ? '#38bdf8' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🚪 Articulada c/ Dobradiça
            </button>
          </div>
        </div>`;

const replacementButtons = `            <button
              type="button"
              onClick={() => updateInternalBox(selectedBox.id, { bedMode: 'hinged' })}
              style={{
                padding: '7px 8px',
                borderRadius: '6px',
                border: isHinged ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                background: isHinged ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                color: isHinged ? '#38bdf8' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🚪 Articulada c/ Dobradiça
            </button>
          </div>
        </div>

        {/* Superfície da Cama Articulada com Dobradiça */}
        {isHinged && (
          <div>
            <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
              🪵 Superfície da Cama Articulada:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => updateInternalBox(selectedBox.id, { hingedBedSurface: 'panel' })}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: (selectedBox.hingedBedSurface || 'panel') === 'panel' ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                  background: (selectedBox.hingedBedSurface || 'panel') === 'panel' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                  color: (selectedBox.hingedBedSurface || 'panel') === 'panel' ? '#38bdf8' : '#94a3b8',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🪵 Tampo Inteiriço
              </button>
              <button
                type="button"
                onClick={() => updateInternalBox(selectedBox.id, { hingedBedSurface: 'slatted' })}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: selectedBox.hingedBedSurface === 'slatted' ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                  background: selectedBox.hingedBedSurface === 'slatted' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                  color: selectedBox.hingedBedSurface === 'slatted' ? '#38bdf8' : '#94a3b8',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🛏️ Estrado c/ Ripas
              </button>
            </div>
          </div>
        )}`;

if (!plannerCode.includes(targetButtons)) {
  console.error('Could not find targetButtons in PlannerSlatBedSection.tsx');
  process.exit(1);
}
plannerCode = plannerCode.replace(targetButtons, replacementButtons);
fs.writeFileSync(plannerBedPath, plannerCode, 'utf8');
console.log('PlannerSlatBedSection.tsx updated successfully');
