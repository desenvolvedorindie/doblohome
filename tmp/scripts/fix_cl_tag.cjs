const fs = require('fs');

let cl = fs.readFileSync('src/components/planner/PlannerCeilingLighting.tsx', 'utf8');
cl = cl.replace(/\r\n/g, '\n');
cl = cl.replace('\n    </div>\n    </>\n  );\n};\n', '\n    </>\n  );\n};\n');
fs.writeFileSync('src/components/planner/PlannerCeilingLighting.tsx', cl);

const divOpen = (cl.match(/<div(\s|>)/g) || []).length;
const divClose = (cl.match(/<\/div>/g) || []).length;
console.log(`PlannerCeilingLighting: open=${divOpen}, close=${divClose}`);
