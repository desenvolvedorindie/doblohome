import * as THREE from 'three';

/**
 * Gerador de Texturas Procedurais e Sprites 3D
 * Painéis Solares Monocristalinos de Alta Eficiência, Metais e Cotas
 */
export const TextureGenerator = {
  /**
   * Gera textura ultra-realista de painel solar monocristalino
   * @param cellsX Número de células na largura
   * @param cellsY Número de células no comprimento
   */
  createSolarPanelTexture: function(cellsX: number = 6, cellsY: number = 10): THREE.CanvasTexture {
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
  },

  /**
   * Gera textura ultra-realista de painel solar flexível de 100W (60cm x 100cm)
   */
  createFlexiblePanelTexture: function(cellsX: number = 4, cellsY: number = 8): THREE.CanvasTexture {
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
  },

  /**
   * Gera textura de alumínio escovado para perfis estruturais e corrediças
   */
  createBrushedMetalTexture: function(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 2000; i++) {
      const y = Math.random() * 512;
      const h = Math.random() * 2 + 1;
      ctx.fillRect(0, y, 512, h);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let i = 0; i < 1500; i++) {
      const y = Math.random() * 512;
      const h = Math.random() * 1.5 + 0.5;
      ctx.fillRect(0, y, 512, h);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  },

  /**
   * Gera textura de perfil de extrusão de alumínio anodizado
   */
  createExtrusionMetalTexture: function(isBlack: boolean = true): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = isBlack ? '#1e2430' : '#cfd8dc';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 350; i++) {
      const y = Math.random() * 512;
      const h = Math.random() * 1.5 + 0.5;
      const alpha = Math.random() * 0.08 + 0.02;
      ctx.fillStyle = isBlack ? `rgba(255, 255, 255, ${alpha})` : `rgba(255, 255, 255, ${alpha * 1.4})`;
      ctx.fillRect(0, y, 512, h);
    }

    for (let i = 0; i < 250; i++) {
      const y = Math.random() * 512;
      const h = Math.random() * 1.2 + 0.5;
      const alpha = Math.random() * 0.10 + 0.02;
      ctx.fillStyle = isBlack ? `rgba(0, 0, 0, ${alpha})` : `rgba(0, 0, 0, ${alpha * 0.6})`;
      ctx.fillRect(0, y, 512, h);
    }

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    const noiseAmp = isBlack ? 7 : 10;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * noiseAmp;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    return texture;
  },

  /**
   * Gera textura de tubo estrutural de aço carbono (Metalon)
   */
  createMetalonSteelTexture: function(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#282d36';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 45; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const rad = Math.random() * 90 + 30;
      const grad = ctx.createRadialGradient(rx, ry, 5, rx, ry, rad);
      const isDark = Math.random() > 0.45;
      grad.addColorStop(0, isDark ? 'rgba(18, 22, 28, 0.28)' : 'rgba(60, 68, 80, 0.22)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 180; i++) {
      const y = Math.random() * 512;
      const h = Math.random() * 2.0 + 0.8;
      const alpha = Math.random() * 0.05 + 0.01;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(0, y, 512, h);
    }

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 15;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    texture.anisotropy = 8;
    return texture;
  },

  /**
   * Cria um Sprite 3D de cota ou texto informativo
   */
  createDimensionSprite: function(
    text: string,
    subtext: string = '',
    bgColor: string = 'rgba(15, 23, 42, 0.92)',
    textColor: string = '#38bdf8'
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Sprite();

    ctx.fillStyle = bgColor;
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3;

    const r = 16;
    const x = 8, y = 8, w = 624, h = 104;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 32px "JetBrains Mono", monospace, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 320, subtext ? 42 : 60);

    if (subtext) {
      ctx.font = '500 20px -apple-system, sans-serif';
      ctx.fillStyle = textColor;
      ctx.fillText(subtext, 320, 80);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true,
      opacity: 0.95
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.72, 0.135, 1);
    return sprite;
  },

  /**
   * Gera textura com o emblema oficial "MOTOBUL OFF ROAD" idêntico ao baú da foto
   */
  createMotobulEmblemTexture: function(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.clearRect(0, 0, 512, 256);

    // Texto "MOTOBUL" com borda preta e preenchimento prata/branco
    ctx.font = '900 68px "Arial Black", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sombra / contorno
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#090d16';
    ctx.strokeText('MOTOBUL', 256, 95);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('MOTOBUL', 256, 95);

    // Texto "OFF ROAD" estilizado em vermelho esportivo
    ctx.font = 'italic 900 48px "Impact", "Arial Black", sans-serif';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#090d16';
    ctx.strokeText('OFF ROAD', 256, 165);

    ctx.fillStyle = '#dc2626';
    ctx.fillText('OFF ROAD', 256, 165);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }
};

