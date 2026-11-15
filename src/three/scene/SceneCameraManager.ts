import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CameraPreset } from '../../types';

export class SceneCameraManager {
  private static currentAnimationId: number | null = null;

  static createCamera(container: HTMLElement): THREE.PerspectiveCamera {
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(3.4, 3.2, 4.2);
    return camera;
  }

  static createControls(camera: THREE.PerspectiveCamera, domElement: HTMLElement): OrbitControls {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.2;
    controls.maxDistance = 18;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.target.set(0, 1.85, 0);
    controls.update();
    return controls;
  }

  static onResize(container: HTMLElement, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    if (!container) return;
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  static setCameraPreset(
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    view: CameraPreset
  ) {
    const targetLookAt = new THREE.Vector3(0, 1.85, 0);
    let targetPos = new THREE.Vector3();

    switch (view) {
      case 'iso':
        targetPos.set(3.4, 3.2, 4.2);
        break;
      case 'top':
        targetPos.set(0.01, 7.5, 0);
        break;
      case 'front':
        targetPos.set(0, 2.2, 5.8);
        break;
      case 'side':
        targetPos.set(5.5, 2.2, 0);
        break;
      case 'panels':
        targetPos.set(1.6, 2.7, -1.2);
        targetLookAt.set(0, 2.1, -0.68);
        break;
    }

    SceneCameraManager.animateCameraTo(camera, controls, targetPos, targetLookAt);
  }

  static animateCameraTo(
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    targetPos: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    duration: number = 750
  ) {
    if (SceneCameraManager.currentAnimationId !== null) {
      cancelAnimationFrame(SceneCameraManager.currentAnimationId);
      SceneCameraManager.currentAnimationId = null;
    }

    const startPos = camera.position.clone();
    const startLookAt = controls.target.clone();
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1.0);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      camera.position.lerpVectors(startPos, targetPos, ease);
      controls.target.lerpVectors(startLookAt, targetLookAt, ease);
      controls.update();

      if (t < 1.0) {
        SceneCameraManager.currentAnimationId = requestAnimationFrame(step);
      } else {
        SceneCameraManager.currentAnimationId = null;
      }
    }

    SceneCameraManager.currentAnimationId = requestAnimationFrame(step);
  }

  static focusOnBox(
    boxesGroup: THREE.Group,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    boxId: string | null
  ) {
    if (!boxId) {
      SceneCameraManager.animateCameraTo(
        camera,
        controls,
        new THREE.Vector3(1.6, 2.0, -2.5),
        new THREE.Vector3(0, 0.60, -0.85)
      );
      return;
    }

    const boxContainer = boxesGroup.getObjectByName(`BoxContainer_${boxId}`);
    if (!boxContainer) return;

    const boxAABB = new THREE.Box3().setFromObject(boxContainer);
    const center = new THREE.Vector3();
    boxAABB.getCenter(center);
    const size = new THREE.Vector3();
    boxAABB.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z, 0.45);
    const signX = center.x >= 0 ? 1 : -1;
    const camOffset = new THREE.Vector3(signX * maxDim * 1.5, maxDim * 1.25, maxDim * 1.7);
    const targetCamPos = center.clone().add(camOffset);

    SceneCameraManager.animateCameraTo(camera, controls, targetCamPos, center);
  }
}
