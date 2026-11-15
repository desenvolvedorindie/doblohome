import * as THREE from 'three';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';
import { SlatBedMattressBuilder } from '../../src/three/boxes/SlatBedMattressBuilder';

// Mock document
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

const grid: InternalGridConfig = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4
};

console.log('Testing SlatBedMattressBuilder test harness ready.');
