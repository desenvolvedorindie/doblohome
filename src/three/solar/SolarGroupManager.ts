import * as THREE from 'three';

export class SolarGroupManager {
  static createGroups(solar: any) {
    solar.fixedFrameGroup = new THREE.Group();
    solar.upperLayerGroup = new THREE.Group();
    solar.slidingLayerGroup1 = new THREE.Group();
    solar.slidingLayerGroup2 = new THREE.Group();
    solar.slidingLayerGroup3 = new THREE.Group();
    solar.intermediateRailsGroup1 = new THREE.Group();
    solar.intermediateRailsGroup2 = new THREE.Group();
    solar.intermediateRailsGroup3 = new THREE.Group();
    solar.intermediateRailsGroup4 = new THREE.Group();
    solar.dimensionsGroup = new THREE.Group();
    solar.cableChainGroup = new THREE.Group();
    solar.batteryGroup = new THREE.Group();
    solar.weldGussetsGroup = new THREE.Group();
    solar.aluminumBracketsGroup = new THREE.Group();
    solar.mpptGroup = new THREE.Group();
    solar.b2bGroup = new THREE.Group();
    solar.usinaGroup = new THREE.Group();
    solar.waterTankGroup = new THREE.Group();
    solar.waterTankGroup.name = "WaterTankPipesGroup";

    solar.solarSuperstructureGroup = new THREE.Group();
    solar.solarSuperstructureGroup.name = "SolarSuperstructure";

    solar.solarSuperstructureGroup.add(solar.fixedFrameGroup);
    solar.solarSuperstructureGroup.add(solar.upperLayerGroup);
    solar.solarSuperstructureGroup.add(solar.slidingLayerGroup1);
    solar.solarSuperstructureGroup.add(solar.slidingLayerGroup2);
    solar.solarSuperstructureGroup.add(solar.slidingLayerGroup3);
    solar.solarSuperstructureGroup.add(solar.intermediateRailsGroup1);
    solar.solarSuperstructureGroup.add(solar.intermediateRailsGroup2);
    solar.solarSuperstructureGroup.add(solar.intermediateRailsGroup3);
    solar.solarSuperstructureGroup.add(solar.intermediateRailsGroup4);
    solar.solarSuperstructureGroup.add(solar.dimensionsGroup);
    solar.solarSuperstructureGroup.add(solar.cableChainGroup);
    solar.solarSuperstructureGroup.add(solar.weldGussetsGroup);
    solar.solarSuperstructureGroup.add(solar.aluminumBracketsGroup);

    solar.group.add(solar.batteryGroup);
    solar.group.add(solar.mpptGroup);
    solar.group.add(solar.b2bGroup);
    solar.group.add(solar.usinaGroup);
    solar.group.add(solar.waterTankGroup);

    solar.slidingLayers = [solar.slidingLayerGroup1, solar.slidingLayerGroup2, solar.slidingLayerGroup3];
    solar.rackMeshes = [];
  }

  static clearGroup(grp: THREE.Group) {
    if (!grp) return;
    while (grp.children.length > 0) {
      const obj = grp.children[0];
      grp.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      if ((obj as any).material) {
        if (Array.isArray((obj as any).material)) {
          (obj as any).material.forEach((m: any) => m.dispose());
        } else {
          (obj as any).material.dispose();
        }
      }
    }
  }
}
