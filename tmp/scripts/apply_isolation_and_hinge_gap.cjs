const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, target, replacement) {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedTarget = target.replace(/\r\n/g, '\n');
  const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

  if (!normalizedContent.includes(normalizedTarget)) {
    throw new Error(`Target not found in ${filePath}:\n"${normalizedTarget.slice(0, 100)}..."`);
  }

  const newContent = normalizedContent.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(fullPath, newContent, 'utf8');
  console.log(`Successfully updated ${filePath}`);
}

// 1. InternalBoxesBuilder.ts
replaceInFile(
  'src/three/InternalBoxesBuilder.ts',
`    this.lastUpdateArgs = [grid, boxes, selectedBoxId, previewOpen, isolatedBoxId];
    const activeFocusBoxId = isolatedBoxId || selectedBoxId;
    this.isolatedBoxId = activeFocusBoxId;
    this.selectedBoxId = selectedBoxId;
    this.strictIsolatedBoxId = isolatedBoxId;`,
`    this.lastUpdateArgs = [grid, boxes, selectedBoxId, previewOpen, isolatedBoxId];
    this.isolatedBoxId = isolatedBoxId;
    this.selectedBoxId = selectedBoxId;
    this.strictIsolatedBoxId = isolatedBoxId;`
);

replaceInFile(
  'src/three/InternalBoxesBuilder.ts',
`    // 5. Quando estiver dentro de um módulo ou com "Ocultar paredes" ativo, mantém piso, grid e teto fantasmas para não obstruírem
    if (activeFocusBoxId || this.ghostWalls) {
      this.applyGhostTransparency(this.floorGroup, 0.08, 0.04);
      this.applyGhostTransparency(this.gridLinesGroup, 0.08, 0.04);
      this.applyGhostTransparency(this.ceilingGroup, 0.08, 0.04);
    }`,
`    // 5. Quando estiver em modo isolado ou com "Ocultar paredes" ativo, mantém piso, grid e teto fantasmas para não obstruírem
    if (isolatedBoxId || this.ghostWalls) {
      this.applyGhostTransparency(this.floorGroup, 0.08, 0.04);
      this.applyGhostTransparency(this.gridLinesGroup, 0.08, 0.04);
      this.applyGhostTransparency(this.ceilingGroup, 0.08, 0.04);
    }`
);

replaceInFile(
  'src/three/InternalBoxesBuilder.ts',
`    const activeFocusBoxId = isolatedBoxId || selectedBoxId;

    // Garante que o módulo em foco/selecionado seja construído por último, ficando com prioridade visual total no Three.js
    const sortedBoxes = [...boxes].sort((a, b) => {
      if (a.id === activeFocusBoxId) return 1;
      if (b.id === activeFocusBoxId) return -1;
      return 0;
    });

    const isAnyBedOpen = globalBedOpen || boxes.some((b) => (b.type === 'slat_bed' || b.hasBed) && Boolean(b.isBedOpen ?? (b.type === 'slat_bed' ? b.isOpen : false)));

    sortedBoxes.forEach((box) => {
      const colStart = Math.min(cols - 1, Math.max(0, box.colStart));
      const colSpan = Math.min(cols - colStart, Math.max(1, box.colSpan));
      const rowStart = Math.min(rows - 1, Math.max(0, box.rowStart));
      const rowSpan = Math.min(rows - rowStart, Math.max(1, box.rowSpan));

      const extraWM = (box.extraWidthMm || 0) / 1000;
      const extraLM = (box.extraLengthMm || 0) / 1000;
      const offsetXM = (box.offsetXMm || 0) / 1000;
      const offsetZM = (box.offsetZMm || 0) / 1000;

      // Dimensões pelas células do grid + acréscimo/redução fina em mm quando configurado
      const boxWM = Math.max(0.05, colSpan * cellWM + extraWM);
      const boxLM = Math.max(0.05, rowSpan * cellLM + extraLM);
      const boxHM = Math.max(0.05, (box.heightMm ?? grid.heightMm) / 1000);

      // Posicionamento X: Da esquerda para a direita na visão traseira (+X para -X)
      const posX = (widthM / 2) - (colStart + colSpan / 2) * cellWM + offsetXM;
      const posZ = -(rowStart + rowSpan / 2) * cellLM + offsetZM;
      const posY = floorY + boxHM / 2;

      const isTargetModule = activeFocusBoxId ? box.id === activeFocusBoxId : false;
      const isGhost = activeFocusBoxId ? box.id !== activeFocusBoxId : false;
      const isSelected = isTargetModule ? false : false;`,
`    const activeFocusBoxId = isolatedBoxId || selectedBoxId;

    // Garante que o módulo em foco/selecionado seja construído por último, ficando com prioridade visual total no Three.js
    const sortedBoxes = [...boxes].sort((a, b) => {
      if (a.id === activeFocusBoxId) return 1;
      if (b.id === activeFocusBoxId) return -1;
      return 0;
    });

    const isAnyBedOpen = globalBedOpen || boxes.some((b) => (b.type === 'slat_bed' || b.hasBed) && Boolean(b.isBedOpen ?? (b.type === 'slat_bed' ? b.isOpen : false)));

    sortedBoxes.forEach((box) => {
      const colStart = Math.min(cols - 1, Math.max(0, box.colStart));
      const colSpan = Math.min(cols - colStart, Math.max(1, box.colSpan));
      const rowStart = Math.min(rows - 1, Math.max(0, box.rowStart));
      const rowSpan = Math.min(rows - rowStart, Math.max(1, box.rowSpan));

      const extraWM = (box.extraWidthMm || 0) / 1000;
      const extraLM = (box.extraLengthMm || 0) / 1000;
      const offsetXM = (box.offsetXMm || 0) / 1000;
      const offsetZM = (box.offsetZMm || 0) / 1000;

      // Dimensões pelas células do grid + acréscimo/redução fina em mm quando configurado
      const boxWM = Math.max(0.05, colSpan * cellWM + extraWM);
      const boxLM = Math.max(0.05, rowSpan * cellLM + extraLM);
      const boxHM = Math.max(0.05, (box.heightMm ?? grid.heightMm) / 1000);

      // Posicionamento X: Da esquerda para a direita na visão traseira (+X para -X)
      const posX = (widthM / 2) - (colStart + colSpan / 2) * cellWM + offsetXM;
      const posZ = -(rowStart + rowSpan / 2) * cellLM + offsetZM;
      const posY = floorY + boxHM / 2;

      const isTargetModule = isolatedBoxId ? box.id === isolatedBoxId : false;
      const isGhost = isolatedBoxId ? box.id !== isolatedBoxId : false;
      const isSelected = selectedBoxId ? box.id === selectedBoxId : false;`
);

replaceInFile(
  'src/three/InternalBoxesBuilder.ts',
`      // Hitbox sólida transparente: cobre todo o volume da caixa para clique e hover imediatos
      // quando nenhum módulo está aberto. Ao entrar em um módulo ou ocultar paredes, omitimos a hitbox externa
      // para permitir hover e clique direto nas peças individuais / componentes.
      if (!activeFocusBoxId && !this.ghostWalls) {`,
`      // Hitbox sólida transparente: cobre todo o volume da caixa para clique e hover imediatos
      // quando o módulo não está isolado. Ao isolar um módulo ou ocultar paredes, omitimos a hitbox externa
      // para permitir hover e clique direto nas peças individuais / componentes.
      if (!isolatedBoxId && !this.ghostWalls) {`
);

// 2. useInternalBoxesManager.ts
replaceInFile(
  'src/context/solar/useInternalBoxesManager.ts',
`  const setSelectedBoxId = (id: string | null) => {
    const prevSelected = selectedBoxId;
    setSelectedBoxIdState(id);
    if (sceneManager) {
      sceneManager.clearBarHover();
    }
    if (id !== null) {
      if (isolatedBoxId && isolatedBoxId !== id) {
        setIsolatedBoxIdState(id);
      }
      if (
        sceneManager &&
        id !== prevSelected &&
        sceneManager.internalBoxesBuilder?.boxesGroup?.getObjectByName(\`BoxContainer_\${id}\`)
      ) {
        sceneManager.focusOnBox(id);
      }
    } else {
      setIsolatedBoxIdState(null);
      if (sceneManager && viewMode === 'internal_boxes') {
        sceneManager.focusOnBox(null);
      }
    }
  };`,
`  const setSelectedBoxId = (id: string | null) => {
    setSelectedBoxIdState(id);
    if (sceneManager) {
      sceneManager.clearBarHover();
    }
    if (id !== null) {
      if (isolatedBoxId && isolatedBoxId !== id) {
        setIsolatedBoxIdState(id);
      }
    } else {
      setIsolatedBoxIdState(null);
      if (sceneManager && viewMode === 'internal_boxes') {
        sceneManager.focusOnBox(null);
      }
    }
  };`
);

// 3. SolarContext.tsx
replaceInFile(
  'src/context/SolarContext.tsx',
`    sceneManager.onBoxDoubleClick = (boxId: string | null) => {
      boxesMgr.setIsolatedBoxId(boxId);
    };`,
`    sceneManager.onBoxDoubleClick = (boxId: string | null) => {
      if (!boxId) {
        boxesMgr.setIsolatedBoxId(null);
      } else {
        boxesMgr.setIsolatedBoxId(boxesMgr.isolatedBoxId === boxId ? null : boxId);
      }
    };`
);

// 4. CanvasViewport.tsx
replaceInFile(
  'src/components/CanvasViewport.tsx',
`      {activeModuleBox && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <button
            onClick={() => {
              setIsolatedBoxId(null);
              setSelectedBoxId(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1.5px solid #38bdf8',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.45), 0 2px 6px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.15s ease'
            }}
            title="Voltar para visualizar e editar todos os demais baús (ou pressione ESC)"
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>←</span> Voltar (Editar demais baús)
          </button>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#f8fafc',
              fontSize: '12px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>
              {isolatedBoxId ? '🎯 Visualização Isolada:' : '🪵 Inspecionando Módulo:'}
            </span>
            <span>{activeModuleBox.name}</span>
            <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '6px' }}>
              (passe o mouse nas peças de madeira)
            </span>
          </div>
        </div>
      )}`,
`      {isolatedBoxId && activeModuleBox && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <button
            onClick={() => {
              setIsolatedBoxId(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1.5px solid #38bdf8',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.45), 0 2px 6px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.15s ease'
            }}
            title="Voltar para exibir todos os módulos (ou pressione ESC)"
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>←</span> Voltar (Exibir todos os módulos)
          </button>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#f8fafc',
              fontSize: '12px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>
              🎯 Visualização Isolada:
            </span>
            <span>{activeModuleBox.name}</span>
            <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '6px' }}>
              (passe o mouse nas peças de madeira)
            </span>
          </div>
        </div>
      )}`
);

// 5. SlatBedBuilder.ts (hinge gap)
replaceInFile(
  'src/three/boxes/SlatBedBuilder.ts',
`    const isLateral = direction === 'left' || direction === 'right';

    if (isLateral) {
      // Folha dobrável limitada logicamente ao tamanho w do módulo
      const leafW = Math.min(w, Math.max(Math.min(0.10, w), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : w)));

      // No sistema da Doblò: +X = Esquerda (Motorista), -X = Direita (Passageiro)
      const hingeX = direction === 'left' ? w / 2 : -w / 2;
      const hingePivot = new THREE.Group();
      hingePivot.name = 'HingedBedPivot';
      hingePivot.position.set(hingeX, h / 2, 0);

      // Quando aberto, desdobra 180° (PI radianos) para o lado correto (+X para left, -X para right)
      hingePivot.rotation.z = isExtended ? (direction === 'left' ? -Math.PI : Math.PI) : 0;

      // Folha articulada dobrável: quando fechada, descansa em cima do tampo fixo
      const localLeafCenterX = direction === 'left' ? -leafW / 2 : leafW / 2;
      const localLeafCenterY = slatT / 2;

      addPanel(
        hingePivot,
        leafW,
        slatT,
        l,
        localLeafCenterX,
        localLeafCenterY,
        0,
        slatMat,
        mobileEdgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Folha Articulada (\${Math.round(leafW * 1000)}×\${Math.round(l * 1000)}×\${slatTMm}mm)\`,
        { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'door', material: \`\${slatWoodMat} \${slatTMm}mm Impermeabilizado\` }
      );

      // Pés de apoio articulados nas quinas com espaçamento igual dos lados mais próximos (aparecem apenas quando aberto)
      if (isExtended) {
        const legSize = 0.035;
        const cornerGap = 0; // pés encostados na quina, sem espaçamento
        const centerOffset = cornerGap + legSize / 2;
        const localLegX = direction === 'left' ? (-leafW + centerOffset) : (leafW - centerOffset);
        const legZ1 = -l / 2 + centerOffset;
        const legZ2 = l / 2 - centerOffset;
        const localLegY = slatT + legH / 2;

        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          localLegX,
          localLegY,
          legZ1,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé de Apoio Traseiro (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          localLegX,
          localLegY,
          legZ2,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé de Apoio Dianteiro (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
      }

      // 3 Dobradiças de metal visíveis ao longo da costura
      [-l * 0.35, 0, l * 0.35].forEach((zPos) => {
        const hCyl = new THREE.CylinderGeometry(0.007, 0.007, 0.05, 12);
        hCyl.rotateX(Math.PI / 2);
        const hMesh = new THREE.Mesh(hCyl, hingeMat);
        hMesh.position.set(hingeX, h / 2, zPos);
        container.add(hMesh);
      });

      // Hitbox para interação
      const hitGeo = new THREE.BoxGeometry(w, h, l);
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.name = '__box_hitbox';
      hitMesh.userData = { isInternalBoxHitbox: true, isInternalBox: true, boxId: box.id, boxRoot: container };
      hingePivot.add(hitMesh);

      container.add(hingePivot);
    } else {
      // Longitudinal (rear ou front): folha dobrável limitada logicamente ao tamanho l do módulo
      const leafL = Math.min(l, Math.max(Math.min(0.10, l), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : l)));

      const hingeZ = direction === 'rear' ? -l / 2 : l / 2;
      const hingePivot = new THREE.Group();
      hingePivot.name = 'HingedBedPivot';
      hingePivot.position.set(0, h / 2, hingeZ);

      hingePivot.rotation.x = isExtended ? (direction === 'rear' ? -Math.PI : Math.PI) : 0;

      const localLeafCenterZ = direction === 'rear' ? leafL / 2 : -leafL / 2;
      const localLeafCenterY = slatT / 2;

      addPanel(
        hingePivot,
        w,
        slatT,
        leafL,
        0,
        localLeafCenterY,
        localLeafCenterZ,
        slatMat,
        mobileEdgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Folha Articulada (\${Math.round(w * 1000)}×\${Math.round(leafL * 1000)}×\${slatTMm}mm)\`,
        { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'door', material: \`\${slatWoodMat} \${slatTMm}mm Impermeabilizado\` }
      );

      if (isExtended) {
        const legSize = 0.035;
        const cornerGap = 0; // pés encostados na quina, sem espaçamento
        const centerOffset = cornerGap + legSize / 2;
        const localLegZ = direction === 'rear' ? (leafL - centerOffset) : (-leafL + centerOffset);
        const legX1 = -w / 2 + centerOffset;
        const legX2 = w / 2 - centerOffset;
        const localLegY = slatT + legH / 2;

        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          legX1,
          localLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé Articulado Esq. (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          legX2,
          localLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé Articulado Dir. (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
      }

      [-w * 0.35, 0, w * 0.35].forEach((xPos) => {
        const hCyl = new THREE.CylinderGeometry(0.007, 0.007, 0.05, 12);
        hCyl.rotateZ(Math.PI / 2);
        const hMesh = new THREE.Mesh(hCyl, hingeMat);
        hMesh.position.set(xPos, h / 2, hingeZ);
        container.add(hMesh);
      });

      const hitGeo = new THREE.BoxGeometry(w, h, l);
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.name = '__box_hitbox';
      hitMesh.userData = { isInternalBoxHitbox: true, isInternalBox: true, boxId: box.id, boxRoot: container };
      hingePivot.add(hitMesh);

      container.add(hingePivot);
    }`,
`    const isLateral = direction === 'left' || direction === 'right';
    // Espaçamento funcional entre as madeiras para compensar e acomodar o corpo da dobradiça (3mm)
    const hingeGap = 0.003;

    if (isLateral) {
      // Folha dobrável limitada logicamente ao tamanho w do módulo
      const leafW = Math.min(w, Math.max(Math.min(0.10, w), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : w)));

      // No sistema da Doblò: +X = Esquerda (Motorista), -X = Direita (Passageiro)
      // O eixo da dobradiça fica centralizado na folga entre o tampo fixo e a folha móvel
      const hingeX = direction === 'left' ? (w / 2 + hingeGap / 2) : (-w / 2 - hingeGap / 2);
      const hingePivot = new THREE.Group();
      hingePivot.name = 'HingedBedPivot';
      hingePivot.position.set(hingeX, h / 2, 0);

      // Quando aberto, desdobra 180° (PI radianos) para o lado correto (+X para left, -X para right)
      hingePivot.rotation.z = isExtended ? (direction === 'left' ? -Math.PI : Math.PI) : 0;

      // Folha articulada dobrável: quando fechada, descansa em cima do tampo fixo com folga compensada
      const localLeafCenterX = direction === 'left' ? (-hingeGap / 2 - leafW / 2) : (hingeGap / 2 + leafW / 2);
      const localLeafCenterY = slatT / 2;

      addPanel(
        hingePivot,
        leafW,
        slatT,
        l,
        localLeafCenterX,
        localLeafCenterY,
        0,
        slatMat,
        mobileEdgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Folha Articulada (\${Math.round(leafW * 1000)}×\${Math.round(l * 1000)}×\${slatTMm}mm)\`,
        { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'door', material: \`\${slatWoodMat} \${slatTMm}mm Impermeabilizado\` }
      );

      // Pés de apoio articulados nas quinas da folha dobrável (aparecem apenas quando aberto)
      if (isExtended) {
        const legSize = 0.035;
        const cornerGap = 0; // pés encostados na quina, sem espaçamento
        const centerOffset = cornerGap + legSize / 2;
        const localLegX = direction === 'left' ? (-hingeGap / 2 - leafW + centerOffset) : (hingeGap / 2 + leafW - centerOffset);
        const legZ1 = -l / 2 + centerOffset;
        const legZ2 = l / 2 - centerOffset;
        const localLegY = slatT + legH / 2;

        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          localLegX,
          localLegY,
          legZ1,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé de Apoio Traseiro (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          localLegX,
          localLegY,
          legZ2,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé de Apoio Dianteiro (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
      }

      // 3 Dobradiças de metal visíveis ao longo da costura, alojadas no espaçamento entre as madeiras
      [-l * 0.35, 0, l * 0.35].forEach((zPos) => {
        const hCyl = new THREE.CylinderGeometry(0.004, 0.004, 0.045, 12);
        hCyl.rotateX(Math.PI / 2);
        const hMesh = new THREE.Mesh(hCyl, hingeMat);
        hMesh.position.set(hingeX, h / 2, zPos);
        container.add(hMesh);
      });

      // Hitbox para interação
      const hitGeo = new THREE.BoxGeometry(w, h, l);
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.name = '__box_hitbox';
      hitMesh.userData = { isInternalBoxHitbox: true, isInternalBox: true, boxId: box.id, boxRoot: container };
      hingePivot.add(hitMesh);

      container.add(hingePivot);
    } else {
      // Longitudinal (rear ou front): folha dobrável limitada logicamente ao tamanho l do módulo
      const leafL = Math.min(l, Math.max(Math.min(0.10, l), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : l)));

      const hingeZ = direction === 'rear' ? (-l / 2 - hingeGap / 2) : (l / 2 + hingeGap / 2);
      const hingePivot = new THREE.Group();
      hingePivot.name = 'HingedBedPivot';
      hingePivot.position.set(0, h / 2, hingeZ);

      hingePivot.rotation.x = isExtended ? (direction === 'rear' ? -Math.PI : Math.PI) : 0;

      const localLeafCenterZ = direction === 'rear' ? (hingeGap / 2 + leafL / 2) : (-hingeGap / 2 - leafL / 2);
      const localLeafCenterY = slatT / 2;

      addPanel(
        hingePivot,
        w,
        slatT,
        leafL,
        0,
        localLeafCenterY,
        localLeafCenterZ,
        slatMat,
        mobileEdgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Folha Articulada (\${Math.round(w * 1000)}×\${Math.round(leafL * 1000)}×\${slatTMm}mm)\`,
        { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'door', material: \`\${slatWoodMat} \${slatTMm}mm Impermeabilizado\` }
      );

      if (isExtended) {
        const legSize = 0.035;
        const cornerGap = 0; // pés encostados na quina, sem espaçamento
        const centerOffset = cornerGap + legSize / 2;
        const localLegZ = direction === 'rear' ? (hingeGap / 2 + leafL - centerOffset) : (-hingeGap / 2 - leafL + centerOffset);
        const legX1 = -w / 2 + centerOffset;
        const legX2 = w / 2 - centerOffset;
        const localLegY = slatT + legH / 2;

        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          legX1,
          localLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé Articulado Esq. (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          legX2,
          localLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          \`\${box.name} • Cama Dobradiça - Pé Articulado Dir. (\${Math.round(legH * 1000)}×35×35mm)\`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: \`\${legWoodMat} \${slatTMm}mm\` }
        );
      }

      [-w * 0.35, 0, w * 0.35].forEach((xPos) => {
        const hCyl = new THREE.CylinderGeometry(0.004, 0.004, 0.045, 12);
        hCyl.rotateZ(Math.PI / 2);
        const hMesh = new THREE.Mesh(hCyl, hingeMat);
        hMesh.position.set(xPos, h / 2, hingeZ);
        container.add(hMesh);
      });

      const hitGeo = new THREE.BoxGeometry(w, h, l);
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.name = '__box_hitbox';
      hitMesh.userData = { isInternalBoxHitbox: true, isInternalBox: true, boxId: box.id, boxRoot: container };
      hingePivot.add(hitMesh);

      container.add(hingePivot);
    }`
);

console.log('All changes applied successfully!');
