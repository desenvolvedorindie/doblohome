const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/components/planner/PlannerFloorGrid.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const targetBefore = `                  </div>
                </div>

                

              {/* Nota de Recálculo Automático */}`;

const replacement = `                  </div>
                </div>
              </div>

              {/* Nota de Recálculo Automático */}`;

content = content.replace(targetBefore, replacement);
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Fixed closing div in PlannerFloorGrid.tsx');
