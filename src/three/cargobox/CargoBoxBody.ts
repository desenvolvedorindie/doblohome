import * as THREE from 'three';
import { MaterialLibrary } from '../Materials';
import { TextureGenerator } from '../Textures';

export interface CargoBoxBodyParams {
  L: number;
  W: number;
  H: number;
  boxCenterZ: number;
  baseY: number;
  profileSize: number;
  waterTankDiameterMm: number;
  waterTankEnabled: boolean;
  hingeSide: 'driver' | 'passenger';
  subchassisWidth: number;
  boxGroup: THREE.Group;
  boxLidGroup: THREE.Group;
  getEmblemTexture: () => THREE.CanvasTexture;
}

export class CargoBoxBody {
  static build(params: CargoBoxBodyParams) {
    const {
      L,
      W,
      H,
      boxCenterZ,
      baseY,
      profileSize,
      waterTankDiameterMm,
      waterTankEnabled,
      hingeSide,
      subchassisWidth,
      boxGroup,
      boxLidGroup,
      getEmblemTexture
    } = params;

    const mats = MaterialLibrary.materials;
    const yBase = baseY + profileSize / 2;

    const tubH = H * 0.42; // Cuba inferior
    const lidH = H * 0.58; // Tampa superior

    const radiusM = ((waterTankDiameterMm || 200) / 2) / 1000;
    const pipeOffsetX = (subchassisWidth / 2 - profileSize) - radiusM;
    const maxInnerClearanceW = Math.max(0.80, (pipeOffsetX - radiusM) * 2 - 0.02);
    const effectiveTubW = (waterTankEnabled ?? true) ? Math.min(W * 0.96, maxInnerClearanceW) : W * 0.96;

    // --- 1. CUBA INFERIOR ---
    const tubGroup = new THREE.Group();

    const tubGeo = new THREE.BoxGeometry(effectiveTubW, tubH, L * 0.96);
    const tubMesh = new THREE.Mesh(tubGeo, mats.cargoBoxBase);
    tubMesh.position.set(0, tubH / 2, 0);
    tubMesh.castShadow = true;
    tubMesh.receiveShadow = true;
    tubMesh.userData = { isCargoBoxVolume: true, barLabel: 'Baú de Teto (Cuba Inferior)', profileSpec: `${Math.round(L * 1000)}x${Math.round(W * 1000)}x${Math.round(H * 1000)}mm` };
    tubGroup.add(tubMesh);

    const flangeGeo = new THREE.BoxGeometry(W, 0.018, L);
    const flangeMesh = new THREE.Mesh(flangeGeo, mats.cargoBoxBase);
    flangeMesh.position.set(0, tubH, 0);
    flangeMesh.castShadow = true;
    tubGroup.add(flangeMesh);

    const clampZOffsets = [-L * 0.35, L * 0.35];
    clampZOffsets.forEach(cz => {
      const uClampL = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, W * 0.18, 12), mats.stainlessHinge);
      uClampL.rotation.z = Math.PI / 2;
      uClampL.position.set(-W * 0.32, -0.01, cz);
      tubGroup.add(uClampL);

      const uClampR = uClampL.clone();
      uClampR.position.x = W * 0.32;
      tubGroup.add(uClampR);
    });

    tubGroup.position.set(0, yBase, boxCenterZ);
    boxGroup.add(tubGroup);

    // --- 2. TAMPA SUPERIOR NERVURADA ---
    boxLidGroup.position.set(
      hingeSide === 'driver' ? -W * 0.48 : W * 0.48,
      yBase + tubH,
      boxCenterZ
    );

    const lidInner = new THREE.Group();
    lidInner.position.set(hingeSide === 'driver' ? W * 0.48 : -W * 0.48, 0, 0);

    const lidShellGeo = new THREE.BoxGeometry(W * 0.98, lidH, L * 0.98);
    const lidShell = new THREE.Mesh(lidShellGeo, mats.cargoBoxShell);
    lidShell.position.set(0, lidH / 2, 0);
    lidShell.castShadow = true;
    lidShell.receiveShadow = true;
    lidShell.userData = { isCargoBoxVolume: true, barLabel: 'Baú de Teto (Tampa Superior)', profileSpec: `${Math.round(L * 1000)}x${Math.round(W * 1000)}x${Math.round(H * 1000)}mm` };
    lidInner.add(lidShell);

    const skirtGeo = new THREE.BoxGeometry(W * 1.025, 0.038, L * 1.025);
    const skirtMesh = new THREE.Mesh(skirtGeo, mats.cargoBoxShell);
    skirtMesh.position.set(0, 0.019, 0);
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    lidInner.add(skirtMesh);

    const noseGeo = new THREE.BoxGeometry(W * 0.96, lidH * 0.72, L * 0.20);
    const noseMesh = new THREE.Mesh(noseGeo, mats.cargoBoxShell);
    noseMesh.position.set(0, lidH * 0.44, -L * 0.43);
    noseMesh.rotation.x = -0.22;
    lidInner.add(noseMesh);

    const tailMesh = noseMesh.clone();
    tailMesh.position.z = L * 0.43;
    tailMesh.rotation.x = 0.22;
    lidInner.add(tailMesh);

    // Quadrantes waffle de reforço
    const ribRows = 5;
    const ribCols = 4;
    const ribPadX = (W * 0.82) / ribCols;
    const ribPadZ = (L * 0.74) / ribRows;

    for (let r = 0; r < ribRows; r++) {
      for (let c = 0; c < ribCols; c++) {
        const rx = -W * 0.41 + ribPadX * (c + 0.5);
        const rz = -L * 0.37 + ribPadZ * (r + 0.5);

        const ribBox = new THREE.Mesh(
          new THREE.BoxGeometry(ribPadX * 0.74, 0.015, ribPadZ * 0.70),
          mats.cargoBoxRib
        );
        ribBox.position.set(rx, lidH + 0.0075, rz);
        ribBox.castShadow = true;
        lidInner.add(ribBox);
      }
    }

    // Gomos verticais traseiros
    const rearRibCols = [-W * 0.38, -W * 0.24, -W * 0.09, W * 0.09, W * 0.24, W * 0.38];
    rearRibCols.forEach(rx => {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(W * 0.09, lidH * 0.75, 0.024),
        mats.cargoBoxRib
      );
      rib.position.set(rx, lidH * 0.45, L * 0.495);
      rib.castShadow = true;
      lidInner.add(rib);
    });

    // Gomos laterais
    const sideGillsCount = 5;
    const gillSpacing = (L * 0.68) / (sideGillsCount - 1);
    for (let i = 0; i < sideGillsCount; i++) {
      const gz = -L * 0.34 + i * gillSpacing;

      const gillL = new THREE.Mesh(new THREE.BoxGeometry(0.020, lidH * 0.80, 0.065), mats.cargoBoxRib);
      gillL.position.set(-W * 0.492, lidH * 0.46, gz);
      lidInner.add(gillL);

      const gillR = gillL.clone();
      gillR.position.x = W * 0.492;
      lidInner.add(gillR);
    }

    // Fechadura central
    const lockHousing = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.08, 0.025), mats.cargoBoxLatch);
    lockHousing.position.set(0, lidH * 0.22, L * 0.498);
    lidInner.add(lockHousing);

    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.05, 0.012), (mats as any).cargoBoxLock || mats.cargoBoxLatch);
    lockPlate.position.set(0, lidH * 0.20, L * 0.508);
    lidInner.add(lockPlate);

    const keyHole = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.015, 12), mats.cargoBoxLatch);
    keyHole.rotation.x = Math.PI / 2;
    keyHole.position.set(0, lidH * 0.22, L * 0.512);
    lidInner.add(keyHole);

    // Fivelas traseiras
    const rearBucklesX = [-W * 0.24, W * 0.24];
    rearBucklesX.forEach(bx => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, 0.028), mats.cargoBoxLatch);
      bMesh.position.set(bx, lidH * 0.16, L * 0.502);
      lidInner.add(bMesh);
    });

    // Fecho dianteiro
    const frontLatch = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.025), mats.cargoBoxLatch);
    frontLatch.position.set(0, lidH * 0.15, -L * 0.49);
    lidInner.add(frontLatch);

    // Fivelas laterais
    const buckleZOffsets = [-L * 0.26, 0, L * 0.26];
    buckleZOffsets.forEach(bz => {
      const bL = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.05, 0.032), mats.cargoBoxLatch);
      bL.position.set(-W * 0.495, lidH * 0.12, bz);
      lidInner.add(bL);

      const bR = bL.clone();
      bR.position.x = W * 0.495;
      lidInner.add(bR);
    });

    // Emblemas Motobul
    const emblemTex = getEmblemTexture();
    const emblemMat = new THREE.MeshBasicMaterial({
      map: emblemTex,
      transparent: true,
      side: THREE.DoubleSide
    });

    const emblemRearGeo = new THREE.PlaneGeometry(0.18, 0.09);
    const emblemRear = new THREE.Mesh(emblemRearGeo, emblemMat);
    emblemRear.position.set(-W * 0.36, lidH * 0.26, L * 0.505);
    lidInner.add(emblemRear);

    const emblemGeo = new THREE.PlaneGeometry(0.24, 0.12);
    const emblemL = new THREE.Mesh(emblemGeo, emblemMat);
    emblemL.rotation.y = -Math.PI / 2;
    emblemL.position.set(-W * 0.498, lidH * 0.45, -L * 0.25);
    lidInner.add(emblemL);

    const emblemR = new THREE.Mesh(emblemGeo, emblemMat);
    emblemR.rotation.y = Math.PI / 2;
    emblemR.position.set(W * 0.498, lidH * 0.45, -L * 0.25);
    lidInner.add(emblemR);

    boxLidGroup.add(lidInner);
    boxGroup.add(boxLidGroup);
  }
}
