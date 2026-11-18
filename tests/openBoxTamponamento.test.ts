import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ChestBuilder } from '../src/three/boxes/ChestBuilder';
import { InternalBoxItem } from '../src/types';

describe('Open Box (Nicho Aberto) Tamponamento and Joint Styles', () => {
  const chestBuilder = new ChestBuilder();
  const mat = new THREE.MeshBasicMaterial();

  it('correctly discounts top panel height so side walls do not overlap top in top_bottom_cap', () => {
    const container = new THREE.Group();
    const w = 0.5; // 500mm
    const l = 0.8; // 800mm
    const h = 0.4; // 400mm
    const t = 0.015; // 15mm

    const box: InternalBoxItem = {
      id: 'open-1',
      name: 'Nicho Teste',
      type: 'open',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      heightMm: 400,
      boxJointStyle: 'top_bottom_cap',
      panels: {
        top: true,
        bottom: false,
        left: true,
        right: true,
        front: false,
        rear: true
      }
    };

    chestBuilder.buildChestModule(container, w, l, h, mat, box, false, false);

    // Find panels
    const panels: THREE.Mesh[] = [];
    container.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.userData && obj.userData.partType) {
        panels.push(obj);
      }
    });

    const topPanel = panels.find((p) => p.userData.partType === 'top');
    const leftPanel = panels.find((p) => p.userData.partType === 'left');
    const rightPanel = panels.find((p) => p.userData.partType === 'right');

    expect(topPanel).toBeDefined();
    expect(leftPanel).toBeDefined();
    expect(rightPanel).toBeDefined();

    // Top panel geometry: width should be w (covers the walls), height is t
    const topGeo = topPanel!.geometry as THREE.BoxGeometry;
    expect(topGeo.parameters.width).toBeCloseTo(w, 4);
    expect(topGeo.parameters.height).toBeCloseTo(t, 4);
    expect(topPanel!.position.y).toBeCloseTo(h / 2 - t / 2, 4);

    // Left and Right walls: height must be h - t (385mm), NOT h (400mm)!
    const leftGeo = leftPanel!.geometry as THREE.BoxGeometry;
    expect(leftGeo.parameters.height).toBeCloseTo(h - t, 4);

    // Top edge of left wall must be at h/2 - t
    const leftTopY = leftPanel!.position.y + leftGeo.parameters.height / 2;
    expect(leftTopY).toBeCloseTo(h / 2 - t, 4);

    // Bottom edge of top panel is at h/2 - t
    const topBottomY = topPanel!.position.y - topGeo.parameters.height / 2;
    expect(topBottomY).toBeCloseTo(h / 2 - t, 4);

    // Zero overlap in Y between side walls and top panel!
    expect(leftTopY).toBeLessThanOrEqual(topBottomY + 0.0001);
  });

  it('correctly sets top panel width to innerW between side walls in sides_outside', () => {
    const container = new THREE.Group();
    const w = 0.5; // 500mm
    const l = 0.8; // 800mm
    const h = 0.4; // 400mm
    const t = 0.015; // 15mm

    const box: InternalBoxItem = {
      id: 'open-2',
      name: 'Nicho Sides Outside',
      type: 'open',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      heightMm: 400,
      boxJointStyle: 'sides_outside',
      panels: {
        top: true,
        bottom: false,
        left: true,
        right: true,
        front: false,
        rear: true
      }
    };

    chestBuilder.buildChestModule(container, w, l, h, mat, box, false, false);

    const panels: THREE.Mesh[] = [];
    container.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.userData && obj.userData.partType) {
        panels.push(obj);
      }
    });

    const topPanel = panels.find((p) => p.userData.partType === 'top');
    const leftPanel = panels.find((p) => p.userData.partType === 'left');
    const rightPanel = panels.find((p) => p.userData.partType === 'right');

    expect(topPanel).toBeDefined();
    expect(leftPanel).toBeDefined();
    expect(rightPanel).toBeDefined();

    // In sides_outside, side walls are full height h (400mm)
    const leftGeo = leftPanel!.geometry as THREE.BoxGeometry;
    expect(leftGeo.parameters.height).toBeCloseTo(h, 4);

    // Top panel width MUST be innerW = w - 2*t (470mm), NOT full w (500mm)!
    const topGeo = topPanel!.geometry as THREE.BoxGeometry;
    expect(topGeo.parameters.width).toBeCloseTo(w - 2 * t, 4);

    // Top panel X range:
    const topMinX = topPanel!.position.x - topGeo.parameters.width / 2;
    const topMaxX = topPanel!.position.x + topGeo.parameters.width / 2;

    // Left wall inner edge is at w/2 - t
    const leftInnerX = leftPanel!.position.x - leftGeo.parameters.width / 2;
    expect(topMaxX).toBeCloseTo(leftInnerX, 4);

    // Right wall inner edge is at -w/2 + t
    const rightGeo = rightPanel!.geometry as THREE.BoxGeometry;
    const rightInnerX = rightPanel!.position.x + rightGeo.parameters.width / 2;
    expect(topMinX).toBeCloseTo(rightInnerX, 4);

    // Zero overlap in X between top panel and side walls!
    expect(topMaxX).toBeLessThanOrEqual(leftInnerX + 0.0001);
    expect(topMinX).toBeGreaterThanOrEqual(rightInnerX - 0.0001);
  });
});
