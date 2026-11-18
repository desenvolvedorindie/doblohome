const fs = require('fs');
const path = require('path');

// 1. UpperCabinetLongitudinalBuilder.ts
const longPath = path.resolve('src/three/boxes/UpperCabinetLongitudinalBuilder.ts');
let longContent = fs.readFileSync(longPath, 'utf8');

const longAnchor = 'Friso Anti-Queda (25mm)';
const longAnchorIdx = longContent.indexOf(longAnchor);
if (longAnchorIdx !== -1) {
  // Find "    } else {" before this anchor
  const elseIdx = longContent.lastIndexOf('    } else {', longAnchorIdx);
  // Find "    }" after this anchor
  const closeIdx = longContent.indexOf('    }', longAnchorIdx);

  const replacement = `    } else {
      const lipH = 0.025;
      const lipY = interiorBottomY + lipH / 2;
      const lipX = frontX + (side === 'left' ? t / 2 : -t / 2);

      // Friso anti-queda na base inferior do nicho aberto
      addPanel(
        upperGroup,
        t,
        lipH,
        innerL,
        lipX,
        lipY,
        0,
        cabinetMat,
        edgeMat,
        box.id,
        container,
        \`\${box.name} • Armário Aéreo (\${side}) Friso Anti-Queda Base (25mm)\`,
        cabinetUserData
      );

      // Friso anti-queda (beradinha) em TODAS as prateleiras do nicho aberto
      if (!isDrawer) {
        const shelfSpacing = innerH / (numShelves + 1);
        for (let s = 1; s <= numShelves; s++) {
          const shelfY = interiorBottomY + s * shelfSpacing;
          const shelfLipY = shelfY + t / 2 + lipH / 2;
          addPanel(
            upperGroup,
            t,
            lipH,
            innerL,
            lipX,
            shelfLipY,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            \`\${box.name} • Armário Aéreo (\${side}) Friso Anti-Queda Prateleira #\${s} (25mm)\`,
            {
              ...cabinetUserData,
              isUpperCabinetShelfLip: true,
              shelfIndex: s
            }
          );
        }
      }
    }`;

  longContent = longContent.slice(0, elseIdx) + replacement + longContent.slice(closeIdx + 5);
  fs.writeFileSync(longPath, longContent, 'utf8');
  console.log('Successfully updated UpperCabinetLongitudinalBuilder.ts!');
} else {
  console.error('Anchor not found in UpperCabinetLongitudinalBuilder.ts');
}

// 2. UpperCabinetTransverseBuilder.ts
const transPath = path.resolve('src/three/boxes/UpperCabinetTransverseBuilder.ts');
let transContent = fs.readFileSync(transPath, 'utf8');

const transAnchor = 'Friso Anti-Queda (25mm)';
const transAnchorIdx = transContent.indexOf(transAnchor);
if (transAnchorIdx !== -1) {
  const elseIdx = transContent.lastIndexOf('        } else {', transAnchorIdx);
  const closeIdx = transContent.indexOf('        }', transAnchorIdx);

  const replacement = `        } else {
          const lipH = 0.025;
          const lipY = interiorBottomY + lipH / 2;
          const lipZ = frontZ + (side === 'rear' ? -t / 2 : t / 2);

          // Friso anti-queda na base inferior do nicho aberto
          addPanel(
            upperGroup,
            innerW,
            lipH,
            t,
            0,
            lipY,
            lipZ,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            \`\${box.name} • Armário Aéreo (\${side}) Friso Anti-Queda Base (25mm)\`,
            cabinetUserData
          );

          // Friso anti-queda (beradinha) em TODAS as prateleiras do nicho aberto
          if (!isDrawer) {
            const shelfSpacing = innerH / (numShelves + 1);
            for (let s = 1; s <= numShelves; s++) {
              const shelfY = interiorBottomY + s * shelfSpacing;
              const shelfLipY = shelfY + t / 2 + lipH / 2;
              addPanel(
                upperGroup,
                innerW,
                lipH,
                t,
                0,
                shelfLipY,
                lipZ,
                cabinetMat,
                edgeMat,
                box.id,
                container,
                \`\${box.name} • Armário Aéreo (\${side}) Friso Anti-Queda Prateleira #\${s} (25mm)\`,
                {
                  ...cabinetUserData,
                  isUpperCabinetShelfLip: true,
                  shelfIndex: s
                }
              );
            }
          }
        }`;

  transContent = transContent.slice(0, elseIdx) + replacement + transContent.slice(closeIdx + 9);
  fs.writeFileSync(transPath, transContent, 'utf8');
  console.log('Successfully updated UpperCabinetTransverseBuilder.ts!');
} else {
  console.error('Anchor not found in UpperCabinetTransverseBuilder.ts');
}
