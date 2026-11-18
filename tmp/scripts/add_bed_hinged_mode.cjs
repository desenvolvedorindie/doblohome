const fs = require('fs');
const path = require('path');

function normalize(str) {
  return str.replace(/\r\n/g, '\n');
}

// 1. PlannerBoxInspector.tsx
const inspPath = path.resolve(__dirname, '../../src/components/planner/PlannerBoxInspector.tsx');
let inspContent = normalize(fs.readFileSync(inspPath, 'utf8'));

// Update select option
inspContent = inspContent.replace(
  '<option value="slat_bed">🛏️ Cama Retrátil com Ripas (Sofá-Cama)</option>',
  '<option value="slat_bed">🛏️ Cama (Sofá-Cama)</option>'
);

// Add bed mode toggle right after drawer mode toggle
const drawerBlockEnd = `            <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
              {selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray'
                ? '• Abas baixas de contenção (45mm) com corrediças reforçadas para geladeira 12V ou fogão.'
                : '• Gavetão fechado tradicional com laterais altas e frente total em compensado 15mm.'}
            </div>
          </div>
        )}`;

const bedModeBlock = `            <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
              {selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray'
                ? '• Abas baixas de contenção (45mm) com corrediças reforçadas para geladeira 12V ou fogão.'
                : '• Gavetão fechado tradicional com laterais altas e frente total em compensado 15mm.'}
            </div>
          </div>
        )}

        {/* Alternância entre Cama com Ripas e Cama com Dobradiça */}
        {selectedBox.type === 'slat_bed' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Modo Construtivo da Cama:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                className={\`btn-compact \${(selectedBox.bedMode || 'slat') === 'slat' ? 'active' : ''}\`}
                onClick={() => updateInternalBox(selectedBox.id, { bedMode: 'slat' })}
                style={{
                  fontSize: '11px',
                  padding: '8px 6px',
                  fontWeight: 700,
                  background: (selectedBox.bedMode || 'slat') === 'slat'
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.4))'
                    : undefined
                }}
              >
                🛏️ Retrátil c/ Ripas
              </button>
              <button
                type="button"
                className={\`btn-compact \${selectedBox.bedMode === 'hinged' ? 'active' : ''}\`}
                onClick={() => updateInternalBox(selectedBox.id, { bedMode: 'hinged' })}
                style={{
                  fontSize: '11px',
                  padding: '8px 6px',
                  fontWeight: 700,
                  background: selectedBox.bedMode === 'hinged'
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.4))'
                    : undefined
                }}
              >
                🚪 Articulada c/ Dobradiça
              </button>
            </div>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
              {selectedBox.bedMode === 'hinged'
                ? '• Folha dobrável em compensado com dobradiças contínuas que rebate 180° e pés articulados de apoio.'
                : '• Estrado de ripamento retrátil intercalado em formato de pente com quadro móvel em L invertido.'}
            </div>
          </div>
        )}`;

if (inspContent.includes(drawerBlockEnd)) {
  inspContent = inspContent.replace(drawerBlockEnd, bedModeBlock);
  console.log('Added bedMode toggle to PlannerBoxInspector');
} else {
  console.log('WARNING: drawerBlockEnd not found in PlannerBoxInspector');
}

fs.writeFileSync(inspPath, inspContent, 'utf8');

// 2. PlannerSlatBedSection.tsx
const secPath = path.resolve(__dirname, '../../src/components/planner/PlannerSlatBedSection.tsx');
let secContent = normalize(fs.readFileSync(secPath, 'utf8'));

const oldSecHeader = `  return (
    <>
      {/* Configuração Exclusiva para Cama Retrátil com Ripas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        <div>
          <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
            🧭 Direção de Abertura / Deslizamento das Ripas:
          </label>`;

const newSecHeader = `  const isHinged = selectedBox.bedMode === 'hinged';

  return (
    <>
      {/* Configuração da Cama (Ripas ou Dobradiça) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        {/* Alternância entre os 2 Modos de Cama */}
        <div>
          <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
            🛠️ Mecanismo Construtivo da Cama:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={() => updateInternalBox(selectedBox.id, { bedMode: 'slat' })}
              style={{
                padding: '7px 8px',
                borderRadius: '6px',
                border: !isHinged ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                background: !isHinged ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                color: !isHinged ? '#38bdf8' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🛏️ Retrátil c/ Ripas
            </button>
            <button
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

        <div>
          <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
            {isHinged ? '🧭 Direção de Articulação da Dobradiça:' : '🧭 Direção de Abertura / Deslizamento das Ripas:'}
          </label>`;

if (secContent.includes(oldSecHeader)) {
  secContent = secContent.replace(oldSecHeader, newSecHeader);
  console.log('Replaced header in PlannerSlatBedSection');
} else {
  console.log('WARNING: oldSecHeader not found in PlannerSlatBedSection');
}

// Replace box title and toggle button text
const oldSecBanner = `            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
              🛏️ Estrado Retrátil em L Invertido (Pente):
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Base fixa: {baseDimMm} mm ➔ Aberta (2×): <strong>{extDimMm} mm</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextOpen = !isBedCurrentlyOpen;
              updateInternalBox(selectedBox.id, { isOpen: nextOpen, slatExtensionPercent: 100 });
              setIsOpenPreview(nextOpen);
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: isBedCurrentlyOpen ? '#10b981' : 'rgba(56, 189, 248, 0.25)',
              color: isBedCurrentlyOpen ? '#0f172a' : '#38bdf8'
            }}
          >
            {isBedCurrentlyOpen ? '🛋️ Fechar (Modo Sofá)' : '⚡ Abrir Toda Cama'}
          </button>`;

const newSecBanner = `            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
              {isHinged ? '🚪 Tampo Articulado com Dobradiça:' : '🛏️ Estrado Retrátil em L Invertido (Pente):'}
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Base fixa: {baseDimMm} mm ➔ {isHinged ? 'Desdobrada' : 'Aberta'} (2×): <strong>{extDimMm} mm</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextOpen = !isBedCurrentlyOpen;
              updateInternalBox(selectedBox.id, { isOpen: nextOpen, slatExtensionPercent: 100 });
              setIsOpenPreview(nextOpen);
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: isBedCurrentlyOpen ? '#10b981' : 'rgba(56, 189, 248, 0.25)',
              color: isBedCurrentlyOpen ? '#0f172a' : '#38bdf8'
            }}
          >
            {isBedCurrentlyOpen
              ? (isHinged ? '🛋️ Dobrar (Modo Sofá)' : '🛋️ Fechar (Modo Sofá)')
              : (isHinged ? '⚡ Desdobrar Cama Inteira' : '⚡ Abrir Toda Cama')}
          </button>`;

if (secContent.includes(oldSecBanner)) {
  secContent = secContent.replace(oldSecBanner, newSecBanner);
  console.log('Replaced banner in PlannerSlatBedSection');
} else {
  console.log('WARNING: oldSecBanner not found in PlannerSlatBedSection');
}

fs.writeFileSync(secPath, secContent, 'utf8');

// 3. PlannerFloorGrid.tsx
const gridPath = path.resolve(__dirname, '../../src/components/planner/PlannerFloorGrid.tsx');
let gridContent = normalize(fs.readFileSync(gridPath, 'utf8'));
gridContent = gridContent.replace(
  `: box.type === 'slat_bed'\n                        ? \`Cama Ripas (\${box.slatBedDirection === 'left' ? '◀' : box.slatBedDirection === 'right' ? '▶' : box.slatBedDirection === 'rear' ? '▼' : '▲'})\``,
  `: box.type === 'slat_bed'\n                        ? \`\${box.bedMode === 'hinged' ? 'Cama Dobradiça' : 'Cama Ripas'} (\${box.slatBedDirection === 'left' ? '◀' : box.slatBedDirection === 'right' ? '▶' : box.slatBedDirection === 'rear' ? '▼' : '▲'})\``
);
fs.writeFileSync(gridPath, gridContent, 'utf8');
console.log('Updated PlannerFloorGrid');

// 4. PlannerBoxPropertiesPanel.tsx
const propPath = path.resolve(__dirname, '../../src/components/planner/PlannerBoxPropertiesPanel.tsx');
let propContent = normalize(fs.readFileSync(propPath, 'utf8'));
propContent = propContent.replace(
  `b.type === 'slat_bed' ? 'Cama c/ Ripas' : 'Nicho Aberto';`,
  `b.type === 'slat_bed' ? (b.bedMode === 'hinged' ? 'Cama c/ Dobradiça' : 'Cama c/ Ripas') : 'Nicho Aberto';`
);
fs.writeFileSync(propPath, propContent, 'utf8');
console.log('Updated PlannerBoxPropertiesPanel');
