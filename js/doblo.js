/**
 * Modelo 3D da Fiat Doblò
 * Carrega o modelo realista assets/doblo.obj com materiais automotivos PBR
 * Mantém modelo paramétrico como fallback instantâneo inicial
 */

class DobloVehicle {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = "FiatDoblo";
    // Sem placeholder procedural — carrega direto o OBJ real
    this.loadOBJModel();
  }

  /**
   * Carrega o modelo 3D real da Fiat Doblò fornecido em assets/doblo.obj
   */
  loadOBJModel() {
    if (typeof THREE.OBJLoader === 'undefined') {
      console.warn('OBJLoader não disponível, mantendo modelo procedural.');
      return;
    }

    const loader = new THREE.OBJLoader();
    loader.load(
      'assets/doblo.obj',
      (obj) => {
        // Dimensões reais do SketchUp em mm:
        // X: 10349.7 a 12499.1 -> Centro X = 11424.40 mm
        // Y: -2578.2 a 1891.9 -> Centro Y = -343.13 mm (+Y é a frente da Doblò)
        // Z: 2.75 a 2017.07 -> Base Z = 2.75 mm (solo)
        const scale = 0.001; // Converte mm para metros
        const offsetX = 11424.40;
        const offsetY = -343.13;
        const offsetZ = 2.75;

        obj.traverse((child) => {
          if (child.isMesh && child.geometry) {
            const pos = child.geometry.attributes.position;
            if (pos) {
              for (let i = 0; i < pos.count; i++) {
                const x_sk = pos.getX(i);
                const y_sk = pos.getY(i);
                const z_sk = pos.getZ(i);

                // Mapeamento de coordenadas SketchUp -> Three.js
                // X = Largura (centro em 0)
                // Y = Altura (solo em 0, teto em ~1.85m - 2.01m)
                // Z = Comprimento (Frente em +Z, Traseira em -Z)
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

            // Atribuição de materiais PBR por grupo/nome do material
            const matName = (child.name + ' ' + (child.material && child.material.name ? child.material.name : '')).toLowerCase();

            if (matName.includes('glass') || matName.includes('vidro') || matName.includes('matte__a0c0c') || matName.includes('color_m09') || matName.includes('matte__ffe1e')) {
              child.material = MaterialLibrary.materials.carGlass;
            } else if (matName.includes('wheel') || matName.includes('roda') || matName.includes('pneu') || matName.includes('tire') || matName.includes('ferro')) {
              child.material = MaterialLibrary.materials.tireRubber;
            } else if (matName.includes('light') || matName.includes('farol') || matName.includes('stop') || matName.includes('vehiclelight')) {
              child.material = new THREE.MeshStandardMaterial({
                color: matName.includes('stop') ? 0xdc2626 : 0xffffff,
                emissive: matName.includes('stop') ? 0x991b1b : 0xfef08a,
                emissiveIntensity: 0.45,
                roughness: 0.1
              });
            } else if (matName.includes('bumper') || matName.includes('preto') || matName.includes('matte__ff000') || matName.includes('zgara') || matName.includes('placa')) {
              child.material = MaterialLibrary.materials.carBumper;
            } else if (matName.includes('logo')) {
              child.material = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.8, roughness: 0.2 });
            } else {
              // Pintura metálica branca da lataria
              child.material = MaterialLibrary.materials.carPaint;
            }

            child.material.side = THREE.DoubleSide;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Substitui o placeholder procedural pelo modelo 3D real da Doblò
        while (this.group.children.length > 0) {
          const c = this.group.children[0];
          this.group.remove(c);
          if (c.geometry) c.geometry.dispose();
        }
        this.group.add(obj);
        console.log('✅ Fiat Doblò real carregada com sucesso a partir de assets/doblo.obj!');
      },
      undefined,
      (err) => {
        console.warn('Não foi possível carregar assets/doblo.obj, mantendo modelo procedural:', err);
      }
    );
  }

  /**
   * Constrói o modelo procedural como exibição instantânea inicial
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
    this.addWheel(-0.76, 0.34, 1.35);
    this.addWheel(0.76, 0.34, 1.35);
    this.addWheel(-0.76, 0.34, -1.15);
    this.addWheel(0.76, 0.34, -1.15);

    // 7. Teto e Calhas
    const roofSheetGeo = new THREE.BoxGeometry(1.42, 0.04, 2.22);
    const roofSheet = new THREE.Mesh(roofSheetGeo, mats.carPaint);
    roofSheet.position.set(0, 1.73, 0);
    roofSheet.receiveShadow = true;
    vehicleBody.add(roofSheet);

    this.group.add(vehicleBody);
  }

  addWheel(x, y, z) {
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
    this.group.add(wheelGroup);
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
