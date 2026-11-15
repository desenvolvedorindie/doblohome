import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MetalonTubeFactory } from '../src/three/MetalonTube';
import { getMetalonGauge, getSteelProfileSpec } from '../src/types';
import { BaseRackBuilder } from '../src/three/BaseRackBuilder';
import { SolarTrayBuilder } from '../src/three/SolarTrayBuilder';
import { SpacerPostsBuilder } from '../src/three/SpacerPosts';
import { CargoBoxSystem } from '../src/three/CargoBox';

describe('Metalon Tubular Paramétrico (Alumínio & Ferro Oco)', () => {
  it('1. Deve gerar Shape 2D com cavidade interna (furo) proporcional à espessura de parede', () => {
    const size = 0.040;
    const thickness = 0.002; // 2.0 mm
    const shape = MetalonTubeFactory.buildTubeShape(size, size, thickness);

    expect(shape).toBeDefined();
    expect(shape.holes.length).toBe(1);

    // O furo central do tubo deve existir
    const hole = shape.holes[0];
    expect(hole).toBeInstanceOf(THREE.Path);
    expect(hole.curves.length).toBeGreaterThan(0);
  });

  it('2. Deve limitar espessura de parede para evitar colapso da geometria interna', () => {
    const size = 0.030;
    const excessiveThickness = 0.025; // 25mm em tubo de 30mm excederia metade do tubo
    const shape = MetalonTubeFactory.buildTubeShape(size, size, excessiveThickness);

    expect(shape.holes.length).toBe(1);
    expect(shape.holes[0].curves.length).toBeGreaterThan(0);
  });

  it('3. Deve criar BufferGeometry 3D extrudada correta com dimensões físicas exatas e normais válidas', () => {
    const length = 2.20;
    const size = 0.040;
    const thickness = 0.002;

    const geoZ = MetalonTubeFactory.getTubeGeometry(length, size, size, thickness, 'z');
    expect(geoZ.boundingBox).toBeDefined();
    const bbZ = geoZ.boundingBox!;
    expect(bbZ.max.z - bbZ.min.z).toBeCloseTo(length, 3);
    expect(bbZ.max.x - bbZ.min.x).toBeCloseTo(size, 3);
    expect(bbZ.max.y - bbZ.min.y).toBeCloseTo(size, 3);

    // Eixo X
    const geoX = MetalonTubeFactory.getTubeGeometry(1.32, size, size, thickness, 'x');
    const bbX = geoX.boundingBox!;
    expect(bbX.max.x - bbX.min.x).toBeCloseTo(1.32, 3);
    expect(bbX.max.y - bbX.min.y).toBeCloseTo(size, 3);
    expect(bbX.max.z - bbX.min.z).toBeCloseTo(size, 3);

    // Eixo Y
    const geoY = MetalonTubeFactory.getTubeGeometry(0.50, size, size, thickness, 'y');
    const bbY = geoY.boundingBox!;
    expect(bbY.max.y - bbY.min.y).toBeCloseTo(0.50, 3);
    expect(bbY.max.x - bbY.min.x).toBeCloseTo(size, 3);
    expect(bbY.max.z - bbY.min.z).toBeCloseTo(size, 3);
  });

  it('4. Deve criar Mesh completo com hitbox invisível para raycasting preciso', () => {
    const mat = new THREE.MeshBasicMaterial();
    const mesh = MetalonTubeFactory.createTubeMesh(1.50, mat, { axis: 'z', size: 0.040, thickness: 0.0015 });

    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);

    const hitbox = mesh.getObjectByName('__hitbox') as THREE.Mesh;
    expect(hitbox).toBeDefined();
    expect(hitbox.geometry).toBeInstanceOf(THREE.BoxGeometry);
  });

  it('5. getMetalonGauge deve mapear espessuras comerciais brasileiras corretamente', () => {
    expect(getMetalonGauge(0.9)).toBe('#20 (0.9mm)');
    expect(getMetalonGauge(1.2)).toBe('#18 (1.2mm)');
    expect(getMetalonGauge(1.5)).toBe('#16 (1.5mm)');
    expect(getMetalonGauge(2.0)).toBe('#14 (2.0mm)');
    expect(getMetalonGauge(2.25)).toBe('#13 (2.25mm)');
    expect(getMetalonGauge(2.65)).toBe('#12 (2.65mm)');
    expect(getMetalonGauge(3.0)).toBe('#1/8" (3.0mm)');
  });

  it('6. getSteelProfileSpec deve incluir espessura e bitola formatadas', () => {
    expect(getSteelProfileSpec(40, 'mm', 2.0)).toBe('Metalon 40×40 × 2.0mm');
    expect(getSteelProfileSpec(30, 'mm', 1.5)).toBe('Metalon 30×30 × 1.5mm');
    expect(getSteelProfileSpec(40, 'inch', 2.0)).toBe('Metalon 1 ½" × 1 ½" × 2.0mm (#14 (2.0mm))');
    expect(getSteelProfileSpec(30, 'inch', 1.5)).toBe('Metalon 1 ¼" × 1 ¼" × 1.5mm (#16 (1.5mm))');
  });

  it('7. BaseRackBuilder deve construir o rack com tubo oco e especificar a espessura no profileSpec', () => {
    const group = new THREE.Group();
    const rackMeshes: THREE.Mesh[] = [];
    const aluBrackets = new THREE.Group();
    const weldGussets = new THREE.Group();

    BaseRackBuilder.buildBaseRack(
      group,
      rackMeshes,
      aluBrackets,
      weldGussets,
      { trayLength: 1.08 },
      0.40,
      2.10,
      'steel',
      'silver',
      false,
      2.06,
      'mm',
      2.0 // 2.0mm
    );

    expect(rackMeshes.length).toBeGreaterThan(0);
    const longBar = rackMeshes[0];
    expect(longBar.userData.profileSpec).toContain('40×40');
    expect(longBar.userData.profileSpec).toContain('2.0mm');
    expect(longBar.geometry).toBeInstanceOf(THREE.ExtrudeGeometry);
  });

  it('8. SolarTrayBuilder deve construir bandejas com tubos ocos 30x30 e espessura configurada', () => {
    const group = new THREE.Group();
    const dims = SolarTrayBuilder.calculateTrayDimensions(2, 'longitudinal');

    SolarTrayBuilder.buildTrayLevel(
      group,
      dims,
      0,
      2.15,
      0.40,
      1,
      'Nível 1 (Bandeja)',
      'aluminum_tube',
      'black',
      0.003,
      { width: 0.60, length: 1.00 },
      'mm',
      1.5 // 1.5mm
    );

    const tray = group.children[0] as THREE.Group;
    expect(tray).toBeDefined();

    // Encontra barra do quadro da bandeja
    const bar = tray.children.find((c: any) => c.userData?.isBar) as THREE.Mesh;
    expect(bar).toBeDefined();
    expect(bar.userData.profileSpec).toContain('30x30x1.5mm');
    expect(bar.geometry).toBeInstanceOf(THREE.ExtrudeGeometry);
  });

  it('9. SpacerPostsBuilder deve construir torres e travessas com tubos ocos', () => {
    const group = new THREE.Group();

    SpacerPostsBuilder.addSpacerPosts(
      group,
      1.28,
      1.08,
      2.10,
      2.25,
      0.40,
      'steel',
      'silver',
      'mm',
      1.8 // 1.8mm
    );

    const bars = group.children.filter((c: any) => c.userData?.isBar) as THREE.Mesh[];
    expect(bars.length).toBeGreaterThan(0);
    expect(bars[0].userData.profileSpec).toContain('1.8mm');
    expect(bars[0].geometry).toBeInstanceOf(THREE.ExtrudeGeometry);
  });

  it('10. CargoBoxSystem deve aplicar espessuras configuradas de metalon no subchassi', () => {
    const cargoBox = new CargoBoxSystem(
      {
        enabled: true,
        length: 1750,
        width: 820,
        height: 330,
        volumeLiters: 400,
        tiltAngleDeg: 45,
        lidAngleDeg: 60,
        isTilted: false,
        isLidOpen: false,
        verticalLiftMm: 0,
        isTelescopic: true,
        hingeSide: 'driver'
      },
      2.06,
      0.40,
      'steel',
      'silver',
      'mm',
      false,
      200,
      2.5, // 40x40 thickness: 2.5mm
      1.8  // 30x30 thickness: 1.8mm
    );

    const bars: THREE.Mesh[] = [];
    cargoBox.subchassisGroup.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isBar) bars.push(obj);
    });

    expect(bars.length).toBeGreaterThan(0);
    const subchassisLong = bars.find(b => b.userData.barLabel?.includes('Longarina'));
    expect(subchassisLong).toBeDefined();
    expect(subchassisLong!.userData.profileSpec).toContain('2.5mm');
    expect(subchassisLong!.geometry).toBeInstanceOf(THREE.ExtrudeGeometry);
  });

  it('11. MetalonTubeFactory.getPvcPipeGeometry deve gerar tubo cilíndrico oco com espessura de parede e furo passante', () => {
    const length = 1.885;
    const diameter = 0.200; // Ø200mm
    const wallThickness = 0.0042; // 4.2mm

    const geo = MetalonTubeFactory.getPvcPipeGeometry(length, diameter, wallThickness, 'z', 32);
    expect(geo).toBeInstanceOf(THREE.ExtrudeGeometry);
    expect(geo.boundingBox).toBeDefined();

    const bb = geo.boundingBox!;
    expect(bb.max.z - bb.min.z).toBeCloseTo(length, 3);
    expect(bb.max.x - bb.min.x).toBeCloseTo(diameter, 3);
    expect(bb.max.y - bb.min.y).toBeCloseTo(diameter, 3);

    // Deve ser uma geometria com cavidade oca (buraco interno no shape)
    const shape = (geo as THREE.ExtrudeGeometry).parameters.shapes as THREE.Shape;
    expect(shape).toBeDefined();
    expect(shape.holes.length).toBe(1);
    expect(shape.holes[0]).toBeInstanceOf(THREE.Path);
  });

  it('12. MetalonTubeFactory.createPvcElbowMesh deve gerar Joelho 90° com bolsas reforçadas e hitbox', () => {
    const mat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const elbow = MetalonTubeFactory.createPvcElbowMesh(0.200, mat);

    expect(elbow).toBeInstanceOf(THREE.Group);
    expect(elbow.name).toBe('PvcElbow90Mesh');

    const hitbox = elbow.getObjectByName('__pvc_hitbox');
    expect(hitbox).toBeDefined();
    expect((hitbox as THREE.Mesh).geometry).toBeInstanceOf(THREE.BoxGeometry);

    // Deve conter meshes do cotovelo e das duas bolsas reforçadas
    const meshes: THREE.Mesh[] = [];
    elbow.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name !== '__pvc_hitbox') {
        meshes.push(child as THREE.Mesh);
      }
    });
    expect(meshes.length).toBeGreaterThanOrEqual(3);
  });

  it('13. MetalonTubeFactory.createPvcCapMesh deve gerar CAP Tampão com domo abaulado, dreno em latão e hitbox', () => {
    const mat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const cap = MetalonTubeFactory.createPvcCapMesh(0.200, mat);

    expect(cap).toBeInstanceOf(THREE.Group);
    expect(cap.name).toBe('PvcCapMesh');

    const hitbox = cap.getObjectByName('__pvc_hitbox');
    expect(hitbox).toBeDefined();
    expect((hitbox as THREE.Mesh).geometry).toBeInstanceOf(THREE.BoxGeometry);

    // Deve conter corpo cilíndrico, domo abaulado, anel reforçado e bujão de dreno em latão
    const meshes: THREE.Mesh[] = [];
    cap.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name !== '__pvc_hitbox') {
        meshes.push(child as THREE.Mesh);
      }
    });
    expect(meshes.length).toBeGreaterThanOrEqual(4);
  });
});
