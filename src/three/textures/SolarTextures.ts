import * as THREE from 'three';

export class SolarTextures {
  /**
   * Gera textura ultra-realista de painel solar monocristalino
   * @param cellsX Número de células na largura
   * @param cellsY Número de células no comprimento
   */
  static createSolarPanelTexture(cellsX: number = 6, cellsY: number = 10): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Fundo base: silicone monocristalino azul marinho escuro / grafite
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, '#0c1a2e');
    grad.addColorStop(0.5, '#071220');
    grad.addColorStop(1, '#0b1626');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Margem externa de vedação (EVA / Tedlar)
    const margin = 24;
    const innerW = 1024 - (margin * 2);
    const innerH = 1024 - (margin * 2);

    const cellGap = 5;
    const cellW = (innerW - (cellGap * (cellsX - 1))) / cellsX;
    const cellH = (innerH - (cellGap * (cellsY - 1))) / cellsY;

    // Desenha cada célula fotovoltaica com chanfros nos cantos (Mono-wafer cut)
    for (let y = 0; y < cellsY; y++) {
      for (let x = 0; x < cellsX; x++) {
        const cx = margin + x * (cellW + cellGap);
        const cy = margin + y * (cellH + cellGap);

        ctx.save();
        ctx.beginPath();
        const chamfer = Math.min(cellW, cellH) * 0.14; // Corte chanfrado típico de wafer monocristalino
        ctx.moveTo(cx + chamfer, cy);
        ctx.lineTo(cx + cellW - chamfer, cy);
        ctx.lineTo(cx + cellW, cy + chamfer);
        ctx.lineTo(cx + cellW, cy + cellH - chamfer);
        ctx.lineTo(cx + cellW - chamfer, cy + cellH);
        ctx.lineTo(cx + chamfer, cy + cellH);
        ctx.lineTo(cx, cy + cellH - chamfer);
        ctx.lineTo(cx, cy + chamfer);
        ctx.closePath();
        ctx.clip();

        // Gradiente interno da célula com reflexo antirreflexo (ARC antireflective coating)
        const cellGrad = ctx.createRadialGradient(
          cx + cellW * 0.3, cy + cellH * 0.3, 2,
          cx + cellW * 0.5, cy + cellH * 0.5, cellW * 0.8
        );
        cellGrad.addColorStop(0, '#19335a');
        cellGrad.addColorStop(0.7, '#0f2038');
        cellGrad.addColorStop(1, '#07101c');
        ctx.fillStyle = cellGrad;
        ctx.fill();

        // Linhas de contato finas (Finger wires)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        const numFingers = 24;
        const fingerSpacing = cellH / numFingers;
        for (let f = 1; f < numFingers; f++) {
          ctx.beginPath();
          ctx.moveTo(cx, cy + f * fingerSpacing);
          ctx.lineTo(cx + cellW, cy + f * fingerSpacing);
          ctx.stroke();
        }

        // Busbars prateados principais (5 busbars longitudinais)
        const numBusbars = 5;
        const bbSpacing = cellW / (numBusbars + 1);
        ctx.strokeStyle = '#e2e8f0';
        ctx.shadowColor = '#94a3b8';
        ctx.shadowBlur = 1;
        ctx.lineWidth = 2.2;

        for (let b = 1; b <= numBusbars; b++) {
          const bx = cx + b * bbSpacing;
          ctx.beginPath();
          ctx.moveTo(bx, cy);
          ctx.lineTo(bx, cy + cellH);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // Moldura prateada externa de alumínio anodizado
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 1012, 1012);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 1000, 1000);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 8;
    return texture;
  }

  /**
   * Gera textura ultra-realista de painel solar flexível de 100W (60cm x 100cm)
   */
  static createFlexiblePanelTexture(cellsX: number = 4, cellsY: number = 8): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // 1. Base perimetral: Laminado ETFE/TPT branco impermeável
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 600, 1000);

    // Borda chanfrada/arredondada sutil nas 4 pontas
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 596, 996);

    // 2. Área útil das células solares
    const marginX = 28;
    const marginTop = 50; // Margem superior maior para a caixa de junção
    const marginBottom = 30;
    const areaW = 600 - (marginX * 2);
    const areaH = 1000 - marginTop - marginBottom;

    const cellGap = 4;
    const cellW = (areaW - cellGap * (cellsX - 1)) / cellsX;
    const cellH = (areaH - cellGap * (cellsY - 1)) / cellsY;

    // Fundo sob as células (preto escuro)
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(marginX - 2, marginTop - 2, areaW + 4, areaH + 4);

    for (let y = 0; y < cellsY; y++) {
      for (let x = 0; x < cellsX; x++) {
        const cx = marginX + x * (cellW + cellGap);
        const cy = marginTop + y * (cellH + cellGap);

        ctx.save();
        ctx.beginPath();
        const chamfer = Math.min(cellW, cellH) * 0.12; // Cantos cortados mono
        ctx.moveTo(cx + chamfer, cy);
        ctx.lineTo(cx + cellW - chamfer, cy);
        ctx.lineTo(cx + cellW, cy + chamfer);
        ctx.lineTo(cx + cellW, cy + cellH - chamfer);
        ctx.lineTo(cx + cellW - chamfer, cy + cellH);
        ctx.lineTo(cx + chamfer, cy + cellH);
        ctx.lineTo(cx, cy + cellH - chamfer);
        ctx.lineTo(cx, cy + chamfer);
        ctx.closePath();
        ctx.clip();

        // Célula monocristalina
        const cellGrad = ctx.createLinearGradient(cx, cy, cx + cellW, cy + cellH);
        cellGrad.addColorStop(0, '#151922');
        cellGrad.addColorStop(0.35, '#0f131a');
        cellGrad.addColorStop(0.7, '#090c10');
        cellGrad.addColorStop(1, '#05070a');
        ctx.fillStyle = cellGrad;
        ctx.fill();

        // Malha de dedos de contato (finger wires)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        const fingers = 20;
        const fSpacing = cellH / fingers;
        for (let f = 1; f < fingers; f++) {
          ctx.beginPath();
          ctx.moveTo(cx, cy + f * fSpacing);
          ctx.lineTo(cx + cellW, cy + f * fSpacing);
          ctx.stroke();
        }

        // Busbars prateados principais (2 busbars por célula no padrão 100W flexível)
        const numBusbars = 2;
        const bbSpacing = cellW / (numBusbars + 1);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#cbd5e1';
        ctx.shadowBlur = 1;

        for (let b = 1; b <= numBusbars; b++) {
          const bx = cx + b * bbSpacing;
          ctx.beginPath();
          ctx.moveTo(bx, cy);
          ctx.lineTo(bx, cy + cellH);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // 3. Ilhoses metálicos gráficos impressos na borda (com furo central vazado)
    const grommetPositions: [number, number][] = [
      [14, 16],          // Topo esquerdo
      [586, 16],         // Topo direito
      [14, 984],         // Fundo esquerdo
      [586, 984],        // Fundo direito
      [14, 500],         // Meio lateral esquerda
      [586, 500],        // Meio lateral direita
      [300, 984],        // Centro inferior
      [14, 250], [586, 250],
      [14, 750], [586, 750]
    ];

    grommetPositions.forEach(([gx, gy]) => {
      // Anel externo prateado do ilhós
      ctx.beginPath();
      ctx.arc(gx, gy, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(gx, gy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();

      // Furo central escuro vazado
      ctx.beginPath();
      ctx.arc(gx, gy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
    });

    // 4. Marcação de topo para a Caixa de Junção (Junction Box)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(240, 8, 120, 28, [6, 6, 6, 6]);
    } else {
      ctx.rect(240, 8, 120, 28);
    }
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('100W FLEXIBLE SOLAR 22.28V', 300, 24);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 8;
    return texture;
  }
}
