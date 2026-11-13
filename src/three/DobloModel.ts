import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MaterialLibrary } from './Materials';

/**
 * Modelo 3D da Fiat Doblò
 * Carrega o modelo realista assets/doblo.obj com materiais automotivos PBR
 */
export class DobloVehicle {
  group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = "FiatDoblo";
    // Hitbox invisível do teto da Doblò para detecção de colisão com a base
    const roofColliderGeo = new THREE.BoxGeometry(1.32, 0.20, 2.25);
    const roofColliderMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const roofCollider = new THREE.Mesh(roofColliderGeo, roofColliderMat);
    roofCollider.name = '__roof_collider';
    roofCollider.position.set(0, 1.82, -0.45);
    roofCollider.userData = {
      isRoofCollider: true,
      barLabel: 'Teto do Veículo (Fiat Doblò)',
      profileSpec: 'Lataria Superior do Teto'
    };
    this.group.add(roofCollider);
    this.loadOBJModel();
  }

  /**
   * Carrega o modelo 3D real da Fiat Doblò fornecido em assets/doblo.obj
   */
  loadOBJModel() {
    const loader = new OBJLoader();
    loader.load(
      '/assets/doblo.obj',
      (obj) => {
        const scale = 0.001; // Converte mm para metros
        const offsetX = 11424.40;
        const offsetY = -343.13;
        const offsetZ = 2.75;

        obj.traverse((child: any) => {
          if (child.isMesh && child.geometry) {
            const pos = child.geometry.attributes.position;
            if (pos) {
              for (let i = 0; i < pos.count; i++) {
                const x_sk = pos.getX(i);
                const y_sk = pos.getY(i);
                const z_sk = pos.getZ(i);

                pos.setXYZ(
                  i,
                  (x_sk - offsetX) * scale,
                  (z_sk - offsetZ) * scale,
                  (y_sk - offsetY) * scale
                );
              }
              pos.needsUpdate = true;
              child.geometry.computeVertexNormals();
              child.geometry.computeBoundingBox();
              child.geometry.computeBoundingSphere();
            }

            const matName = (child.name + ' ' + (child.material && child.material.name ? child.material.name : '')).toLowerCase();

            if (matName.includes('glass') || matName.includes('vidro') || matName.includes('matte__a0c0c') || matName.includes('color_m09') || matName.includes('matte__ffe1e')) {
              child.material = MaterialLibrary.materials.carGlass;
            } else if (matName.includes('wheel') || matName.includes('roda') || matName.includes('pneu') || matName.includes('tire') || matName.includes('ferro')) {
              child.material = MaterialLibrary.materials.tireRubber;
            } else if (matName.includes('light') || matName.includes('farol') || matName.includes('stop') || matName.includes('vehiclelight')) {
              child.material = new THREE.MeshStandardMaterial({
                color: matName.includes('stop') ? 0xdc2626 : 0xffffff,
                emissive: new THREE.Color(matName.includes('stop') ? 0x991b1b : 0xfef08a),
                emissiveIntensity: 0.45,
                roughness: 0.1
              });
            } else if (matName.includes('bumper') || matName.includes('preto') || matName.includes('matte__ff000') || matName.includes('zgara') || matName.includes('placa')) {
              child.material = MaterialLibrary.materials.carBumper;
            } else if (matName.includes('logo')) {
              child.material = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.8, roughness: 0.2 });
            } else {
              child.material = MaterialLibrary.materials.carPaint;
            }

            child.material.side = THREE.DoubleSide;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        while (this.group.children.length > 0) {
          const c = this.group.children.find(ch => ch.name !== '__roof_collider');
          if (!c) break;
          this.group.remove(c);
          if ((c as any).geometry) (c as any).geometry.dispose();
        }
        this.group.add(obj);
        console.log('✅ Fiat Doblò real carregada com sucesso a partir de /assets/doblo.obj!');
      },
      undefined,
      (err) => {
        console.warn('Não foi possível carregar /assets/doblo.obj, mantendo modelo procedural:', err);
        this.buildProceduralVehicle();
      }
    );
  }

  /**
   * Constrói o modelo procedural como fallback
   */
  buildProceduralVehicle() {
    const mats = MaterialLibrary.materials;
    const vehicleBody = new THREE.Group();

    // 1. Chassi inferior
    const lowerBodyGeo = new THREE.BoxGeometry(1.68, 0.45, 4.10);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, mats.carBumper);
    lowerBody.position.set(0, 0.48, 0);
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    vehicleBody.add(lowerBody);

    // 2. Cabine Principal da Doblò
    const cabinGeo = new THREE.BoxGeometry(1.64, 1.05, 2.70);
    const cabin = new THREE.Mesh(cabinGeo, mats.carPaint);
    cabin.position.set(0, 1.20, -0.40);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    vehicleBody.add(cabin);

    // 3. Capô e Frente Aerodinâmica
    const hoodGeo = new THREE.BoxGeometry(1.62, 0.42, 1.15);
    const hood = new THREE.Mesh(hoodGeo, mats.carPaint);
    hood.position.set(0, 0.82, 1.48);
    hood.rotation.x = -0.12;
    hood.castShadow = true;
    vehicleBody.add(hood);

    // 4. Para-brisa dianteiro inclinado
    const windshieldGeo = new THREE.PlaneGeometry(1.48, 0.85);
    const windshield = new THREE.Mesh(windshieldGeo, mats.carGlass);
    windshield.position.set(0, 1.34, 0.98);
    windshield.rotation.x = -0.52;
    windshield.castShadow = true;
    vehicleBody.add(windshield);

    // 5. Vidros Laterais e Traseiro
    const sideGlassFrontGeo = new THREE.PlaneGeometry(0.70, 0.50);
    const glassFL = new THREE.Mesh(sideGlassFrontGeo, mats.carGlass);
    glassFL.position.set(-0.825, 1.35, 0.55);
    glassFL.rotation.y = -Math.PI / 2;
    vehicleBody.add(glassFL);

    const glassFR = new THREE.Mesh(sideGlassFrontGeo, mats.carGlass);
    glassFR.position.set(0.825, 1.35, 0.55);
    glassFR.rotation.y = Math.PI / 2;
    vehicleBody.add(glassFR);

    const sideGlassRearGeo = new THREE.PlaneGeometry(1.50, 0.52);
    const glassRL = new THREE.Mesh(sideGlassRearGeo, mats.carGlass);
    glassRL.position.set(-0.825, 1.35, -0.65);
    glassRL.rotation.y = -Math.PI / 2;
    vehicleBody.add(glassRL);

    const glassRR = new THREE.Mesh(sideGlassRearGeo, mats.carGlass);
    glassRR.position.set(0.825, 1.35, -0.65);
    glassRR.rotation.y = Math.PI / 2;
    vehicleBody.add(glassRR);

    const rearGlassGeo = new THREE.PlaneGeometry(1.40, 0.65);
    const rearGlass = new THREE.Mesh(rearGlassGeo, mats.carGlass);
    rearGlass.position.set(0, 1.35, -1.755);
    rearGlass.rotation.y = Math.PI;
    vehicleBody.add(rearGlass);

    // 6. Rodas e Pneus
    this.addWheel(vehicleBody, -0.76, 0.34, 1.35);
    this.addWheel(vehicleBody, 0.76, 0.34, 1.35);
    this.addWheel(vehicleBody, -0.76, 0.34, -1.15);
    this.addWheel(vehicleBody, 0.76, 0.34, -1.15);

    // 7. Teto
    const roofSheetGeo = new THREE.BoxGeometry(1.42, 0.04, 2.22);
    const roofSheet = new THREE.Mesh(roofSheetGeo, mats.carPaint);
    roofSheet.position.set(0, 1.73, 0);
    roofSheet.receiveShadow = true;
    vehicleBody.add(roofSheet);

    this.group.add(vehicleBody);
  }

  addWheel(parent: THREE.Group, x: number, y: number, z: number) {
    const mats = MaterialLibrary.materials;
    const wheelGroup = new THREE.Group();

    const tireGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.20, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, mats.tireRubber);
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.21, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, mats.wheelRim);
    wheelGroup.add(rim);

    wheelGroup.position.set(x, y, z);
    parent.add(wheelGroup);
  }

  setVisible(visible: boolean) {
    this.group.visible = visible;
  }
}

