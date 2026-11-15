const fs = require('fs');

// 1. Fix PlannerCeilingLighting.tsx
let cl = fs.readFileSync('src/components/planner/PlannerCeilingLighting.tsx', 'utf8').replace(/\r\n/g, '\n');
cl = cl.replace(`                  )}
                </div>
            )}
    </>
  );
};`, `                  )}
                </div>
    </>
  );
};`);
fs.writeFileSync('src/components/planner/PlannerCeilingLighting.tsx', cl);

// 2. Fix PlannerCeilingSection.tsx
let cs = fs.readFileSync('src/components/planner/PlannerCeilingSection.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = cs.split('\n');

// Find and remove lines {isCeilingEnabled && ( and <>
const filtered = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim() === '{isCeilingEnabled && (' || line.trim() === '<>') {
    continue;
  }
  filtered.push(line);
}
fs.writeFileSync('src/components/planner/PlannerCeilingSection.tsx', filtered.join('\n'));

console.log('Fixed PlannerCeilingLighting and PlannerCeilingSection!');
