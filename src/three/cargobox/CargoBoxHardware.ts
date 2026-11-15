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
   * Constrói uma dobradiça industrial reforçada em aço inox 304
   */
  static buildStainlessHinge(x: number, y: number, z: number, targetGroup: THREE.Group) {
    const mats = MaterialLibrary.materials;
    const hinge = new THREE.Group();

    // Pino cilíndrico central
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.08, 16), mats.stainlessHinge);
    pin.rotation.x = Math.PI / 2;
    hinge.add(pin);

    // Folha inferior fixa no subchassi
    const leafLower = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.004, 0.07), mats.stainlessHinge);
    leafLower.position.set(-0.015 * Math.sign(x), -0.004, 0);
    hinge.add(leafLower);

    hinge.position.set(x, y, z);
    targetGroup.add(hinge);
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
