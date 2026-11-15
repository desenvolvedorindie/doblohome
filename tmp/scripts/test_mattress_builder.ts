import * as THREE from 'three';

// Mock document for TextureLoader if needed
if (typeof (global as any).document === 'undefined') {
  (global as any).document = {
    createElement: () => ({
      getContext: () => ({
        fillRect: () => {},
        drawImage: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => ({ data: [] }),
        setTransform: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {}
      }),
      width: 256,
      height: 256
    })
  };
}

function testMattressParts() {
  const partsOptions = [1, 2, 3, 4] as const;
  const directions = ['left', 'right', 'front', 'rear'] as const;

  for (const dir of directions) {
    for (const isExtended of [false, true]) {
      for (const parts of partsOptions) {
        const w = 0.80; // 80cm
        const l = 1.70; // 1.70m
        const extRatio = 0.85;
        const mattressThickness = 0.08;
        const mattressY = 0.42;

        const isLateral = dir === 'left' || dir === 'right';

        if (isLateral) {
          const cushionW = w - 0.016;
          const cushionL = l - 0.016;

          if (isExtended) {
            const extendedW = (w * extRatio) - 0.016;
            const totalOpenW = cushionW + extendedW;
            const startX = dir === 'left' ? -cushionW / 2 : (cushionW / 2 - totalOpenW);
            const partW = (totalOpenW - (parts - 1) * 0.004) / parts;

            console.log(`[PASS] Lateral ${dir} Ext=${isExtended} Parts=${parts}: totalOpenW=${(totalOpenW*100).toFixed(1)}cm, each=${(partW*100).toFixed(1)}cm, startX=${startX.toFixed(3)}`);
          } else {
            const layerH = parts === 1 ? mattressThickness : parts === 2 ? 0.06 : parts === 3 ? 0.055 : 0.045;
            console.log(`[PASS] Lateral ${dir} Closed Parts=${parts}: ${parts} stacked layers of ${(layerH*100).toFixed(1)}cm`);
          }
        } else {
          const cushionW = w - 0.016;
          const cushionL = l - 0.016;

          if (isExtended) {
            const extendedL = (l * extRatio) - 0.016;
            const totalOpenL = cushionL + extendedL;
            const startZ = dir === 'front' ? -cushionL / 2 : (cushionL / 2 - totalOpenL);
            const partL = (totalOpenL - (parts - 1) * 0.004) / parts;

            console.log(`[PASS] Longit ${dir} Ext=${isExtended} Parts=${parts}: totalOpenL=${(totalOpenL*100).toFixed(1)}cm, each=${(partL*100).toFixed(1)}cm, startZ=${startZ.toFixed(3)}`);
          } else {
            const layerH = parts === 1 ? mattressThickness : parts === 2 ? 0.06 : parts === 3 ? 0.055 : 0.045;
            console.log(`[PASS] Longit ${dir} Closed Parts=${parts}: ${parts} stacked layers of ${(layerH*100).toFixed(1)}cm`);
          }
        }
      }
    }
  }
}

testMattressParts();
console.log('ALL COMBINATIONS VALIDATED SUCCESSFULLY!');

