const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/planner/PlannerFloorGrid.tsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Add totalAreaM2 definition near occupationPct
const targetOccupation = `  const occupationPct = totalFloorVolumeL > 0 ? Math.min(100, Math.round((occupiedVolumeL / totalFloorVolumeL) * 100)) : 0;`;
const replacementOccupation = `  const occupationPct = totalFloorVolumeL > 0 ? Math.min(100, Math.round((occupiedVolumeL / totalFloorVolumeL) * 100)) : 0;
  const totalAreaM2 = ((internalGrid.widthMm * internalGrid.lengthMm) / 1_000_000).toFixed(2);`;

if (!content.includes(targetOccupation)) {
  throw new Error('targetOccupation not found!');
}
content = content.replace(targetOccupation, replacementOccupation);

// 2. Add the total space banner above the grid (right before "▲ FRENTE (BANCOS DIANTEIROS) ▲")
const targetFrente = `        {/* Indicador Frente / Bancos */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 800,
            color: '#64748b',
            letterSpacing: '2px',
            padding: '4px',
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: '6px',
            marginBottom: '8px'
          }}
        >
          ▲ FRENTE (BANCOS DIANTEIROS) ▲
        </div>`;

const replacementFrente = `        {/* Tamanho Total do Espaço da Doblò Acima do Grid */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '8px 12px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.85))',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '8px',
            marginBottom: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🚐</span>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
                ESPAÇO TOTAL DA DOBLÒ: <span style={{ color: '#38bdf8' }}>{internalGrid.widthMm} mm × {internalGrid.lengthMm} mm</span>
                <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '10.5px', marginLeft: '6px' }}>
                  ({internalGrid.widthMm / 10} × {internalGrid.lengthMm / 10} cm • {(internalGrid.widthMm / 1000).toFixed(2)} × {(internalGrid.lengthMm / 1000).toFixed(2)} m)
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                Área do assoalho: <strong style={{ color: '#cbd5e1' }}>{totalAreaM2} m²</strong> • Altura padrão: <strong style={{ color: '#cbd5e1' }}>{internalGrid.heightMm} mm ({internalGrid.heightMm / 10} cm)</strong> • Volume total: <strong style={{ color: '#cbd5e1' }}>{totalFloorVolumeL} L</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: occupationPct > 90 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                color: occupationPct > 90 ? '#fca5a5' : '#38bdf8',
                border: occupationPct > 90 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              {occupationPct}% Ocupado ({occupiedVolumeL} L de {totalFloorVolumeL} L)
            </span>
          </div>
        </div>

        {/* Indicador Frente / Bancos */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 800,
            color: '#64748b',
            letterSpacing: '2px',
            padding: '4px',
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: '6px',
            marginBottom: '8px'
          }}
        >
          ▲ FRENTE (BANCOS DIANTEIROS) ▲
        </div>`;

if (!content.includes(targetFrente)) {
  throw new Error('targetFrente not found!');
}
content = content.replace(targetFrente, replacementFrente);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added total space banner above the grid in PlannerFloorGrid.tsx');
