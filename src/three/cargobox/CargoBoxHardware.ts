import * as THREE from 'three';
import { MaterialLibrary } from '../Materials';

export interface GasStrutRuntime {
  lowerAnchor: THREE.Vector3;
  upperLocalAnchor: THREE.Vector3;
  cylinderMesh: THREE.Mesh;
  rodMesh: THREE.Mesh;
  group: THREE.Group;
}

export class CargoBoxHardware {
  /**
   * Constrói uma dobradiça industrial reforçada em aço inox 304 posicionada na face externa
   * da junção entre a torre vertical e a longarina do rack basculante (sem enterrar dentro do perfil).
   * - Aba inferior + 3 gomos + pino externo ficam fixos no subchassi (`targetGroup`)
   * - Aba superior fica no grupo móvel (`upperTargetGroup`), acompanhando o basculamento do rack
   */
  static buildStainlessHinge(
    x: number,
    y: number,
    z: number,
    targetGroup: THREE.Group,
    options: {
      outwardSign?: number;
      profileSize?: number;
      isTelescopic?: boolean;
      upperTargetGroup?: THREE.Group;
    } = {}
  ) {
    const mats = MaterialLibrary.materials;
    const hingeMat = mats.stainlessHinge || new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.94, roughness: 0.22 });
    const boltMat = mats.allenScrew || hingeMat;

    const outwardSign = options.outwardSign ?? (x < 0 ? -1 : 1);
    const pSize = options.profileSize ?? 0.04;
    const isTelescopic = options.isTelescopic ?? false;
    const upperTarget = options.upperTargetGroup || targetGroup;

    const leafThick = 0.004;
    const leafLenZ = 0.072;
    const lowerLeafH = 0.044;
    const upperLeafH = 0.036;
    const barrelRadius = 0.006;

    // Face externa do perfil 40x40 e eixo externo do pino da dobradiça
    const outerFaceX = x + outwardSign * (pSize / 2);
    const pinX = outerFaceX + outwardSign * barrelRadius;
    const seamY = y - pSize / 2;

    // ─── 1. Parte Fixa (na torre / subchassi) ───────────────────────────────
    const lowerGroup = new THREE.Group();
    lowerGroup.name = 'StainlessHinge_Lower';

    // Aba inferior encostada na face externa da torre (para baixo da emenda)
    const lowerLeafX = outerFaceX + outwardSign * (leafThick / 2);
    const lowerLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(leafThick, lowerLeafH, leafLenZ),
      hingeMat
    );
    lowerLeaf.position.set(lowerLeafX, seamY - lowerLeafH / 2, z);
    lowerLeaf.castShadow = true;
    lowerGroup.add(lowerLeaf);

    // Calço espaçador de 5mm quando torre telescópica (tubo interno 30x30 dentro de camisa 40x40)
    if (isTelescopic) {
      const shimThick = 0.005;
      const shim = new THREE.Mesh(
        new THREE.BoxGeometry(shimThick, lowerLeafH - 0.004, leafLenZ - 0.006),
        hingeMat
      );
      shim.position.set(outerFaceX - outwardSign * (shimThick / 2), seamY - lowerLeafH / 2, z);
      lowerGroup.add(shim);
    }

    // Parafusos inox na aba inferior
    [-0.022, 0.022].forEach((zOff) => {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 12), boltMat);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(lowerLeafX + outwardSign * (leafThick / 2 + 0.0012), seamY - lowerLeafH * 0.55, z + zOff);
      lowerGroup.add(bolt);
    });

    // Pino cilíndrico central externo
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0038, 0.0038, leafLenZ + 0.008, 16),
      boltMat
    );
    pin.rotation.x = Math.PI / 2;
    pin.position.set(pinX, seamY, z);
    pin.castShadow = true;
    lowerGroup.add(pin);

    // 3 gomos (knuckles) ao longo do pino
    const knuckleLen = leafLenZ / 3 - 0.0015;
    [-leafLenZ / 3, 0, leafLenZ / 3].forEach((zOff, idx) => {
      const knuckle = new THREE.Mesh(
        new THREE.CylinderGeometry(barrelRadius, barrelRadius, knuckleLen, 16),
        hingeMat
      );
      knuckle.rotation.x = Math.PI / 2;
      knuckle.position.set(pinX, seamY, z + zOff);
      knuckle.castShadow = true;
      // Gomo central na aba superior; pontas na aba inferior
      if (idx === 1) {
        upperTarget.add(knuckle);
      } else {
        lowerGroup.add(knuckle);
      }
    });

    targetGroup.add(lowerGroup);

    // ─── 2. Parte Móvel (aba superior fixa na face externa da longarina do rack) ───
    const upperGroup = new THREE.Group();
    upperGroup.name = 'StainlessHinge_Upper';

    const upperLeafX = outerFaceX + outwardSign * (leafThick / 2);
    const upperLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(leafThick, upperLeafH, leafLenZ),
      hingeMat
    );
    upperLeaf.position.set(upperLeafX, seamY + upperLeafH / 2, z);
    upperLeaf.castShadow = true;
    upperGroup.add(upperLeaf);

    // Parafusos inox na aba superior
    [-0.022, 0.022].forEach((zOff) => {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 12), boltMat);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(upperLeafX + outwardSign * (leafThick / 2 + 0.0012), seamY + upperLeafH * 0.52, z + zOff);
      upperGroup.add(bolt);
    });

    upperTarget.add(upperGroup);
  }

  /**
   * Constrói fecho rápido de compressão (Toggle Clamp) com manopla de vinil vermelho
   */
  static buildToggleClamp(x: number, y: number, z: number, outwardSign: number, targetGroup: THREE.Group) {
    const mats = MaterialLibrary.materials;
    const clamp = new THREE.Group();

    // Base fixa de ancoragem
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.035), mats.toggleClamp);
    base.position.set(0, -0.02, 0);
    clamp.add(base);

    // Braço de pressão articulado
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.008, 0.02), mats.toggleClamp);
    arm.position.set(outwardSign * 0.015, 0.01, 0);
    clamp.add(arm);

    // Manopla vermelha de trava
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.05, 12), mats.toggleClampGrip);
    handle.position.set(outwardSign * 0.025, 0.035, 0);
    handle.rotation.z = outwardSign * 0.4;
    clamp.add(handle);

    clamp.position.set(x + outwardSign * 0.025, y, z);
    targetGroup.add(clamp);
  }

  /**
   * Constrói os Pistões a Gás (amortecedores) dinâmicos
   */
  static buildGasStruts(
    pivotElevationY: number,
    pivotX: number,
    boxCenterZ: number,
    boxL: number,
    baseY: number,
    profileSize: number,
    hingeSide: 'driver' | 'passenger',
    subchassisGroup: THREE.Group,
    gasStrutsGroup: THREE.Group
  ): GasStrutRuntime[] {
    const mats = MaterialLibrary.materials;
    const isDriverHinge = (hingeSide === 'driver');
    const hingeSideSign = isDriverHinge ? -1 : 1;
    const strutLowerX = pivotX - hingeSideSign * 0.03;
    const strutUpperRelX = pivotX - hingeSideSign * 0.38;

    const strutHalfZ = Math.min(boxL * 0.32, 0.55);
    const strutZOffsets = [boxCenterZ - strutHalfZ, boxCenterZ + strutHalfZ];
    const struts: GasStrutRuntime[] = [];

    strutZOffsets.forEach((sz, idx) => {
      const strutGroup = new THREE.Group();
      strutGroup.name = `GasStrut_${idx}`;

      const lowerAnchorY = Math.max(baseY + profileSize + 0.02, pivotElevationY - 0.34);
      const lowerAnchor = new THREE.Vector3(strutLowerX, lowerAnchorY, sz);
      const upperLocalAnchor = new THREE.Vector3(strutUpperRelX, pivotElevationY, sz);

      // Terminal inferior (olhal esférico)
      const lowerEyelet = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), mats.gasStrutMount);
      lowerEyelet.position.copy(lowerAnchor);
      subchassisGroup.add(lowerEyelet);

      // Cilindro (corpo do pistão)
      const cylGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 16);
      cylGeo.translate(0, 0.14, 0);
      const cylMesh = new THREE.Mesh(cylGeo, mats.gasStrutCylinder);
      cylMesh.castShadow = true;
      strutGroup.add(cylMesh);

      // Haste cromada telescópica
      const rodGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.26, 16);
      rodGeo.translate(0, 0.13, 0);
      const rodMesh = new THREE.Mesh(rodGeo, mats.gasStrutRod);
      rodMesh.castShadow = true;
      strutGroup.add(rodMesh);

      gasStrutsGroup.add(strutGroup);

      struts.push({
        lowerAnchor,
        upperLocalAnchor,
        cylinderMesh: cylMesh,
        rodMesh: rodMesh,
        group: strutGroup
      });
    });

    return struts;
  }

  /**
   * Atualiza dinamicamente os amortecedores a gás acompanhando o basculamento do rack
   */
  static updateGasStruts(
    struts: GasStrutRuntime[],
    tiltRad: number,
    hingeSide: 'driver' | 'passenger',
    pivotX: number,
    pivotElevationY: number
  ) {
    if (struts.length === 0) return;
    const isDriverHinge = (hingeSide === 'driver');

    struts.forEach(st => {
      const relX = st.upperLocalAnchor.x - pivotX;
      const relY = st.upperLocalAnchor.y - pivotElevationY;

      const rotAngle = isDriverHinge ? tiltRad : -tiltRad;
      const cosA = Math.cos(rotAngle);
      const sinA = Math.sin(rotAngle);

      const rotatedX = pivotX + (relX * cosA - relY * sinA);
      const rotatedY = pivotElevationY + (relX * sinA + relY * cosA);
      const currentUpper = new THREE.Vector3(rotatedX, rotatedY, st.upperLocalAnchor.z);

      const dir = new THREE.Vector3().subVectors(currentUpper, st.lowerAnchor);
      const dist = dir.length();
      dir.normalize();

      st.group.position.copy(st.lowerAnchor);

      const upAxis = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(upAxis, dir);
      st.group.quaternion.copy(quat);

      const cylLen = Math.max(0.28, dist * 0.55);
      st.cylinderMesh.scale.set(1, cylLen / 0.28, 1);
      const rodLen = Math.max(0.04, dist - cylLen);
      st.rodMesh.position.set(0, cylLen, 0);
      st.rodMesh.scale.set(1, rodLen / 0.26, 1);
    });
  }
}
