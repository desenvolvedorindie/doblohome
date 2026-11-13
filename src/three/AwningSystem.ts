import * as THREE from 'three';
import { AwningConfig } from '../types';

/**
 * Subsistema 3D do Toldo Retrátil Overland para o Rack da Fiat Doblò.
 * Suporta dois modelos principais de expedição:
 * 1. Toldo Traseiro Reto (protege a traseira / porta-malas e mesa rebatível)
 * 2. Toldo Asa de Morcego 270° (envolve a lateral e a traseira em leque contínuo)
 */
export class AwningSystem {
  group: THREE.Group;
  config: AwningConfig;
  baseY: number;
  rackOffsetZ: number;

  private awningMeshesGroup: THREE.Group;

  constructor(config: AwningConfig, baseY: number = 2.06, rackOffsetZ: number = 0.40) {
    this.group = new THREE.Group();
    this.group.name = 'AwningSystem';
    this.config = config;
    this.baseY = baseY;
    this.rackOffsetZ = rackOffsetZ;

    this.awningMeshesGroup = new THREE.Group();
    this.awningMeshesGroup.name = 'AwningMeshes';
    this.group.add(this.awningMeshesGroup);

    this.build();
  }

  setConfig(newConfig: AwningConfig) {
    this.config = { ...newConfig };
    this.build();
  }

  build() {
    // Limpa meshes anteriores
    while (this.awningMeshesGroup.children.length > 0) {
      const child = this.awningMeshesGroup.children[0];
      this.awningMeshesGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: any) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }

    if (!this.config.enabled) {
      this.group.visible = false;
      return;
    }

    this.group.visible = true;

    if (this.config.type === 'rear') {
      this.buildRearAwning();
    } else {
      this.buildBatwingAwning();
    }
  }

  /**
   * Constrói o Toldo Traseiro Reto (Retrátil ao longo da travessa traseira do teto)
   */
  private buildRearAwning() {
    const caseWidth = (this.config.lengthMm || 1400) / 1000; // ~1.40m
    const extensionM = (this.config.extensionMm || 2000) / 1000; // ~2.00m
    const caseY = this.baseY + 0.04;
    const caseZ = -0.72; // traseira do rack

    // 1. Estojo Cilíndrico de Alumínio Preto Anodizado (fechado no rack)
    const caseGeo = new THREE.CylinderGeometry(0.045, 0.045, caseWidth, 24);
    caseGeo.rotateZ(Math.PI / 2);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.85,
      roughness: 0.25
    });
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.position.set(0, caseY, caseZ);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    caseMesh.userData = {
      isAwning: true,
      partLabel: 'Toldo Retrátil Traseiro (Case Alumínio 1.40m)'
    };
    this.awningMeshesGroup.add(caseMesh);

    // Tampas laterais usinadas CNC
    const capGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.015, 24);
    capGeo.rotateZ(Math.PI / 2);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    [-caseWidth / 2, caseWidth / 2].forEach(x => {
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, caseY, caseZ);
      this.awningMeshesGroup.add(cap);
    });

    // Brackets de fixação na longarina do rack
    [-caseWidth * 0.42, caseWidth * 0.42].forEach(x => {
      const bGeo = new THREE.BoxGeometry(0.035, 0.06, 0.06);
      const bMesh = new THREE.Mesh(bGeo, caseMat);
      bMesh.position.set(x, caseY - 0.03, caseZ + 0.03);
      this.awningMeshesGroup.add(bMesh);
    });

    // Se estiver aberto, renderiza a lona estendida para trás e os postes telescópicos
    if (this.config.isOpen) {
      const fabricColor = new THREE.Color(this.config.fabricColor || '#c2b280');
      const fabricMat = new THREE.MeshStandardMaterial({
        color: fabricColor,
        roughness: 0.90,
        metalness: 0.05,
        side: THREE.DoubleSide
      });

      // Lona estendida para trás (-Z) com caimento leve para escoamento de água (inclinação 4°)
      const dropY = 0.12; // caimento de 12cm na ponta externa
      const canvasShape = new THREE.Shape();
      const hw = caseWidth * 0.48;
      canvasShape.moveTo(-hw, 0);
      canvasShape.lineTo(hw, 0);
      canvasShape.lineTo(hw, extensionM);
      canvasShape.lineTo(-hw, extensionM);
      canvasShape.closePath();

      const canvasGeo = new THREE.ShapeGeometry(canvasShape);
      canvasGeo.rotateX(Math.PI / 2); // deita no plano XZ
      const canvasMesh = new THREE.Mesh(canvasGeo, fabricMat);
      canvasMesh.position.set(0, caseY, caseZ);
      canvasMesh.rotation.x = 0.06; // caimento suave para trás
      canvasMesh.castShadow = true;
      canvasMesh.receiveShadow = true;
      this.awningMeshesGroup.add(canvasMesh);

      // Barra frontal em alumínio na ponta externa da lona
      const outerZ = caseZ - extensionM * Math.cos(0.06);
      const outerY = caseY - dropY;
      const frontBarGeo = new THREE.BoxGeometry(caseWidth * 0.98, 0.03, 0.03);
      const frontBar = new THREE.Mesh(frontBarGeo, caseMat);
      frontBar.position.set(0, outerY, outerZ);
      this.awningMeshesGroup.add(frontBar);

      // Braços pantográficos articulados laterais conectando o case à ponta externa
      [-hw, hw].forEach(x => {
        const armGeo = new THREE.CylinderGeometry(0.012, 0.012, extensionM, 8);
        armGeo.rotateX(Math.PI / 2);
        const armMesh = new THREE.Mesh(armGeo, caseMat);
        armMesh.position.set(x, (caseY + outerY) / 2, (caseZ + outerZ) / 2);
        this.awningMeshesGroup.add(armMesh);
      });

      // 2 Postes Telescópicos verticais descendo até o solo (Y = 0)
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
      [-hw, hw].forEach(x => {
        const poleH = outerY;
        const poleGeo = new THREE.CylinderGeometry(0.014, 0.014, poleH, 12);
        const poleMesh = new THREE.Mesh(poleGeo, poleMat);
        poleMesh.position.set(x, poleH / 2, outerZ);
        poleMesh.castShadow = true;
        this.awningMeshesGroup.add(poleMesh);

        // Sapata de apoio no solo
        const footGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.012, 16);
        const footMesh = new THREE.Mesh(footGeo, caseMat);
        footMesh.position.set(x, 0.006, outerZ);
        this.awningMeshesGroup.add(footMesh);
      });
    }
  }

  /**
   * Constrói o Toldo Asa de Morcego 270° (Abre em leque envolvendo lateral + traseira)
   */
  private buildBatwingAwning() {
    const isPassenger = this.config.side !== 'driver';
    const sideSign = isPassenger ? -1 : 1; // passageiro é -X, motorista é +X
    const mountX = sideSign * 0.72; // montado no bordo lateral do rack
    const caseL = (this.config.lengthMm || 2000) / 1000; // ~2.00m
    const radiusM = (this.config.extensionMm || 2200) / 1000; // raio do leque ~2.20m
    const caseY = this.baseY + 0.05;
    const pivotZ = -0.70; // quina traseira onde fica o pivô central do leque

    // 1. Estojo Longitudinal ao longo da lateral do rack (Capa de PVC 1000D reforçada com zíper)
    const caseGeo = new THREE.BoxGeometry(0.12, 0.14, caseL);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.3,
      roughness: 0.75
    });
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    // Centro do estojo entre o pivô traseiro e a dianteira do rack
    caseMesh.position.set(mountX, caseY, pivotZ + caseL / 2);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    caseMesh.userData = {
      isAwning: true,
      partLabel: `Toldo Asa de Morcego 270° (${isPassenger ? 'Lado Passageiro' : 'Lado Motorista'} 2.0m)`
    };
    this.awningMeshesGroup.add(caseMesh);

    // Cintas de fechamento rápido em nylon amarelo/laranja
    [-0.5, 0, 0.5].forEach(offset => {
      const strapGeo = new THREE.BoxGeometry(0.125, 0.145, 0.03);
      const strapMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
      const strap = new THREE.Mesh(strapGeo, strapMat);
      strap.position.set(mountX, caseY, pivotZ + caseL / 2 + offset);
      this.awningMeshesGroup.add(strap);
    });

    // Pivô articulado de precisão na quina traseira
    const pivotGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.16, 16);
    const pivotMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const pivotMesh = new THREE.Mesh(pivotGeo, pivotMat);
    pivotMesh.position.set(mountX, caseY, pivotZ);
    this.awningMeshesGroup.add(pivotMesh);

    // Se estiver aberto, renderiza o leque 270° contínuo com 4 braços radiais e postes
    if (this.config.isOpen) {
      const fabricColor = new THREE.Color(this.config.fabricColor || '#c2b280');
      const fabricMat = new THREE.MeshStandardMaterial({
        color: fabricColor,
        roughness: 0.88,
        metalness: 0.04,
        side: THREE.DoubleSide
      });

      // 5 Braços radiais distribuídos ao longo dos 270° de leque:
      // Ângulos:
      // 0°: para a frente (+Z) ao longo da lateral do carro (cobrindo porta lateral)
      // 45°: diagonal dianteira/lateral
      // 90°: perpendicular para fora (lateral pura)
      // 135°: diagonal traseira/lateral
      // 180°: para trás (-Z) cobrindo todo o vão do porta-malas aberto!
      const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI];
      const armMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 });
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });

      const outerPoints: THREE.Vector3[] = [];

      angles.forEach((angle, idx) => {
        // Direção do braço radial no plano horizontal
        // angle = 0 é ao longo de +Z.
        // Giramos em direção para fora (X = sideSign * sin(angle)) e Z = cos(angle)
        const dirX = sideSign * Math.sin(angle);
        const dirZ = Math.cos(angle);

        // Ponta externa do braço (leve caimento de 14cm nas pontas para água)
        const drop = 0.14;
        const tipX = mountX + dirX * radiusM;
        const tipY = caseY - drop;
        const tipZ = pivotZ + dirZ * radiusM;
        outerPoints.push(new THREE.Vector3(tipX, tipY, tipZ));

        // Braço radial em tubo retangular de alumínio reforçado
        const armGeo = new THREE.BoxGeometry(0.024, 0.035, radiusM);
        const armCenter = new THREE.Vector3(
          mountX + (dirX * radiusM) / 2,
          caseY - drop / 2,
          pivotZ + (dirZ * radiusM) / 2
        );
        const armMesh = new THREE.Mesh(armGeo, armMat);
        armMesh.position.copy(armCenter);
        // Orienta o braço do pivô para a ponta
        armMesh.lookAt(new THREE.Vector3(tipX, caseY - drop, tipZ));
        armMesh.castShadow = true;
        this.awningMeshesGroup.add(armMesh);

        // Postes telescópicos de apoio ao solo (nos braços 1, 3 e 5)
        if (idx === 0 || idx === 2 || idx === 4) {
          const poleH = tipY;
          const poleGeo = new THREE.CylinderGeometry(0.014, 0.014, poleH, 12);
          const poleMesh = new THREE.Mesh(poleGeo, poleMat);
          poleMesh.position.set(tipX, poleH / 2, tipZ);
          poleMesh.castShadow = true;
          this.awningMeshesGroup.add(poleMesh);

          // Sapata
          const footGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.012, 16);
          const footMesh = new THREE.Mesh(footGeo, caseMat);
          footMesh.position.set(tipX, 0.006, tipZ);
          this.awningMeshesGroup.add(footMesh);
        }
      });

      // Lona contínua em leque: criada com triângulos conectando o pivô aos pontos externos
      const lonaGeo = new THREE.BufferGeometry();
      const vertices: number[] = [];

      for (let i = 0; i < outerPoints.length - 1; i++) {
        const p1 = outerPoints[i];
        const p2 = outerPoints[i + 1];

        // Triângulo do pivô para p1 e p2
        vertices.push(mountX, caseY, pivotZ);
        vertices.push(p1.x, p1.y, p1.z);
        vertices.push(p2.x, p2.y, p2.z);

        // Face reversa para double-sided perfeito
        vertices.push(mountX, caseY, pivotZ);
        vertices.push(p2.x, p2.y, p2.z);
        vertices.push(p1.x, p1.y, p1.z);
      }

      lonaGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      lonaGeo.computeVertexNormals();
      const lonaMesh = new THREE.Mesh(lonaGeo, fabricMat);
      lonaMesh.castShadow = true;
      lonaMesh.receiveShadow = true;
      this.awningMeshesGroup.add(lonaMesh);
    }
  }
}

