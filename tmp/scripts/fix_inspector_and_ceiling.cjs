const fs = require('fs');
const path = require('path');

const outDir = 'src/components/planner';

// 1. Fix PlannerBoxInspector.tsx
const inspPath = path.join(outDir, 'PlannerBoxInspector.tsx');
let insp = fs.readFileSync(inspPath, 'utf8');

// Insert Material/Acabamento before PlannerSlatBedSection and close grid, IIFE, fragment
const matMarkup = `            {/* Material / Acabamento */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Material / Textura 3D:
              </label>
              <select
                value={selectedBox.material}
                onChange={(e) => updateInternalBox(selectedBox.id, { material: e.target.value as InternalBoxMaterial })}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                <option value="plywood">🪵 Compensado Naval Claro (Padrão Camper)</option>
                <option value="dark_wood">🪵 Madeira Nobre / Escura</option>
                <option value="white_mdf">⚪ MDF Branco Acetinado</option>
                <option value="aluminum_box">⚙️ Gabinete Alumínio Estrutural</option>
              </select>
            </div>
          </div>`;

insp = insp.replace('      <PlannerSlatBedSection selectedBox={selectedBox} />',
`${matMarkup}

          <PlannerSlatBedSection selectedBox={selectedBox} cols={cols} rows={rows} />`);

insp = insp.replace('      <PlannerUpperCabinetSection selectedBox={selectedBox} />\n    </div>\n  );\n};',
`      <PlannerUpperCabinetSection selectedBox={selectedBox} />
            </div>
          </div>
        );
      })()}
    </>
  );
};`);

fs.writeFileSync(inspPath, insp);

// 2. Fix PlannerCeilingSection.tsx
const csPath = path.join(outDir, 'PlannerCeilingSection.tsx');
let cs = fs.readFileSync(csPath, 'utf8');

// Remove duplicate div at line 31-40
cs = cs.replace(`  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        borderRadius: '12px',
        border: isCeilingEnabled ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(148, 163, 184, 0.25)',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
        transition: 'all 0.2s ease'
      }}
    >`, `  return (`);

// Fix closing tags
cs = cs.replace(`          <PlannerCeilingLighting ceilingCfg={ceilingCfg} />
        </>
      )}
    </div>
  );
};`, `          <PlannerCeilingLighting ceilingCfg={ceilingCfg} />
        </>
      )}
            </div>
    </div>
  );
};`);

fs.writeFileSync(csPath, cs);

console.log('Fixed PlannerBoxInspector and PlannerCeilingSection!');
