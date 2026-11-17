import * as THREE from 'three';

/**
 * Boneco de referência de escala humana estilo manequim 3D (esferas + cápsulas).
 * Baseado fielmente no modelo visual fornecido:
 * - Cabeça esférica
 * - Pescoço de união
 * - Torso em cápsula arredondada única
 * - Braços em cápsulas verticais
 * - Pernas em cápsulas verticais com pés no solo (Y = 0)
 * Altura total configurável e proporcional em tempo real.
 */
export class HumanFigureBuilder {
  group: THREE.Group;
  private figureMesh: THREE.Group;
  private heightM: number = 1.75;
  private positionX: number = -1.85;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'HumanFigure';

    this.figureMesh = new THREE.Group();
    this.group.add(this.figureMesh);

    this.build(this.heightM);
  }

  /**
   * Reconstrói a geometria do boneco proporcionalmente à altura informada.
   */
  build(heightM: number) {
    this.heightM = heightM;

    // Limpa malhas anteriores e descarta geometrias
    while (this.figureMesh.children.length > 0) {
      const child = this.figureMesh.children[0] as any;
      this.figureMesh.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material && !Array.isArray(child.material)) child.material.dispose();
    }

    const H = Math.max(1.20, Math.min(2.30, heightM));
    const sc = H / 1.75;

    // Material azul/lilás suave idêntico à referência (PBR fosco)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x7e8ed2,
      roughness: 0.45,
      metalness: 0.08,
      transparent: false,
    });

    // ─────────────────────────────────────────────────────────────
    // 1. CABEÇA & PESCOÇO
    // ─────────────────────────────────────────────────────────────
    const headR = 0.098 * sc;
    const headCenterY = H - headR; // Topo exato em Y = H
    const headGeo = new THREE.SphereGeometry(headR, 24, 20);
    const headMesh = new THREE.Mesh(headGeo, mat);
    headMesh.position.set(0, headCenterY, 0);
    headMesh.castShadow = true;
    this.figureMesh.add(headMesh);

    // ─────────────────────────────────────────────────────────────
    // 2. TORSO (Cápsula Arredondada Única)
    // ─────────────────────────────────────────────────────────────
    // Topo do torso fica logo abaixo da cabeça
    const torsoTopY = headCenterY - headR - 0.025 * sc;
    // Base do torso fica na virilha
    const torsoBottomY = 0.48 * H;
    const torsoHeightTotal = torsoTopY - torsoBottomY;
    const torsoR = 0.132 * sc;
    const torsoCylinderLen = Math.max(0.04, torsoHeightTotal - 2 * torsoR);
    const torsoCenterY = (torsoTopY + torsoBottomY) / 2;

    const torsoGeo = new THREE.CapsuleGeometry(torsoR, torsoCylinderLen, 12, 24);
    const torsoMesh = new THREE.Mesh(torsoGeo, mat);
    torsoMesh.position.set(0, torsoCenterY, 0);
    torsoMesh.castShadow = true;
    this.figureMesh.add(torsoMesh);

    // Pescoço de conexão sólido (garante que cabeça NUNCA flutue)
    const neckBottomY = torsoTopY - 0.02 * sc;
    const neckTopY = headCenterY - headR * 0.75;
    const neckHeight = Math.max(0.02, neckTopY - neckBottomY);
    const neckR = 0.045 * sc;
    const neckGeo = new THREE.CylinderGeometry(neckR, neckR * 1.15, neckHeight, 16);
    const neckMesh = new THREE.Mesh(neckGeo, mat);
    neckMesh.position.set(0, (neckTopY + neckBottomY) / 2, 0);
    neckMesh.castShadow = true;
    this.figureMesh.add(neckMesh);

    // ─────────────────────────────────────────────────────────────
    // 3. BRAÇOS (Duas cápsulas verticais longas)
    // ─────────────────────────────────────────────────────────────
    const armTopY = torsoTopY - 0.035 * sc;
    const armBottomY = 0.45 * H;
    const armHeightTotal = armTopY - armBottomY;
    const armR = 0.042 * sc;
    const armCylinderLen = Math.max(0.04, armHeightTotal - 2 * armR);
    const armCenterY = (armTopY + armBottomY) / 2;
    const armSpacingX = torsoR + armR + 0.028 * sc;

    const armGeo = new THREE.CapsuleGeometry(armR, armCylinderLen, 10, 20);

    // Braço esquerdo
    const leftArm = new THREE.Mesh(armGeo, mat);
    leftArm.position.set(armSpacingX, armCenterY, 0);
    leftArm.castShadow = true;
    this.figureMesh.add(leftArm);

    // Braço direito
    const rightArm = new THREE.Mesh(armGeo, mat);
    rightArm.position.set(-armSpacingX, armCenterY, 0);
    rightArm.castShadow = true;
    this.figureMesh.add(rightArm);

    // ─────────────────────────────────────────────────────────────
    // 4. PERNAS (Duas cápsulas verticais — pés tocam o solo em Y = 0)
    // ─────────────────────────────────────────────────────────────
    const legTopY = torsoBottomY + torsoR * 0.65; // Penetram suavemente no torso
    const legBottomY = 0; // Pés no chão
    const legHeightTotal = legTopY - legBottomY;
    const legR = 0.055 * sc;
    const legCylinderLen = Math.max(0.04, legHeightTotal - 2 * legR);
    const legCenterY = legHeightTotal / 2; // Centro da cápsula
    const legSpacingX = 0.082 * sc;

    const legGeo = new THREE.CapsuleGeometry(legR, legCylinderLen, 10, 20);

    // Perna esquerda
    const leftLeg = new THREE.Mesh(legGeo, mat);
    leftLeg.position.set(legSpacingX, legCenterY, 0);
    leftLeg.castShadow = true;
    this.figureMesh.add(leftLeg);

    // Perna direita
    const rightLeg = new THREE.Mesh(legGeo, mat);
    rightLeg.position.set(-legSpacingX, legCenterY, 0);
    rightLeg.castShadow = true;
    this.figureMesh.add(rightLeg);

    // Posiciona o boneco à esquerda da Doblò no solo
    this.figureMesh.position.set(this.positionX, 0, 0.3);

    // Linha de cota e medição vertical ao lado
    this._addHeightDimension(H);
  }

  /**
   * Linha de cota gráfica indicando a altura total medida em metros.
   */
  private _addHeightDimension(H: number) {
    const dimX = 0.32;
    const dimPoints = [
      new THREE.Vector3(dimX, 0, 0),
      new THREE.Vector3(dimX, H, 0),
    ];
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints(dimPoints);
    const line = new THREE.Line(lineGeo, lineMat);
    this.figureMesh.add(line);

    // Tick no topo
    const topTick = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(dimX - 0.05, H, 0),
        new THREE.Vector3(dimX + 0.05, H, 0),
      ]),
      lineMat
    );
    this.figureMesh.add(topTick);

    // Tick na base
    const botTick = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(dimX - 0.05, 0, 0),
        new THREE.Vector3(dimX + 0.05, 0, 0),
      ]),
      lineMat
    );
    this.figureMesh.add(botTick);
  }

  setHeight(heightM: number) {
    this.build(heightM);
  }

  setPositionX(x: number) {
    this.positionX = x;
    this.figureMesh.position.x = x;
  }

  setVisible(visible: boolean) {
    this.group.visible = visible;
  }
}
