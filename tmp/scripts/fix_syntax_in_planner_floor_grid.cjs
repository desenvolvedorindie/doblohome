const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/components/planner/PlannerFloorGrid.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const badSnippet = `              {!isDefaultDoblo && (
                <button
                  type="button"
                  onClick={() => handleUpdateGridDimensions(1200, 1700)}
                  style={{
                    padding: '3px 9px')',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Restaurar dimensões padrão da Doblò: 1200 × 1700 mm e altura 400 mm"
                >
                  ↺ Restaurar Padrão Doblò (1200 × 1700)
                </button>
              )}`;

const goodSnippet = `              {!isDefaultDoblo && (
                <button
                  type="button"
                  onClick={() => handleUpdateGridDimensions(1200, 1700)}
                  style={{
                    padding: '3px 9px',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Restaurar dimensões padrão da Doblò: 1200 × 1700 mm"
                >
                  ↺ Restaurar Padrão Doblò (1200 × 1700)
                </button>
              )}`;

content = content.replace(badSnippet, goodSnippet);
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Fixed syntax in PlannerFloorGrid.tsx');
