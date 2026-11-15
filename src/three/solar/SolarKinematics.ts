import * as THREE from 'three';
import { MotionPlan } from '../SolarTrayBuilder';

export class SolarKinematics {
  static applyLevelMotion(
    config: any,
    motionInfo: MotionPlan | undefined,
    groupA: THREE.Group,
    groupB: THREE.Group,
    interA: THREE.Group,
    interB: THREE.Group,
    progress: number
  ) {
    if (!config || !motionInfo) return;
    const dir = motionInfo.dir;
    const travelA = (motionInfo.travelA || 0) * progress;
    const travelB = (motionInfo.travelB || 0) * progress;

    if (dir === 'longitudinal') {
      if (groupA) { groupA.position.z = travelA; groupA.position.x = 0; }
      if (groupB) { groupB.position.z = -travelB; groupB.position.x = 0; }
      if (interA) { interA.position.z = travelA * 0.5; interA.position.x = 0; }
      if (interB) { interB.position.z = -travelB * 0.5; interB.position.x = 0; }
    } else if (dir === 'lateral') {
      if (groupA) { groupA.position.x = -travelA; groupA.position.z = 0; }
      if (groupB) { groupB.position.x = travelB; groupB.position.z = 0; }
      if (interA) { interA.position.x = -travelA * 0.5; interA.position.z = 0; }
      if (interB) { interB.position.x = travelB * 0.5; interB.position.z = 0; }
    } else if (dir === 'rear_only') {
      if (groupA) groupA.position.set(0, 0, 0);
      if (groupB) { groupB.position.z = -travelB; groupB.position.x = 0; }
      if (interA) interA.position.set(0, 0, 0);
      if (interB) { interB.position.z = -travelB * 0.5; interB.position.x = 0; }
    } else if (dir === 'front_only') {
      if (groupA) { groupA.position.z = travelA; groupA.position.x = 0; }
      if (groupB) groupB.position.set(0, 0, 0);
      if (interA) { interA.position.z = travelA * 0.5; interA.position.x = 0; }
      if (interB) { interB.position.set(0, 0, 0); }
    } else {
      if (groupA) groupA.position.set(0, 0, 0);
      if (groupB) groupB.position.set(0, 0, 0);
      if (interA) interA.position.set(0, 0, 0);
      if (interB) interB.position.set(0, 0, 0);
    }
  }

  static updateExploded(
    progress: number,
    groups: {
      upperLayerGroup: THREE.Group;
      slidingLayerGroup3: THREE.Group;
      intermediateRailsGroup3: THREE.Group;
      intermediateRailsGroup4: THREE.Group;
      slidingLayerGroup1: THREE.Group;
      intermediateRailsGroup1: THREE.Group;
      slidingLayerGroup2: THREE.Group;
      intermediateRailsGroup2: THREE.Group;
    }
  ) {
    const offset = progress * 0.35;

    if (groups.upperLayerGroup) groups.upperLayerGroup.position.y = offset * 2.0;
    if (groups.slidingLayerGroup3) groups.slidingLayerGroup3.position.y = offset * 2.0;
    if (groups.intermediateRailsGroup3) groups.intermediateRailsGroup3.position.y = offset * 2.0;
    if (groups.intermediateRailsGroup4) groups.intermediateRailsGroup4.position.y = offset * 2.0;

    if (groups.slidingLayerGroup1) groups.slidingLayerGroup1.position.y = offset * 1.0;
    if (groups.intermediateRailsGroup1) groups.intermediateRailsGroup1.position.y = offset * 1.0;

    if (groups.slidingLayerGroup2) groups.slidingLayerGroup2.position.y = offset * 0.35;
    if (groups.intermediateRailsGroup2) groups.intermediateRailsGroup2.position.y = offset * 0.35;
  }
}
