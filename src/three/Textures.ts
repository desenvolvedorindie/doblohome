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
    if (typeof document === 'undefined') return new THREE.CanvasTexture({} as any);
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
  },

  /**
   * Gera textura frontal serigrafada oficial da Bateria Kingbo Power LiFePO4 560Ah
   */
  createKingboBatteryFrontTexture: function(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // 1. Fundo em aço escovado grafite escuro metálico
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 512);
    bgGrad.addColorStop(0, '#131820');
    bgGrad.addColorStop(0.5, '#1e242d');
    bgGrad.addColorStop(1, '#0e1319');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Efeito de escovado horizontal sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 3) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    // Moldura chanfrada de proteção
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, 1024 - 32, 512 - 32);

    // Parafusos sextavados nos 4 cantos
    const corners = [
      [36, 36], [1024 - 36, 36],
      [36, 512 - 36], [1024 - 36, 512 - 36]
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Faixa superior verde esmeralda Kingbo Power
    const stripeGrad = ctx.createLinearGradient(0, 48, 1024, 48);
    stripeGrad.addColorStop(0, '#059669');
    stripeGrad.addColorStop(0.5, '#10b981');
    stripeGrad.addColorStop(1, '#047857');
    ctx.fillStyle = stripeGrad;
    ctx.fillRect(24, 48, 1024 - 48, 8);

    // Ícone de energia verde neon
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(100, 125, 36, 0, Math.PI * 2);
    ctx.fill();
    // Raio branco
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(102, 100);
    ctx.lineTo(84, 126);
    ctx.lineTo(100, 126);
    ctx.lineTo(96, 150);
    ctx.lineTo(116, 120);
    ctx.lineTo(102, 120);
    ctx.closePath();
    ctx.fill();

    // Logotipo "KINGBO POWER"
    ctx.font = '900 48px "Arial Black", "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText('KINGBO POWER', 155, 125);
    ctx.shadowBlur = 0;

    ctx.font = '700 18px "Arial", sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText('LITHIUM IRON PHOSPHATE ENERGY STORAGE TECHNOLOGY', 158, 155);

    // Card central de especificações técnicas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 195, 944, 215, 12);
    ctx.fill();
    ctx.stroke();

    // Título do modelo
    ctx.font = '900 56px "Arial Black", "Inter", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('12.8V  560Ah', 70, 265);

    ctx.font = '900 40px "Arial", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('7.168 kWh', 540, 265);

    // Subtítulo e tecnologia
    ctx.font = '600 20px "Arial", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Modelo: KINGBO MB12560  •  Química: LiFePO4 Grau A Prismático (4S)', 70, 310);

    ctx.font = '600 18px "Arial", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('JK Smart BMS Integrado 200A  •  Balanceamento Ativo 2A  •  App Bluetooth 5.0', 70, 345);

    ctx.font = '500 16px "Arial", sans-serif';
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText('≥9000 Ciclos de Vida  •  Descarga Máx: 200A Contínuos / 350A Pico  •  IP65 Heavy Duty', 70, 380);

    // Badges inferiores (CE, RoHS, UN38.3, Reciclável)
    const badges = ['CE', 'RoHS', 'UN38.3', 'ISO9001', 'LiFePO4'];
    let bx = 60;
    ctx.font = '700 13px "Arial", sans-serif';
    badges.forEach(b => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, 440, 85, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText(b, bx + 42.5, 458);
      bx += 105;
    });

    // Aviso de segurança lateral
    ctx.textAlign = 'right';
    ctx.font = '600 14px "Arial", sans-serif';
    ctx.fillStyle = '#f87171';
    ctx.fillText('⚠️ CAUTION: DO NOT SHORT CIRCUIT OR DISASSEMBLE', 970, 458);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  },

  /**
   * Gera textura ultra-detalhada da tela JK Smart BMS de 4.3" colorida
   */
  createKingboBmsScreenTexture: function(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // 1. Fundo LCD azul escuro / preto de alta fidelidade
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, 512, 320);

    // Grade de pixels LCD sutil
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 512; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 320);
      ctx.stroke();
    }

    // Moldura interna do display
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 500, 308);

    // Barra superior de status
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 8, 496, 36);

    ctx.font = '700 16px "Arial", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('JK SMART BMS 4.3" LCD', 18, 32);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('📶 BT OK  •  NORMAL', 492, 32);

    // Mostrador de Carga da Bateria (SOC %)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(18, 56, 170, 70, 8);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = '600 12px "Arial", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('SOC CAPACIDADE', 28, 76);

    ctx.font = '900 36px "Arial Black", sans-serif';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('85%', 28, 114);

    // Ícone de bateria animada
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.strokeRect(120, 82, 50, 26);
    ctx.fillRect(170, 88, 4, 14);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(123, 85, 38, 20);

    // Bloco Central de Medição: Tensão e Corrente
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(200, 56, 294, 70, 8);
    ctx.fill();

    ctx.font = '900 32px "Courier New", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('13.34 V', 215, 96);

    ctx.font = '900 24px "Courier New", monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText('+30.0 A', 370, 96);

    ctx.font = '600 12px "Arial", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('POTÊNCIA: 400.2 W   •   TEMP: 24.8°C', 215, 116);

    // Tensões Individuais das 4 Células Prismáticas LiFePO4 (4S)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(18, 136, 476, 120, 8);
    ctx.fill();

    ctx.font = '700 13px "Arial", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('MONITORAMENTO DE CÉLULAS INDIVIDUAIS (4S BALANCER)', 30, 158);

    const cells = [
      { num: 'C1', volt: '3.335V', diff: '0mV' },
      { num: 'C2', volt: '3.336V', diff: '+1mV' },
      { num: 'C3', volt: '3.334V', diff: '-1mV' },
      { num: 'C4', volt: '3.335V', diff: '0mV' }
    ];

    cells.forEach((c, idx) => {
      const cx = 30 + idx * 115;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(cx, 170, 105, 74, 6);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 12px "Arial", sans-serif';
      ctx.fillText(c.num, cx + 10, 190);

      ctx.fillStyle = '#4ade80';
      ctx.font = '900 16px "Courier New", monospace';
      ctx.fillText(c.volt, cx + 10, 214);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 11px "Courier New", monospace';
      ctx.fillText(c.diff, cx + 10, 233);
    });

    // Rodapé de proteção ativa
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.roundRect(18, 268, 476, 40, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PROTEÇÃO BMS OK  •  MOSFET ON  •  EQUILÍBRIO ATIVO 2.0A LIGADO', 256, 293);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  },

  /**
   * Gera textura para a tampa superior da bateria Kingbo 560Ah com indicação dos bornes (+ / -)
   */
  createKingboBatteryTopTexture: function(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Fundo preto fosco eletrostático
    ctx.fillStyle = '#14181f';
    ctx.fillRect(0, 0, 1024, 512);

    // Moldura e relevo dos bornes
    ctx.strokeStyle = '#27303f';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 1024 - 40, 512 - 40);

    // Círculo Borne Positivo (+)
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(200, 256, 85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(200, 256, 75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 78px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', 200, 256);

    ctx.font = '700 20px "Arial", sans-serif';
    ctx.fillStyle = '#fca5a5';
    ctx.fillText('POSITIVE (+)', 200, 370);

    // Círculo Borne Negativo (-)
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(824, 256, 85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(824, 256, 75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 90px "Arial Black", sans-serif';
    ctx.fillText('−', 824, 256);

    ctx.font = '700 20px "Arial", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('NEGATIVE (−)', 824, 370);

    // Centro da tampa: indicação técnica
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(360, 150, 304, 180, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 16px "Arial", sans-serif';
    ctx.fillText('JK SMART BMS 4.3" DISPLAY', 512, 190);

    ctx.fillStyle = '#10b981';
    ctx.font = '900 24px "Arial Black", sans-serif';
    ctx.fillText('KINGBO 560Ah', 512, 235);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 14px "Arial", sans-serif';
    ctx.fillText('12.8V • 7168Wh • 4S LiFePO4', 512, 275);

    // Parafusos M4 de fixação da tampa
    for (let x = 60; x <= 964; x += 150) {
      [40, 472].forEach(y => {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }
};

