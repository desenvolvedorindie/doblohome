import * as THREE from 'three';

export class BatteryTextures {
  /**
   * Gera textura frontal serigrafada oficial da Bateria Kingbo Power LiFePO4 560Ah
   */
  static createKingboBatteryFrontTexture(): THREE.CanvasTexture {
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
  }

  /**
   * Gera textura ultra-detalhada da tela JK Smart BMS de 4.3" colorida
   */
  static createKingboBmsScreenTexture(): THREE.CanvasTexture {
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
  }

  /**
   * Gera textura para a tampa superior da bateria Kingbo 560Ah com indicação dos bornes (+ / -)
   */
  static createKingboBatteryTopTexture(): THREE.CanvasTexture {
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
}
