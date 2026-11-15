import * as THREE from 'three';

export class SpriteTextures {
  /**
   * Cria um Sprite 3D de cota ou texto informativo
   */
  static createDimensionSprite(
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
  }

  /**
   * Gera textura com o emblema oficial "MOTOBUL OFF ROAD" idêntico ao baú da foto
   */
  static createMotobulEmblemTexture(): THREE.CanvasTexture {
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
  }
}
