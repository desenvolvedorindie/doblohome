import * as THREE from 'three';

export class MetalTextures {
  /**
   * Gera textura de alumínio escovado para perfis estruturais e corrediças
   */
  static createBrushedMetalTexture(): THREE.CanvasTexture {
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
  }

  /**
   * Gera textura de perfil de extrusão de alumínio anodizado
   */
  static createExtrusionMetalTexture(isBlack: boolean = true): THREE.CanvasTexture {
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
  }

  /**
   * Gera textura de tubo estrutural de aço carbono (Metalon)
   */
  static createMetalonSteelTexture(): THREE.CanvasTexture {
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
  }
}
