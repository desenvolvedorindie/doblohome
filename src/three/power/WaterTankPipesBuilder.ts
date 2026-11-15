import * as THREE from 'three';
import { MaterialLibrary } from '../Materials';
import { TextureGenerator } from '../Textures';

/**
 * Curva paramétrica para o joelho PVC 90°
 */
export class QuarterArcCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    public centerX: number,
    public centerZ: number,
    public radius: number,
    public startAngle: number,
    public endAngle: number
  ) {
    super();
  }
  getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
    const angle = this.startAngle + t * (this.endAngle - this.startAngle);
    return optionalTarget.set(
      this.centerX + this.radius * Math.cos(angle),
      0,
      this.centerZ + this.radius * Math.sin(angle)
    );
  }
}

export class WaterTankPipesBuilder {
  /**
   * Constrói a Caixa d'Água em formato de U 100% instalada DENTRO da estrutura de ferro (subchassi 1,40m × 2,20m)
   * Suporta configuração da conexão frontal ou traseira, com montagem do Tê 90°, pedaço de cano vertical,
   * CAP superior e tampinha hermética de inspeção/abastecimento no topo do CAP.
   */
  static buildWaterTankPipes(
    targetGroup: THREE.Group,
    enabled: boolean,
    lengthMmInput: number,
    baseY: number,
    zCenter: number,
    labelsGroup?: THREE.Group,
    diameterMmInput: number = 200,
    _cargoBoxEnabled: boolean = true,
    _cargoBoxLengthM: number = 1.60,
    connectionPosition: 'front' | 'rear' = 'front'
  ) {
    if (!enabled) return;

    const mats = MaterialLibrary.materials;
    const BASE_MAX_MM = 2200;
    const lengthMm = Math.max(400, Math.min(BASE_MAX_MM, Math.round(lengthMmInput || BASE_MAX_MM)));
    const diameterMm = Math.max(80, Math.min(350, Math.round(diameterMmInput || 200)));
    const radiusMm = +(diameterMm / 2).toFixed(1);
    const lateralLengthM = lengthMm / 1000;
    const radiusM = radiusMm / 1000;
    const radiusDm = radiusMm / 100;
    const isRear = connectionPosition === 'rear';

    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.25
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.45,
      metalness: 0.20
    });
    const waterAccentMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.3
    });
    const clampMat = mats.stainlessHinge || new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.25,
      metalness: 0.85
    });
    const brassMat = mats.kingboBrass || new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.3,
      metalness: 0.8
    });

    const baseHalfWidth = 0.70;
    const frameInnerX = baseHalfWidth - 0.04;
    const pipeOffsetX = frameInnerX - radiusM;
    const pipeCenterY = baseY + 0.02;

    const zFrontFrame = zCenter + (BASE_MAX_MM / 2) / 1000;
    const zRearFrame = zCenter - (BASE_MAX_MM / 2) / 1000;
    const zInnerFront = zFrontFrame - 0.04;
    const zInnerRear = zRearFrame + 0.04;

    const bendR = Math.max(0.06, radiusM * 1.35);

    // Z da tubulação transversal (frente ou trás)
    const zTransversePipe = isRear ? (zInnerRear + radiusM) : (zInnerFront - radiusM);
    // Ponto onde as laterais começam a correr ao longo do chassi
    const zPipeStart = isRear ? (zTransversePipe + bendR) : (zTransversePipe - bendR);
    const maxAvailableLateral = isRear ? (zInnerFront - zPipeStart) : (zPipeStart - zInnerRear);
    const lateralPipeLengthM = Math.max(0.20, Math.min(lateralLengthM - bendR, maxAvailableLateral));
    const zEndCaps = isRear ? (zPipeStart + lateralPipeLengthM) : (zPipeStart - lateralPipeLengthM);

    const transversePipeSpan = (pipeOffsetX - bendR) * 2;
    const transversePipeLengthM = Math.max(0.20, transversePipeSpan);

    // Dimensões do Tê 90° e divisões
    const teeRunLengthM = Math.min(0.24, radiusM * 2.2);
    const teeSocketDepthM = Math.max(0.035, radiusM * 0.35);
    const teeCollarRadiusM = radiusM * 1.07;
    const transverseSegmentLengthM = Math.max(0.08, +( (transversePipeLengthM / 2) - (teeRunLengthM / 2 - teeSocketDepthM) ).toFixed(3));
    const verticalNippleLengthM = Math.max(0.08, Math.min(0.14, +(radiusM * 1.0).toFixed(3)));

    const totalEffectiveLengthM = 2 * lateralLengthM + transversePipeLengthM + Math.PI * bendR;
    const singleLateralLiters = +(Math.PI * radiusDm * radiusDm * (lateralLengthM * 10)).toFixed(1);
    const frontCircuitLiters = +(Math.PI * radiusDm * radiusDm * ((transversePipeLengthM + Math.PI * bendR) * 10)).toFixed(1);
    const totalLiters = +(Math.PI * radiusDm * radiusDm * (totalEffectiveLengthM * 10)).toFixed(1);

    const waterTankMasterGroup = new THREE.Group();
    waterTankMasterGroup.name = "WaterTank_UShape_Assembly";

    // 1. Canos Laterais
    const sides: Array<{ sign: -1 | 1; sideName: string }> = [
      { sign: -1, sideName: 'Lado Esquerdo (Motorista)' },
      { sign: 1, sideName: 'Lado Direito (Passageiro)' }
    ];

    sides.forEach(({ sign }) => {
      const lateralPipeGroup = new THREE.Group();
      lateralPipeGroup.name = `WaterTankLateral_${sign < 0 ? 'Left' : 'Right'}`;

      const zLateralCenter = isRear
        ? (zPipeStart + lateralPipeLengthM / 2)
        : (zPipeStart - lateralPipeLengthM / 2);

      const bodyGeo = new THREE.CylinderGeometry(radiusM, radiusM, lateralPipeLengthM, 28);
      bodyGeo.rotateX(Math.PI / 2);
      const bodyMesh = new THREE.Mesh(bodyGeo, pipeMat);
      bodyMesh.position.set(sign * pipeOffsetX, pipeCenterY, zLateralCenter);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      lateralPipeGroup.add(bodyMesh);

      // CAP de fechamento na ponta da lateral
      const capLen = 0.045;
      const capRadius = radiusM * 1.05;
      const domeH = Math.max(0.020, radiusM * 0.26);

      const capBodyGeo = new THREE.CylinderGeometry(capRadius, capRadius, capLen, 28);
      capBodyGeo.rotateX(Math.PI / 2);
      const endCap = new THREE.Mesh(capBodyGeo, capMat);
      const zCapCenter = isRear ? (zEndCaps + capLen / 2 - 0.005) : (zEndCaps - capLen / 2 + 0.005);
      endCap.position.set(sign * pipeOffsetX, pipeCenterY, zCapCenter);
      endCap.castShadow = true;
      lateralPipeGroup.add(endCap);

      // Domo abaulado do CAP
      const domePts: THREE.Vector2[] = [];
      const domeSegs = 10;
      for (let di = 0; di <= domeSegs; di++) {
        const dFrac = di / domeSegs;
        const dAng = dFrac * (Math.PI / 2);
        const zDomeSign = isRear ? 1 : -1;
        domePts.push(new THREE.Vector2(capRadius * Math.cos(dAng), zDomeSign * domeH * Math.sin(dAng)));
      }
      const domeGeo = new THREE.LatheGeometry(domePts, 28);
      domeGeo.rotateX(Math.PI / 2);
      const capDome = new THREE.Mesh(domeGeo, capMat);
      const zDomeCenter = isRear ? (zEndCaps + capLen - 0.005) : (zEndCaps - capLen + 0.005);
      capDome.position.set(sign * pipeOffsetX, pipeCenterY, zDomeCenter);
      capDome.castShadow = true;
      lateralPipeGroup.add(capDome);

      const stripeLen = Math.max(0.15, lateralPipeLengthM - 0.12);
      const stripeGeo = new THREE.BoxGeometry(0.006, 0.024, stripeLen);
      const stripeMesh = new THREE.Mesh(stripeGeo, waterAccentMat);
      stripeMesh.position.set(sign * (pipeOffsetX - radiusM * 0.98), pipeCenterY + 0.015, zLateralCenter);
      lateralPipeGroup.add(stripeMesh);

      // Registros / torneiras de esfera de latão instalados na traseira da van
      const valveZ = isRear ? (zTransversePipe - 0.024) : (zEndCaps - 0.024);
      const valveBody = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.038, 12), brassMat);
      valveBody.rotation.x = Math.PI / 2;
      valveBody.position.set(sign * pipeOffsetX, pipeCenterY - radiusM * 0.42, valveZ);
      lateralPipeGroup.add(valveBody);

      const valveHandle = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.038, 0.010), waterAccentMat);
      valveHandle.position.set(sign * pipeOffsetX, pipeCenterY - radiusM * 0.42 + 0.016, valveZ - 0.008);
      lateralPipeGroup.add(valveHandle);

      // Abraçadeiras nas laterais
      const bracketCount = lateralPipeLengthM >= 1.4 ? 3 : 2;
      for (let i = 0; i < bracketCount; i++) {
        const frac = bracketCount === 2 ? (i === 0 ? 0.22 : 0.78) : (0.15 + i * 0.35);
        const bz = isRear
          ? (zPipeStart + lateralPipeLengthM * frac)
          : (zPipeStart - lateralPipeLengthM * frac);

        const strapGeo = new THREE.CylinderGeometry(radiusM * 1.03, radiusM * 1.03, 0.022, 24);
        strapGeo.rotateX(Math.PI / 2);
        const strapMesh = new THREE.Mesh(strapGeo, clampMat);
        strapMesh.position.set(sign * pipeOffsetX, pipeCenterY, bz);
        lateralPipeGroup.add(strapMesh);

        const armLen = radiusM + 0.02;
        const armGeo = new THREE.BoxGeometry(armLen, 0.032, 0.026);
        const armMesh = new THREE.Mesh(armGeo, clampMat);
        armMesh.position.set(sign * (pipeOffsetX + armLen / 2), pipeCenterY - 0.015, bz);
        lateralPipeGroup.add(armMesh);
      }

      waterTankMasterGroup.add(lateralPipeGroup);
    });

    // 2. Joelhos de 90°
    if (!isRear) {
      // Conexão na dianteira: joelho curva de zTransversePipe para trás (-Z)
      const leftElbowCurve = new QuarterArcCurve(
        -pipeOffsetX + bendR,
        zTransversePipe - bendR,
        bendR,
        Math.PI / 2,
        Math.PI
      );
      const leftElbowGeo = new THREE.TubeGeometry(leftElbowCurve, 16, radiusM, 24, false);
      const leftElbowMesh = new THREE.Mesh(leftElbowGeo, pipeMat);
      leftElbowMesh.position.y = pipeCenterY;
      leftElbowMesh.castShadow = true;
      leftElbowMesh.receiveShadow = true;
      waterTankMasterGroup.add(leftElbowMesh);

      const rightElbowCurve = new QuarterArcCurve(
        pipeOffsetX - bendR,
        zTransversePipe - bendR,
        bendR,
        Math.PI / 2,
        0
      );
      const rightElbowGeo = new THREE.TubeGeometry(rightElbowCurve, 16, radiusM, 24, false);
      const rightElbowMesh = new THREE.Mesh(rightElbowGeo, pipeMat);
      rightElbowMesh.position.y = pipeCenterY;
      rightElbowMesh.castShadow = true;
      rightElbowMesh.receiveShadow = true;
      waterTankMasterGroup.add(rightElbowMesh);
    } else {
      // Conexão na traseira: joelho curva de zTransversePipe para frente (+Z)
      const leftElbowCurve = new QuarterArcCurve(
        -pipeOffsetX + bendR,
        zTransversePipe + bendR,
        bendR,
        -Math.PI / 2,
        -Math.PI
      );
      const leftElbowGeo = new THREE.TubeGeometry(leftElbowCurve, 16, radiusM, 24, false);
      const leftElbowMesh = new THREE.Mesh(leftElbowGeo, pipeMat);
      leftElbowMesh.position.y = pipeCenterY;
      leftElbowMesh.castShadow = true;
      leftElbowMesh.receiveShadow = true;
      waterTankMasterGroup.add(leftElbowMesh);

      const rightElbowCurve = new QuarterArcCurve(
        pipeOffsetX - bendR,
        zTransversePipe + bendR,
        bendR,
        -Math.PI / 2,
        0
      );
      const rightElbowGeo = new THREE.TubeGeometry(rightElbowCurve, 16, radiusM, 24, false);
      const rightElbowMesh = new THREE.Mesh(rightElbowGeo, pipeMat);
      rightElbowMesh.position.y = pipeCenterY;
      rightElbowMesh.castShadow = true;
      rightElbowMesh.receiveShadow = true;
      waterTankMasterGroup.add(rightElbowMesh);
    }

    // Bolsas de encaixe dos joelhos
    const socketRingGeoZ = new THREE.CylinderGeometry(radiusM * 1.055, radiusM * 1.055, 0.032, 24);
    socketRingGeoZ.rotateX(Math.PI / 2);
    const socketRingGeoX = new THREE.CylinderGeometry(radiusM * 1.055, radiusM * 1.055, 0.032, 24);
    socketRingGeoX.rotateZ(Math.PI / 2);

    [-pipeOffsetX, pipeOffsetX].forEach((xPos) => {
      const ringZ = new THREE.Mesh(socketRingGeoZ, capMat);
      ringZ.position.set(xPos, pipeCenterY, zPipeStart);
      waterTankMasterGroup.add(ringZ);
    });

    [-pipeOffsetX + bendR, pipeOffsetX - bendR].forEach((xPos) => {
      const ringX = new THREE.Mesh(socketRingGeoX, capMat);
      ringX.position.set(xPos, pipeCenterY, zTransversePipe);
      waterTankMasterGroup.add(ringX);
    });

    // 3. Conexão Transversal: Canos Esquerdo/Direito, Tê 90°, Niple Vertical, CAP Superior e Tampinha
    const transverseGroup = new THREE.Group();
    transverseGroup.name = `WaterTankTransverseAssembly_${isRear ? 'Rear' : 'Front'}`;

    // A) Corpo Central do Tê 90°
    const teeBodyGeo = new THREE.CylinderGeometry(radiusM * 1.04, radiusM * 1.04, teeRunLengthM, 28);
    teeBodyGeo.rotateZ(Math.PI / 2);
    const teeBodyMesh = new THREE.Mesh(teeBodyGeo, capMat);
    teeBodyMesh.position.set(0, pipeCenterY, zTransversePipe);
    teeBodyMesh.castShadow = true;
    transverseGroup.add(teeBodyMesh);

    // Bolsas laterais de encaixe do Tê
    const teeCollarGeoX = new THREE.CylinderGeometry(teeCollarRadiusM, teeCollarRadiusM, 0.024, 24);
    teeCollarGeoX.rotateZ(Math.PI / 2);
    const teeCollarLeft = new THREE.Mesh(teeCollarGeoX, capMat);
    teeCollarLeft.position.set(-teeRunLengthM / 2 + 0.012, pipeCenterY, zTransversePipe);
    transverseGroup.add(teeCollarLeft);

    const teeCollarRight = new THREE.Mesh(teeCollarGeoX, capMat);
    teeCollarRight.position.set(teeRunLengthM / 2 - 0.012, pipeCenterY, zTransversePipe);
    transverseGroup.add(teeCollarRight);

    // Derivação vertical do Tê 90° (para cima)
    const teeBranchHeightM = radiusM + 0.038;
    const teeBranchGeo = new THREE.CylinderGeometry(radiusM * 1.04, radiusM * 1.04, teeBranchHeightM, 28);
    const teeBranchMesh = new THREE.Mesh(teeBranchGeo, capMat);
    teeBranchMesh.position.set(0, pipeCenterY + teeBranchHeightM / 2, zTransversePipe);
    teeBranchMesh.castShadow = true;
    transverseGroup.add(teeBranchMesh);

    // Bolsa vertical superior do Tê
    const teeCollarTopGeo = new THREE.CylinderGeometry(teeCollarRadiusM, teeCollarRadiusM, 0.024, 24);
    const teeCollarTop = new THREE.Mesh(teeCollarTopGeo, capMat);
    teeCollarTop.position.set(0, pipeCenterY + teeBranchHeightM - 0.012, zTransversePipe);
    transverseGroup.add(teeCollarTop);

    // B) Cano Transversal Esquerdo (dividido pelo Tê)
    const xLeftCenter = -((pipeOffsetX - bendR) + (teeRunLengthM / 2 - teeSocketDepthM)) / 2;
    const leftTransGeo = new THREE.CylinderGeometry(radiusM, radiusM, transverseSegmentLengthM, 28);
    leftTransGeo.rotateZ(Math.PI / 2);
    const leftTransMesh = new THREE.Mesh(leftTransGeo, pipeMat);
    leftTransMesh.position.set(xLeftCenter, pipeCenterY, zTransversePipe);
    leftTransMesh.castShadow = true;
    leftTransMesh.receiveShadow = true;
    transverseGroup.add(leftTransMesh);

    const stripeLeftGeo = new THREE.BoxGeometry(transverseSegmentLengthM * 0.75, 0.024, 0.006);
    const stripeLeftMesh = new THREE.Mesh(stripeLeftGeo, waterAccentMat);
    const stripeZOffset = (isRear ? -1 : 1) * (radiusM * 0.98);
    stripeLeftMesh.position.set(xLeftCenter, pipeCenterY + 0.015, zTransversePipe + stripeZOffset);
    transverseGroup.add(stripeLeftMesh);

    // C) Cano Transversal Direito (dividido pelo Tê)
    const xRightCenter = ((pipeOffsetX - bendR) + (teeRunLengthM / 2 - teeSocketDepthM)) / 2;
    const rightTransGeo = new THREE.CylinderGeometry(radiusM, radiusM, transverseSegmentLengthM, 28);
    rightTransGeo.rotateZ(Math.PI / 2);
    const rightTransMesh = new THREE.Mesh(rightTransGeo, pipeMat);
    rightTransMesh.position.set(xRightCenter, pipeCenterY, zTransversePipe);
    rightTransMesh.castShadow = true;
    rightTransMesh.receiveShadow = true;
    transverseGroup.add(rightTransMesh);

    const stripeRightGeo = new THREE.BoxGeometry(transverseSegmentLengthM * 0.75, 0.024, 0.006);
    const stripeRightMesh = new THREE.Mesh(stripeRightGeo, waterAccentMat);
    stripeRightMesh.position.set(xRightCenter, pipeCenterY + 0.015, zTransversePipe + stripeZOffset);
    transverseGroup.add(stripeRightMesh);

    // D) Pedacinho do cano vertical entre o Tê e o CAP superior
    const yNippleBottom = pipeCenterY + teeBranchHeightM - 0.020;
    const yNippleCenter = yNippleBottom + verticalNippleLengthM / 2;
    const nippleGeo = new THREE.CylinderGeometry(radiusM, radiusM, verticalNippleLengthM, 28);
    const nippleMesh = new THREE.Mesh(nippleGeo, pipeMat);
    nippleMesh.position.set(0, yNippleCenter, zTransversePipe);
    nippleMesh.castShadow = true;
    transverseGroup.add(nippleMesh);

    // E) CAP Superior (Tampão de PVC montado sobre o pedacinho de cano)
    const capTopHeightM = Math.max(0.040, radiusM * 0.38);
    const capTopRadiusM = radiusM * 1.055;
    const yCapTopCenter = yNippleBottom + verticalNippleLengthM - capTopHeightM / 2 + 0.012;
    const capTopGeo = new THREE.CylinderGeometry(capTopRadiusM, capTopRadiusM, capTopHeightM, 28);
    const capTopMesh = new THREE.Mesh(capTopGeo, capMat);
    capTopMesh.position.set(0, yCapTopCenter, zTransversePipe);
    capTopMesh.castShadow = true;
    transverseGroup.add(capTopMesh);

    // Anel reforçado da bolsa do CAP superior
    const capTopRingGeo = new THREE.CylinderGeometry(capTopRadiusM * 1.03, capTopRadiusM * 1.03, 0.014, 28);
    const capTopRingMesh = new THREE.Mesh(capTopRingGeo, capMat);
    capTopRingMesh.position.set(0, yCapTopCenter - capTopHeightM / 2 + 0.007, zTransversePipe);
    transverseGroup.add(capTopRingMesh);

    const yCapTopSurface = yCapTopCenter + capTopHeightM / 2;

    // F) Tampinha Hermética de Inspeção / Abastecimento em cima do CAP
    const fillerFlangeRadius = Math.min(0.038, radiusM * 0.40);
    const fillerFlangeH = 0.014;
    const fillerFlangeGeo = new THREE.CylinderGeometry(fillerFlangeRadius, fillerFlangeRadius * 1.05, fillerFlangeH, 20);
    const fillerFlangeMesh = new THREE.Mesh(fillerFlangeGeo, capMat);
    fillerFlangeMesh.position.set(0, yCapTopSurface + fillerFlangeH / 2, zTransversePipe);
    transverseGroup.add(fillerFlangeMesh);

    const fillerCapRadius = Math.min(0.044, radiusM * 0.46);
    const fillerCapH = 0.016;
    const fillerCapGeo = new THREE.CylinderGeometry(fillerCapRadius, fillerCapRadius, fillerCapH, 20);
    const fillerCap = new THREE.Mesh(fillerCapGeo, waterAccentMat);
    fillerCap.position.set(0, yCapTopSurface + fillerFlangeH + fillerCapH / 2, zTransversePipe);
    fillerCap.castShadow = true;
    transverseGroup.add(fillerCap);

    // Aletas/manípulo de aperto manual da tampinha
    const fillerTabGeo = new THREE.BoxGeometry(fillerCapRadius * 1.8, 0.008, 0.016);
    const fillerTabMesh = new THREE.Mesh(fillerTabGeo, waterAccentMat);
    fillerTabMesh.position.set(0, yCapTopSurface + fillerFlangeH + fillerCapH + 0.004, zTransversePipe);
    transverseGroup.add(fillerTabMesh);

    // Válvula de respiro automática em latão
    const breatherMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.022, 12), brassMat);
    breatherMesh.position.set(radiusM * 0.55, yCapTopSurface + 0.011, zTransversePipe);
    transverseGroup.add(breatherMesh);

    // Abraçadeiras do cano transversal
    [-0.25, 0.25].forEach((fx) => {
      const transStrap = new THREE.Mesh(socketRingGeoX.clone(), clampMat);
      transStrap.position.set(fx, pipeCenterY, zTransversePipe);
      transverseGroup.add(transStrap);

      const transArmGeo = new THREE.BoxGeometry(0.032, 0.032, radiusM + 0.02);
      const transArm = new THREE.Mesh(transArmGeo, clampMat);
      const armZOffset = (isRear ? -1 : 1) * (radiusM * 0.5 + 0.01);
      transArm.position.set(fx, pipeCenterY - 0.015, zTransversePipe + armZOffset);
      transverseGroup.add(transArm);
    });

    waterTankMasterGroup.add(transverseGroup);

    // 4. Metadados para clique e inspeção técnica
    const posDesc = isRear ? 'Traseira (acima do porta-malas)' : 'Dianteira (frente do rack)';
    const waterUserData = {
      isElectrical: true,
      isElectricalRoot: true,
      electricalType: 'water' as const,
      name: `Caixa d'Água em U (Conexão ${posDesc} · Tê 90° + CAP + Tampinha · Ø${diameterMm}mm)`,
      category: `Reservatório Hidráulico Contínuo em U ao Redor do Baú (Ø${diameterMm}mm)`,
      voltage: `Raio: ${radiusMm} mm (Ø${diameterMm} mm) • Extensão Total: ${totalEffectiveLengthM.toFixed(2)} m`,
      capacity: `${totalLiters} Litros Total (${singleLateralLiters}L lateral esq. + ${singleLateralLiters}L lateral dir. + ${frontCircuitLiters}L circuito transversal)`,
      current: `Estrutura: 2× Laterais (${(lateralPipeLengthM * 1000).toFixed(0)}mm) + 2× Transversais (${(transverseSegmentLengthM * 1000).toFixed(0)}mm) + 1× Niple Vertical (${(verticalNippleLengthM * 1000).toFixed(0)}mm) + Tê 90° + 3× CAPs`,
      power: `Peso da Água: +${totalLiters} kg cheio`,
      material: `Tubos PVC Série R Ø${diameterMm}mm + 1× Tê 90° + 2× Joelhos 90° + 3× CAPs Soldáveis + Tampinha Rosqueável + Registros Latão 1/2"`,
      purpose: `Reserva de água contínua em U instalada no quadro interno, com conexão na ${posDesc}`,
      efficiency: '100% embutido dentro da largura de 1,40m da estrutura de ferro (não projeta nas laterais da van)',
      features: [
        `Estrutura contínua em U dentro do ferro (${totalLiters} L)`,
        `Conexão e bocal posicionados na ${posDesc}`,
        `1× Tê PVC 90° Ø${diameterMm}mm central interligando as tubulações`,
        `1× Niple vertical de ${(verticalNippleLengthM * 1000).toFixed(0)}mm entre o Tê e o CAP superior`,
        `1× CAP Ø${diameterMm}mm com Tampinha rosqueável no topo para abastecimento e inspeção`,
        `2× Canos transversais de ${(transverseSegmentLengthM * 1000).toFixed(0)}mm cada`,
        `2× Canos laterais longitudinais de ${(lateralPipeLengthM * 1000).toFixed(0)}mm`,
        '2× Registros de latão na traseira para saída de água e ducha',
        'Nível equalizado por gravidade e vedação estanque hermética'
      ]
    };

    waterTankMasterGroup.userData = waterUserData;
    waterTankMasterGroup.traverse((c) => {
      if ((c as any).isMesh) {
        c.userData = { ...waterUserData, isElectricalRoot: false, electricalRoot: waterTankMasterGroup };
      }
    });

    targetGroup.add(waterTankMasterGroup);

    // 5. Etiqueta 3D
    if (typeof document !== 'undefined') {
      const posShortLabel = isRear ? 'TRASEIRA' : 'DIANTEIRA';
      const waterLabel = TextureGenerator.createDimensionSprite(
        `💧 CAIXA D'ÁGUA EM U (${posShortLabel}): R=${radiusMm}mm / Ø${diameterMm}mm (${totalLiters} L)`,
        `Tê 90° + Bocal Superior • Transv. 2× ${(transverseSegmentLengthM * 1000).toFixed(0)}mm • Laterais 2× ${(lateralPipeLengthM * 1000).toFixed(0)}mm`,
        'rgba(8, 47, 73, 0.94)',
        '#38bdf8'
      );
      waterLabel.position.set(0, yCapTopSurface + 0.16, zTransversePipe);
      if (labelsGroup) {
        labelsGroup.add(waterLabel);
      } else {
        targetGroup.add(waterLabel);
      }
    }
  }
}
