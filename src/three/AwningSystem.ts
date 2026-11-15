import * as THREE from 'three';
import { AwningConfig } from '../types';

/**
 * Subsistema 3D do Toldo Retrátil Overland para o Rack da Fiat Doblò.
 * Suporta dois modelos principais de expedição:
 * 1. Toldo Traseiro Reto (montado na extremidade traseira do rack, abre sobre o porta-malas aberto)
 * 2. Toldo Asa de Morcego 270° (montado na lateral com pivô na quina traseira, abre em leque contínuo)
 *
 * Convenção de coordenadas da van (Fiat Doblò):
 * - Frente (capô, faróis, para-brisa): direção -Z (ou dianteira da cabine)
 * - Traseira (porta-malas, tampa traseira): extremidade +Z (onde o rack termina em Z = +1.50m)
 * - Lado Passageiro: -X (-0.72m)
 * - Lado Motorista: +X (+0.72m)
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
   * Constrói o Toldo Traseiro Reto
   * Fixado firmemente na travessa traseira do rack (+1.50m) e estendendo-se para trás (+Z),
   * cobrindo toda a área de convivência do porta-malas aberto e bancada externa.
   */
  private buildRearAwning() {
    const caseWidth = (this.config.lengthMm || 1400) / 1000; // ~1.40m
    const extensionM = (this.config.extensionMm || 2000) / 1000; // ~2.00m
    const caseY = this.baseY + 0.04;
    // O rack base de 2.20m centrado em rackOffsetZ tem sua travessa traseira em direção a -Z (porta-malas)
    const rackRearZ = this.rackOffsetZ - 1.10;
    const caseZ = rackRearZ - 0.045; // encostado na face traseira externa da travessa

    const darkAluMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.85,
      roughness: 0.25
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.92,
      roughness: 0.18
    });
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.8,
      roughness: 0.3
    });

    // 1. Estojo Cilíndrico de Alumínio Preto Anodizado montado na travessa traseira
    const caseRadius = 0.045;
    const caseGeo = new THREE.CylinderGeometry(caseRadius, caseRadius, caseWidth, 24);
    caseGeo.rotateZ(Math.PI / 2);
    const caseMesh = new THREE.Mesh(caseGeo, darkAluMat);
    caseMesh.position.set(0, caseY, caseZ);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    caseMesh.userData = {
      isAwning: true,
      partLabel: 'Toldo Retrátil Traseiro Overland (Case Alumínio 1.40m)'
    };
    this.awningMeshesGroup.add(caseMesh);

    // Tampas laterais usinadas CNC com chanfro
    const capGeo = new THREE.CylinderGeometry(caseRadius + 0.003, caseRadius + 0.003, 0.015, 24);
    capGeo.rotateZ(Math.PI / 2);
    [-caseWidth / 2, caseWidth / 2].forEach(x => {
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, caseY, caseZ);
      this.awningMeshesGroup.add(cap);
    });

    // 2. Brackets reforçados em L em aço inox conectando o estojo à travessa traseira 40x40 do rack
    [-caseWidth * 0.38, caseWidth * 0.38].forEach(x => {
      // Aba horizontal que se apoia na travessa
      const bTopGeo = new THREE.BoxGeometry(0.04, 0.008, 0.06);
      const bTop = new THREE.Mesh(bTopGeo, bracketMat);
      bTop.position.set(x, caseY + 0.01, rackRearZ);
      this.awningMeshesGroup.add(bTop);

      // Aba vertical que prende o estojo cilíndrico
      const bFaceGeo = new THREE.BoxGeometry(0.04, 0.06, 0.008);
      const bFace = new THREE.Mesh(bFaceGeo, bracketMat);
      bFace.position.set(x, caseY - 0.02, caseZ + caseRadius);
      this.awningMeshesGroup.add(bFace);
    });

    // 3. Estrutura Desdobrada quando Aberto (Lona, Barra Frontal, Braços Articulados e Postes)
    if (this.config.isOpen) {
      const fabricColor = new THREE.Color(this.config.fabricColor || '#c2b280');
      const fabricMat = new THREE.MeshStandardMaterial({
        color: fabricColor,
        roughness: 0.88,
        metalness: 0.03,
        side: THREE.DoubleSide
      });

      // Caimento suave de 12cm para escoamento pluvial
      const dropY = 0.12;
      const outerZ = caseZ - extensionM; // estende-se para trás (-Z), cobrindo a traseira da Doblò
      const outerY = caseY - dropY;
      const hw = caseWidth * 0.48;

      // 3.1 Lona Contínua Ripstop UV50+ ligando diretamente o estojo à barra externa
      const canvasGeo = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        // Face superior (2 triângulos)
        -hw, caseY, caseZ,   // 0: Estojo esq
         hw, caseY, caseZ,   // 1: Estojo dir
         hw, outerY, outerZ,  // 2: Ponta externa dir

        -hw, caseY, caseZ,   // 0
         hw, outerY, outerZ,  // 2
        -hw, outerY, outerZ,  // 3: Ponta externa esq

        // Face inferior (backfaces para iluminação perfeita)
        -hw, caseY, caseZ,
         hw, outerY, outerZ,
         hw, caseY, caseZ,

        -hw, caseY, caseZ,
        -hw, outerY, outerZ,
         hw, outerY, outerZ
      ]);
      canvasGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      canvasGeo.computeVertexNormals();

      const canvasMesh = new THREE.Mesh(canvasGeo, fabricMat);
      canvasMesh.castShadow = true;
      canvasMesh.receiveShadow = true;
      this.awningMeshesGroup.add(canvasMesh);

      // 3.2 Barra Frontal Externa em Perfil Retangular de Alumínio (borda externa da lona)
      const leadBarW = caseWidth * 0.98;
      const leadBarGeo = new THREE.BoxGeometry(leadBarW, 0.035, 0.035);
      const leadBar = new THREE.Mesh(leadBarGeo, darkAluMat);
      leadBar.position.set(0, outerY, outerZ);
      leadBar.castShadow = true;
      this.awningMeshesGroup.add(leadBar);

      // Tampas da barra externa
      const leadCapGeo = new THREE.BoxGeometry(0.008, 0.038, 0.038);
      [-leadBarW / 2, leadBarW / 2].forEach(x => {
        const c = new THREE.Mesh(leadCapGeo, capMat);
        c.position.set(x, outerY, outerZ);
        this.awningMeshesGroup.add(c);
      });

      // 3.3 Braços Laterais Articulados Telescópicos (conectam firmemente o estojo à barra externa)
      const armLength = Math.hypot(extensionM, dropY);
      [-hw, hw].forEach(x => {
        // Haste principal do braço em perfil retangular
        const armGeo = new THREE.BoxGeometry(0.024, 0.024, armLength);
        const armMesh = new THREE.Mesh(armGeo, darkAluMat);
        armMesh.position.set(x, (caseY + outerY) / 2, (caseZ + outerZ) / 2);
        // Alinha o braço do estojo até a barra externa com caimento angular exato
        armMesh.lookAt(new THREE.Vector3(x, outerY, outerZ));
        armMesh.castShadow = true;
        this.awningMeshesGroup.add(armMesh);

        // Articulação / Knuckle no estojo
        const hingeCaseGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.03, 16);
        hingeCaseGeo.rotateZ(Math.PI / 2);
        const hingeCase = new THREE.Mesh(hingeCaseGeo, capMat);
        hingeCase.position.set(x, caseY, caseZ);
        this.awningMeshesGroup.add(hingeCase);

        // Articulação / Knuckle na barra frontal
        const hingeOuterGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.03, 16);
        hingeOuterGeo.rotateZ(Math.PI / 2);
        const hingeOuter = new THREE.Mesh(hingeOuterGeo, capMat);
        hingeOuter.position.set(x, outerY, outerZ);
        this.awningMeshesGroup.add(hingeOuter);
      });

      // 3.4 Postes Telescópicos Verticais de Sustentação até o Solo
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.88,
        roughness: 0.22
      });

      [-hw, hw].forEach(x => {
        const poleHeight = outerY;
        // Tubo superior telescópico (mais espesso)
        const upperH = poleHeight * 0.55;
        const upperGeo = new THREE.CylinderGeometry(0.014, 0.014, upperH, 16);
        const upperMesh = new THREE.Mesh(upperGeo, poleMat);
        upperMesh.position.set(x, poleHeight - upperH / 2, outerZ);
        upperMesh.castShadow = true;
        this.awningMeshesGroup.add(upperMesh);

        // Trava giratória de aperto rápido entre os estágios do poste
        const lockGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.035, 16);
        const lockMesh = new THREE.Mesh(lockGeo, darkAluMat);
        lockMesh.position.set(x, poleHeight - upperH, outerZ);
        this.awningMeshesGroup.add(lockMesh);

        // Tubo inferior telescópico (mais fino, entra no superior)
        const lowerH = poleHeight * 0.50;
        const lowerGeo = new THREE.CylinderGeometry(0.011, 0.011, lowerH, 16);
        const lowerMesh = new THREE.Mesh(lowerGeo, poleMat);
        lowerMesh.position.set(x, lowerH / 2, outerZ);
        lowerMesh.castShadow = true;
        this.awningMeshesGroup.add(lowerMesh);

        // Sapata de apoio no solo com furação para estacas
        const footGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.012, 20);
        const footMesh = new THREE.Mesh(footGeo, darkAluMat);
        footMesh.position.set(x, 0.006, outerZ);
        footMesh.receiveShadow = true;
        this.awningMeshesGroup.add(footMesh);
      });
    }
  }

  /**
   * Constrói o Toldo Asa de Morcego 270° (Expedição Overland)
   * Pivô de alta resistência montado na quina traseira do rack (+1.50m).
   * O estojo se estende para a frente ao longo do bordo lateral.
   * Quando aberto, abre em leque contínuo de 270° cobrindo a lateral e a traseira completa da van.
   */
  private buildBatwingAwning() {
    const isPassenger = this.config.side !== 'driver';
    const sideSign = isPassenger ? -1 : 1; // Passageiro = -X, Motorista = +X
    const mountX = sideSign * 0.72; // Fixado no bordo lateral do rack base
    const caseL = (this.config.lengthMm || 2000) / 1000; // ~2.00m
    const radiusM = (this.config.extensionMm || 2200) / 1000; // Raio de cobertura ~2.20m
    const caseY = this.baseY + 0.05;
    // Pivô montado na quina traseira do rack (-Z)
    const rackRearZ = this.rackOffsetZ - 1.10;
    const pivotZ = rackRearZ;
    // O estojo se estende do pivô traseiro em direção à dianteira da van (+Z)
    const caseCenterZ = pivotZ + caseL / 2;

    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.25,
      roughness: 0.8
    });
    const strapMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
    const pivotMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.92, roughness: 0.18 });

    // 1. Estojo Longitudinal (Capa PVC 1000D resistente ao longo da longarina)
    const caseGeo = new THREE.BoxGeometry(0.12, 0.14, caseL);
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.position.set(mountX, caseY, caseCenterZ);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    caseMesh.userData = {
      isAwning: true,
      partLabel: `Toldo Asa de Morcego 270° Overland (${isPassenger ? 'Lado Passageiro' : 'Lado Motorista'} 2.0m)`
    };
    this.awningMeshesGroup.add(caseMesh);

    // Cintas de fechamento rápido em nylon laranja
    [-0.55, 0, 0.55].forEach(offset => {
      const strapGeo = new THREE.BoxGeometry(0.125, 0.145, 0.03);
      const strap = new THREE.Mesh(strapGeo, strapMat);
      strap.position.set(mountX, caseY, caseCenterZ + offset);
      this.awningMeshesGroup.add(strap);
    });

    // Suportes em L conectando o estojo à longarina lateral do rack
    [-0.6, 0, 0.6].forEach(offset => {
      const bGeo = new THREE.BoxGeometry(0.04, 0.05, 0.05);
      const bMesh = new THREE.Mesh(bGeo, metalMat);
      bMesh.position.set(mountX - sideSign * 0.05, caseY - 0.02, caseCenterZ + offset);
      this.awningMeshesGroup.add(bMesh);
    });

    // 2. Pivô Articulado de Alta Carga na quina traseira
    const pivotGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.16, 20);
    const pivotMesh = new THREE.Mesh(pivotGeo, pivotMat);
    pivotMesh.position.set(mountX, caseY, pivotZ);
    this.awningMeshesGroup.add(pivotMesh);

    // 3. Estrutura Aberta em Leque Contínuo 270°
    if (this.config.isOpen) {
      const fabricColor = new THREE.Color(this.config.fabricColor || '#c2b280');
      const fabricMat = new THREE.MeshStandardMaterial({
        color: fabricColor,
        roughness: 0.88,
        metalness: 0.03,
        side: THREE.DoubleSide
      });

      // 5 Braços radiais cobrindo exatamente os 270°:
      // A partir do pivô traseiro em (mountX, pivotZ):
      // angle = 0: aponta para a dianteira (+Z, dirZ = +1), cobrindo a porta lateral da van
      // angle = 67.5°: diagonal dianteira/lateral (+Z)
      // angle = 135°: lateral exterior (perpendicular)
      // angle = 202.5°: diagonal traseira cobrindo o vão do porta-malas (-Z)
      // angle = 270°: atravessa a traseira da van até o lado oposto da carroceria
      const angles = [
        0,
        (Math.PI * 3) / 8,
        (Math.PI * 3) / 4,
        (Math.PI * 9) / 8,
        (Math.PI * 3) / 2
      ];

      const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.22 });
      const outerPoints: THREE.Vector3[] = [];

      angles.forEach((angle, idx) => {
        // Direção trigonométrica do braço radial no plano horizontal
        const dirX = sideSign * Math.sin(angle);
        const dirZ = Math.cos(angle);

        // Ponta externa com caimento de 14cm
        const drop = 0.14;
        const tipX = mountX + dirX * radiusM;
        const tipY = caseY - drop;
        const tipZ = pivotZ + dirZ * radiusM;
        outerPoints.push(new THREE.Vector3(tipX, tipY, tipZ));

        // Braço radial em tubo retangular de alumínio estrutural
        const armGeo = new THREE.BoxGeometry(0.024, 0.035, radiusM);
        const armCenter = new THREE.Vector3(
          mountX + (dirX * radiusM) / 2,
          caseY - drop / 2,
          pivotZ + (dirZ * radiusM) / 2
        );
        const armMesh = new THREE.Mesh(armGeo, metalMat);
        armMesh.position.copy(armCenter);
        // Orienta perfeitamente do pivô até a ponta externa
        armMesh.lookAt(new THREE.Vector3(tipX, caseY - drop, tipZ));
        armMesh.castShadow = true;
        this.awningMeshesGroup.add(armMesh);

        // Terminal do braço com olhal
        const tipGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.04, 12);
        const tipMesh = new THREE.Mesh(tipGeo, pivotMat);
        tipMesh.position.set(tipX, tipY, tipZ);
        this.awningMeshesGroup.add(tipMesh);

        // Postes verticais telescópicos de apoio ao solo (nos braços 1, 3 e 5)
        if (idx === 0 || idx === 2 || idx === 4) {
          const poleH = tipY;
          const poleGeo = new THREE.CylinderGeometry(0.014, 0.014, poleH, 16);
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

      // Lona em leque contínuo multifacetada conectando o pivô central a todos os braços
      const lonaGeo = new THREE.BufferGeometry();
      const vertices: number[] = [];

      for (let i = 0; i < outerPoints.length - 1; i++) {
        const p1 = outerPoints[i];
        const p2 = outerPoints[i + 1];

        // Triângulo frontal
        vertices.push(mountX, caseY, pivotZ);
        vertices.push(p1.x, p1.y, p1.z);
        vertices.push(p2.x, p2.y, p2.z);

        // Triângulo traseiro (double-sided)
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
