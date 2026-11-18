const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/components/planner/PlannerBoxInspector.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const targetSnippet = `        {/* Alternância entre Gavetão e Bandeja Corrediça */}
        {(selectedBox.type === 'drawer' || selectedBox.type === 'slide_tray') && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Modo do Módulo Deslizante:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                className={\`btn-compact \${selectedBox.type === 'drawer' && selectedBox.drawerMode !== 'slide_tray' ? 'active' : ''}\`}
                onClick={() => updateInternalBox(selectedBox.id, { type: 'drawer', drawerMode: 'drawer' })}
                style={{
                  fontSize: '11px',
                  padding: '8px 6px',
                  fontWeight: 700,
                  background: selectedBox.type === 'drawer' && selectedBox.drawerMode !== 'slide_tray'
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.4))'
                    : undefined
                }}
              >
                📦 Gavetão Alto Fechado
              </button>
              <button
                type="button"
                className={\`btn-compact \${selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray' ? 'active' : ''}\`}
                onClick={() => updateInternalBox(selectedBox.id, { type: 'slide_tray', drawerMode: 'slide_tray' })}
                style={{
                  fontSize: '11px',
                  padding: '8px 6px',
                  fontWeight: 700,
                  background: selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.4))'
                    : undefined,
                  borderColor: selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray' ? '#f59e0b' : undefined,
                  color: selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray' ? '#fbbf24' : undefined
                }}
              >
                🛝 Bandeja Corrediça Rasa
              </button>
            </div>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
              {selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray'
                ? '• Abas baixas de contenção (45mm) com corrediças reforçadas para geladeira 12V ou fogão.'
                : '• Gavetão fechado tradicional com laterais altas e frente total em compensado 15mm.'}
            </div>
          </div>
        )}`;

const replacementSnippet = `        {/* Descrição informativa do módulo deslizante (Gavetão vs Bandeja) */}
        {(selectedBox.type === 'drawer' || selectedBox.type === 'slide_tray') && (
          <div style={{ gridColumn: '1 / -1', fontSize: '10px', color: '#94a3b8', marginTop: '-4px', background: 'rgba(15, 23, 42, 0.4)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
            {selectedBox.type === 'slide_tray'
              ? '🛝 Bandeja rasa com abas baixas de contenção (45mm) e corrediças telescópicas para geladeira 12V ou fogão.'
              : '📦 Gavetão fechado tradicional com laterais altas e frente total em compensado naval 15mm.'}
          </div>
        )}`;

if (!content.includes(targetSnippet)) {
  console.error('Target snippet not found in PlannerBoxInspector.tsx');
  process.exit(1);
}

content = content.replace(targetSnippet, replacementSnippet);
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully replaced redundant buttons in PlannerBoxInspector.tsx!');
