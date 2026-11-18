const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/components/planner/PlannerFloorGrid.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update isDefaultDoblo and handleUpdateGridDimensions to only manage widthMm and lengthMm without modifying boxes
const oldHandlerStart = '  const isDefaultDoblo = internalGrid.widthMm === 1200 && internalGrid.lengthMm === 1700 && internalGrid.heightMm === 400;';
const oldHandlerEnd = '  const cellWidthMm = Math.round(internalGrid.widthMm / cols);';

const newHandler = `  const isDefaultDoblo = internalGrid.widthMm === 1200 && internalGrid.lengthMm === 1700;

  const handleUpdateGridDimensions = (
    newWidthMm: number,
    newLengthMm: number
  ) => {
    const sanitizedW = Math.max(500, Math.min(3000, Math.round(newWidthMm) || 1200));
    const sanitizedL = Math.max(500, Math.min(4000, Math.round(newLengthMm) || 1700));

    setInternalGrid((prev) => ({
      ...prev,
      widthMm: sanitizedW,
      lengthMm: sanitizedL,
      ceiling: prev.ceiling
        ? {
            ...prev.ceiling,
            widthMm: sanitizedW,
            lengthMm: sanitizedL
          }
        : undefined
    }));
  };
`;

const startIndex = content.indexOf(oldHandlerStart);
const endIndex = content.indexOf(oldHandlerEnd);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + newHandler + content.slice(endIndex);
} else {
  console.error('Could not find oldHandler block');
  process.exit(1);
}

// 2. In restore default button: update onClick to handleUpdateGridDimensions(1200, 1700)
content = content.replace(
  'onClick={() => handleUpdateGridDimensions(1200, 1700, 400)}',
  'onClick={() => handleUpdateGridDimensions(1200, 1700)}'
);

// 3. Remove "{/* 3. Ajuste de Altura Base (Y) */}" card from the banner
const card3Start = '{/* 3. Ajuste de Altura Base (Y) */}';
const card3End = '{/* Nota de Recálculo Automático */}';

const card3StartIndex = content.indexOf(card3Start);
const card3EndIndex = content.indexOf(card3End);

if (card3StartIndex !== -1 && card3EndIndex !== -1) {
  // Find the opening <div before card3Start and closing </div>
  // Let's inspect: card3 starts with:
  //                 {/* 3. Ajuste de Altura Base (Y) */}
  //                 <div
  //                   style={{
  //                     background: 'rgba(15, 23, 42, 0.65)',
  // ...
  //                   </div>
  //                 </div>
  //               </div>
  //
  //               {/* Nota de Recálculo Automático */}
  // We can slice from `card3Start` backwards to find where that block begins, or slice up to `card3End`.
  // Let's check what precedes card3Start:
  const precedingContent = content.slice(0, card3StartIndex);
  // It has:
  //                   </div>
  //                 </div>
  //
  //                 {/* 3. Ajuste de Altura Base (Y) */}
  // And ends with `</div>\n              </div>\n\n              {/* Nota de Recálculo Automático */}`
  const card3Slice = content.slice(card3StartIndex, card3EndIndex);
  // card3Slice ends just before card3End. The last closing </div> in card3Slice is the closing div of card3.
  const lastDivIndex = card3Slice.lastIndexOf('</div>');
  const sliceToRemove = content.slice(card3StartIndex, card3StartIndex + lastDivIndex + 6);
  content = content.slice(0, card3StartIndex) + content.slice(card3StartIndex + lastDivIndex + 6);
} else {
  console.error('Could not find card3 block');
  process.exit(1);
}

// 4. Update gridTemplateColumns minmax from 210px to 280px for cleaner 2-column layout
content = content.replace(
  "gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))'",
  "gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'"
);

// 5. Update any handleUpdateGridDimensions calls that passed 3 arguments to 2 arguments
content = content.replace(/handleUpdateGridDimensions\(([^,]+),\s*([^,]+),\s*[^)]+\)/g, 'handleUpdateGridDimensions($1, $2)');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully removed bulk height modification from PlannerFloorGrid.tsx!');
