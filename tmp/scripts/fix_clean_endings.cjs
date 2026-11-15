const fs = require('fs');
const path = require('path');

const outDir = 'src/components/planner';

// 1. PlannerUpperCabinetSection.tsx
const ucPath = path.join(outDir, 'PlannerUpperCabinetSection.tsx');
let uc = fs.readFileSync(ucPath, 'utf8');
const ucTarget = `              </div>
            )}
          </div>

        </div>
        );
      })()}

    </>
  );
};`;
const ucRepl = `              </div>
            )}
          </div>
    </>
  );
};`;
if (uc.includes(ucTarget)) {
  uc = uc.replace(ucTarget, ucRepl);
} else {
  // slice before line 230
  const idx = uc.indexOf('              </div>\n            )}\n          </div>');
  if (idx !== -1) {
    uc = uc.slice(0, idx + '              </div>\n            )}\n          </div>'.length) + '\n    </>\n  );\n};\n';
  }
}
fs.writeFileSync(ucPath, uc);

// 2. PlannerCeilingLighting.tsx
const clPath = path.join(outDir, 'PlannerCeilingLighting.tsx');
let cl = fs.readFileSync(clPath, 'utf8');
const clGoodIdx = cl.indexOf('                        />\n                      </div>\n                    </div>\n                  )}\n                </div>\n              </div>\n            )}');
if (clGoodIdx !== -1) {
  cl = cl.slice(0, clGoodIdx + '                        />\n                      </div>\n                    </div>\n                  )}\n                </div>\n              </div>\n            )}'.length) + '\n          </div>\n    </>\n  );\n};\n';
  fs.writeFileSync(clPath, cl);
}

// 3. PlannerBoxInspector.tsx
const inspPath = path.join(outDir, 'PlannerBoxInspector.tsx');
let insp = fs.readFileSync(inspPath, 'utf8');
insp = insp.replace(`      <PlannerUpperCabinetSection selectedBox={selectedBox} />
            </div>
          </div>
        );
      })()}
    </>
  );
};`, `      <PlannerUpperCabinetSection selectedBox={selectedBox} />
          </div>
        );
      })()}
    </>
  );
};`);
fs.writeFileSync(inspPath, insp);

// 4. PlannerCeilingSection.tsx
const csPath = path.join(outDir, 'PlannerCeilingSection.tsx');
let cs = fs.readFileSync(csPath, 'utf8');
cs = cs.replace(`            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {isCeilingEnabled && (
        <>
          <PlannerCeilingMaterial`, `            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <PlannerCeilingMaterial`);

cs = cs.replace(`          <PlannerCeilingLighting ceilingCfg={ceilingCfg} />
        </>
      )}
            </div>
    </div>
  );
};`, `          <PlannerCeilingLighting ceilingCfg={ceilingCfg} />
              </div>
            )}
    </div>
  );
};`);
fs.writeFileSync(csPath, cs);

console.log('Fixed clean endings on all 4 files!');
