import * as THREE from 'three';

export class SceneEnvironment {
  static createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1b3252);
    scene.fog = new THREE.FogExp2(0x1b3252, 0.018);
    return scene;
  }

  static createRenderer(container: HTMLElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.30;
    (renderer as any).outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    return renderer;
  }

  static createEnvironment(scene: THREE.Scene) {
    const groundGeo = new THREE.PlaneGeometry(36, 36);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x13233a,
      roughness: 0.70,
      metalness: 0.15
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(30, 60, 0x38bdf8, 0x1d4ed8);
    grid.position.y = 0.002;
    scene.add(grid);
  }
}
