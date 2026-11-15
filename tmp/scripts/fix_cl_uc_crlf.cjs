const fs = require('fs');

// 1. PlannerCeilingLighting.tsx
let cl = fs.readFileSync('src/components/planner/PlannerCeilingLighting.tsx', 'utf8');
cl = cl.replace(/\r\n/g, '\n');
const clMarker = 'style={{ width: \'100%\', marginTop: \'4px\' }}\n                        />\n                      </div>\n                    </div>\n                  )}\n                </div>\n              </div>\n            )}';
const clIdx = cl.indexOf(clMarker);
if (clIdx !== -1) {
  cl = cl.slice(0, clIdx + clMarker.length) + '\n    </div>\n    </>\n  );\n};\n';
  fs.writeFileSync('src/components/planner/PlannerCeilingLighting.tsx', cl);
}

// 2. PlannerUpperCabinetSection.tsx
let uc = fs.readFileSync('src/components/planner/PlannerUpperCabinetSection.tsx', 'utf8');
uc = uc.replace(/\r\n/g, '\n');
const ucMarker = '{(isCabinetsOpenPreview || Boolean(selectedBox.isOpen))\n                        ? (getUpperCabinetClosure(selectedBox) === \'drawer\' ? \'🔒 Recolher Gaveta\' : \'🔓 Fechar Porta\')\n                        : (getUpperCabinetClosure(selectedBox) === \'drawer\' ? \'🗄️ Deslizar Gaveta (Abrir)\' : \'🚪 Abrir Porta\')}\n                    </button>\n                  </div>\n                )}\n              </div>\n            )}\n          </div>';
const ucIdx = uc.indexOf(ucMarker);
if (ucIdx !== -1) {
  uc = uc.slice(0, ucIdx + ucMarker.length) + '\n    </>\n  );\n};\n';
  fs.writeFileSync('src/components/planner/PlannerUpperCabinetSection.tsx', uc);
}

console.log('Normalized and fixed cl and uc endings!');
