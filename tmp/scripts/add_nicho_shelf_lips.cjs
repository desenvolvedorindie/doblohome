const fs = require('fs');
const path = require('path');

// 1. Update src/types/internalBoxes.ts
const typesPath = path.resolve('src/types/internalBoxes.ts');
let typesContent = fs.readFileSync(typesPath, 'utf8');

if (!typesContent.includes('openShelves?: number;')) {
  typesContent = typesContent.replace(
    '  drawerMode?: DrawerMode;',
    '  openShelves?: number;          // Quantidade de prateleiras internas para nicho aberto inferior (0 a 3, padrão 0)\n  drawerMode?: DrawerMode;'
  );
  fs.writeFileSync(typesPath, typesContent, 'utf8');
  console.log('Updated types/internalBoxes.ts');
}

// 2. Update src/three/boxes/UpperCabinetLongitudinalBuilder.ts
const upperLongPath = path.resolve('src/three/boxes/UpperCabinetLongitudinalBuilder.ts');
let upperLongContent = fs.readFileSync(upperLongPath, 'utf8');

const oldLongSnippet = `    } else {
      const lipH = 0.025;
      const lipY = interiorBottomY + lipH / 2;
      addPanel(
        upperGroup,
        t,
        lipH,
        innerL,
        frontX + (side === 'left' ? t / 2 : -t / 2),
        lipY,
        0,
        cabinetMat,
        edgeMat,
        box.id,
        container,
        \`\${box.name} • Armário Aéreo (\${side}) Friso Anti-Queda (25mm)\`,
        cabinetUserData
      );
    }`;

const newLongSnippet = `    } else {
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

if (upperLongContent.includes(oldLongSnippet)) {
  upperLongContent = upperLongContent.replace(oldLongSnippet, newLongSnippet);
  fs.writeFileSync(upperLongPath, upperLongContent, 'utf8');
  console.log('Updated UpperCabinetLongitudinalBuilder.ts');
} else {
  console.log('Snippet not matched in UpperCabinetLongitudinalBuilder.ts');
}

// 3. Update src/three/boxes/UpperCabinetTransverseBuilder.ts
const upperTransPath = path.resolve('src/three/boxes/UpperCabinetTransverseBuilder.ts');
let upperTransContent = fs.readFileSync(upperTransPath, 'utf8');

const oldTransSnippet = `        } else {
          const lipH = 0.025;
          const lipY = interiorBottomY + lipH / 2;
          addPanel(
            upperGroup,
            innerW,
            lipH,
            t,
            0,
            lipY,
            frontZ + (side === 'rear' ? -t / 2 : t / 2),
            cabinetMat,
            edgeMat,
            box.id,
            container,
            \`\${box.name} • Armário Aéreo (\${side}) Friso Anti-Queda (25mm)\`,
            cabinetUserData
          );
        }`;

const newTransSnippet = `        } else {
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

if (upperTransContent.includes(oldTransSnippet)) {
  upperTransContent = upperTransContent.replace(oldTransSnippet, newTransSnippet);
  fs.writeFileSync(upperTransPath, upperTransContent, 'utf8');
  console.log('Updated UpperCabinetTransverseBuilder.ts');
} else {
  console.log('Snippet not matched in UpperCabinetTransverseBuilder.ts');
}

// 4. Update src/three/boxes/ChestBuilder.ts for base module nichos
const chestPath = path.resolve('src/three/boxes/ChestBuilder.ts');
let chestContent = fs.readFileSync(chestPath, 'utf8');

const targetChestSnippet = `      buildHollowBox(container, w, h, l, tConfig.default, mat, edgeMat, false, box.id, container, openPanels, box.name, box);`;

const newChestSnippet = `      buildHollowBox(container, w, h, l, tConfig.default, mat, edgeMat, false, box.id, container, openPanels, box.name, box);

      // Prateleiras internas do nicho aberto com beradinha anti-queda
      if (box.openShelves && box.openShelves > 0) {
        const numShelves = Math.max(1, Math.min(3, box.openShelves));
        const hasBottom = box.panels?.bottom ?? false;
        const bottomT = hasBottom ? tConfig.bottom : 0;
        const topT = hasTop ? tTop : 0;
        const innerH = h - bottomT - topT;
        const interiorBottomY = -h / 2 + bottomT;
        const shelfSpacing = innerH / (numShelves + 1);
        const shelfT = tConfig.shelf;
        const shelfTMm = Math.round(tConfig.shelf * 1000);
        const lipH = 0.025; // 25mm de beradinha anti-queda

        const isOpenFront = box.panels?.front === false;
        const isOpenRear = box.panels?.rear === false;

        for (let s = 1; s <= numShelves; s++) {
          const shelfY = interiorBottomY + s * shelfSpacing;

          addPanel(
            container,
            innerW,
            shelfT,
            usableL,
            centerInnerX,
            shelfY,
            zCenterOffset,
            mat,
            edgeMat,
            box.id,
            container,
            \`\${box.name} • Nicho Prateleira #\${s} (\${Math.round(innerW * 1000)}×\${Math.round(usableL * 1000)}mm)\`,
            {
              thicknessMm: shelfTMm,
              woodMaterial: woodMat,
              moduleName: box.name,
              partType: 'shelf',
              isNichoShelf: true,
              shelfIndex: s,
              material: \`\${woodMat} \${shelfTMm}mm Impermeabilizado\`
            }
          );

          if (isOpenFront) {
            const frontLipZ = usableL / 2 - tConfig.default / 2 + zCenterOffset;
            const shelfLipY = shelfY + shelfT / 2 + lipH / 2;
            addPanel(
              container,
              innerW,
              lipH,
              tConfig.default,
              centerInnerX,
              shelfLipY,
              frontLipZ,
              mat,
              edgeMat,
              box.id,
              container,
              \`\${box.name} • Nicho Beradinha Anti-Queda Prateleira #\${s} (Frente 25mm)\`,
              {
                thicknessMm: Math.round(tConfig.default * 1000),
                woodMaterial: woodMat,
                moduleName: box.name,
                partType: 'lip',
                shelfIndex: s
              }
            );
          }

          if (isOpenRear) {
            const rearLipZ = -usableL / 2 + tConfig.default / 2 + zCenterOffset;
            const shelfLipY = shelfY + shelfT / 2 + lipH / 2;
            addPanel(
              container,
              innerW,
              lipH,
              tConfig.default,
              centerInnerX,
              shelfLipY,
              rearLipZ,
              mat,
              edgeMat,
              box.id,
              container,
              \`\${box.name} • Nicho Beradinha Anti-Queda Prateleira #\${s} (Trás 25mm)\`,
              {
                thicknessMm: Math.round(tConfig.default * 1000),
                woodMaterial: woodMat,
                moduleName: box.name,
                partType: 'lip',
                shelfIndex: s
              }
            );
          }
        }

        if (isOpenFront) {
          const frontLipZ = usableL / 2 - tConfig.default / 2 + zCenterOffset;
          const baseLipY = interiorBottomY + lipH / 2;
          addPanel(
            container,
            innerW,
            lipH,
            tConfig.default,
            centerInnerX,
            baseLipY,
            frontLipZ,
            mat,
            edgeMat,
            box.id,
            container,
            \`\${box.name} • Nicho Beradinha Anti-Queda Base (Frente 25mm)\`,
            {
              thicknessMm: Math.round(tConfig.default * 1000),
              woodMaterial: woodMat,
              moduleName: box.name,
              partType: 'lip'
            }
          );
        }

        if (isOpenRear) {
          const rearLipZ = -usableL / 2 + tConfig.default / 2 + zCenterOffset;
          const baseLipY = interiorBottomY + lipH / 2;
          addPanel(
            container,
            innerW,
            lipH,
            tConfig.default,
            centerInnerX,
            baseLipY,
            rearLipZ,
            mat,
            edgeMat,
            box.id,
            container,
            \`\${box.name} • Nicho Beradinha Anti-Queda Base (Trás 25mm)\`,
            {
              thicknessMm: Math.round(tConfig.default * 1000),
              woodMaterial: woodMat,
              moduleName: box.name,
              partType: 'lip'
            }
          );
        }
      }`;

if (chestContent.includes(targetChestSnippet)) {
  chestContent = chestContent.replace(targetChestSnippet, newChestSnippet);
  fs.writeFileSync(chestPath, chestContent, 'utf8');
  console.log('Updated ChestBuilder.ts');
} else {
  console.log('Target snippet not matched in ChestBuilder.ts');
}

// 5. Update src/components/planner/PlannerBoxInspector.tsx
const inspectorPath = path.resolve('src/components/planner/PlannerBoxInspector.tsx');
let inspectorContent = fs.readFileSync(inspectorPath, 'utf8');

const targetInspectorAnchor = `{/* Descrição informativa do módulo deslizante (Gavetão vs Bandeja) */}`;

const newInspectorBlock = `{/* Configuração de Prateleiras do Nicho com Beradinha */}
        {selectedBox.type === 'open' && (
          <div style={{ gridColumn: '1 / -1', background: 'rgba(15, 23, 42, 0.4)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#38bdf8' }}>
                📚 Prateleiras do Nicho c/ Beradinha:
              </span>
              <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                {selectedBox.openShelves || 0} {(selectedBox.openShelves || 0) === 1 ? 'Prateleira' : 'Prateleiras'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {[0, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={\`btn-compact \${(selectedBox.openShelves || 0) === num ? 'active' : ''}\`}
                  onClick={() => updateInternalBox(selectedBox.id, { openShelves: num })}
                  style={{
                    fontSize: '11px',
                    padding: '6px 4px',
                    fontWeight: 700
                  }}
                >
                  {num === 0 ? 'Vão Livre' : \`\${num} \${num === 1 ? 'Prat.' : 'Prats.'}\`}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
              💡 Toda prateleira do nicho inclui automaticamente uma beradinha anti-queda (25mm) para impedir a queda de objetos durante as viagens.
            </div>
          </div>
        )}

        ` + targetInspectorAnchor;

if (inspectorContent.includes(targetInspectorAnchor)) {
  inspectorContent = inspectorContent.replace(targetInspectorAnchor, newInspectorBlock);
  fs.writeFileSync(inspectorPath, inspectorContent, 'utf8');
  console.log('Updated PlannerBoxInspector.tsx');
} else {
  console.log('Anchor not matched in PlannerBoxInspector.tsx');
}
