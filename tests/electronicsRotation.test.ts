import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { BoxElectronicsBuilder } from '../src/three/boxes/BoxElectronicsBuilder';
import { InternalBoxItem } from '../src/types';
import { MaterialLibrary } from '../src/three/Materials';

describe('Electronics Rotation in 3D', () => {
  it('checks Usina rotation in 3D for bottom and all wall faces', () => {
    MaterialLibrary.materials = MaterialLibrary.materials || {};
    MaterialLibrary.materials.usinaCase = new THREE.MeshBasicMaterial();
    MaterialLibrary.materials.usinaFace = new THREE.MeshBasicMaterial();
    MaterialLibrary.materials.usinaCooler = new THREE.MeshBasicMaterial();
    MaterialLibrary.materials.usinaDisplay = new THREE.MeshBasicMaterial();
    MaterialLibrary.materials.usinaBrassTerminal = new THREE.MeshBasicMaterial();
    MaterialLibrary.materials.weldedSteelMetalon = new THREE.MeshBasicMaterial();

    const builder = new BoxElectronicsBuilder();
    const faces = ['bottom', 'rear_wall', 'front_wall', 'left_wall', 'right_wall'] as const;

    faces.forEach(face => {
      const container0 = new THREE.Group();
      const box0: InternalBoxItem = {
        id: 'box-1',
        name: 'Box 1',
        type: 'cabinet',
        x: 0,
        z: 0,
        widthGrid: 1,
        depthGrid: 1,
        heightMm: 500,
        color: '#fff',
        material: 'plywood',
        electronics: [
          { id: 'usina', mountFace: face, position: 'center', rotationDeg: 0 }
        ]
      };
      builder.buildBoxElectronics(container0, 0.6, 0.6, 0.5, box0, false);
      const obj0 = container0.getObjectByName('Installed_usina_box-1');
      expect(obj0).toBeDefined();
      const content0 = obj0?.getObjectByName('Content');
      expect(content0).toBeDefined();

      const container90 = new THREE.Group();
      const box90: InternalBoxItem = {
        ...box0,
        electronics: [
          { id: 'usina', mountFace: face, position: 'center', rotationDeg: 90 }
        ]
      };
      builder.buildBoxElectronics(container90, 0.6, 0.6, 0.5, box90, false);
      const obj90 = container90.getObjectByName('Installed_usina_box-1');
      expect(obj90).toBeDefined();
      const content90 = obj90?.getObjectByName('Content');
      expect(content90).toBeDefined();

      if (face === 'bottom') {
        expect(content0?.rotation.y).toBe(0);
        expect(content90?.rotation.y).toBeCloseTo(Math.PI / 2, 4);
      } else {
        expect(Math.abs(content90!.rotation.z)).toBeCloseTo(Math.PI / 2, 4);
      }
    });
  });
});
