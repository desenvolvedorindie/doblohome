import * as THREE from 'three';
import { MaterialLibrary } from './Materials';

/**
 * Construtor dos Trilhos Telescópicos Heavy Duty (Aço zincado/inox)
 * Modela os 3 estágios da corrediça (calha fixa externa, estágio intermediário e trilho móvel interno)
 * para movimentos longitudinais e laterais.
 */
export class TelescopicRailsBuilder {
  /**
   * Adiciona corrediças telescópicas para expansão longitudinal (frente/trás)
   */
  static addLongitudinalRails(
    fixedGroup: THREE.Group,
    intermediateGroup: THREE.Group,
    movingGroup: THREE.Group,
    width: number,
    length: number,
    xCenter: number,
    yLevel: number,
    zCenter: number,
    directionSign: number,
    baseTopY: number
  ) {
    const mats = MaterialLibrary.materials;
    const railH = 0.024;
    const railW = 0.016;

    const railX_L = (xCenter - width / 2) - (railW / 2);
    const railX_R = (xCenter + width / 2) + (railW / 2);

    // 1. Calha Fixa no Rack Base (Stationary Outer Track) — alinhada exatamente com a posição retraída da gaveta na borda
    const baseTrackLength = length;
    const outerGeo = new THREE.BoxGeometry(railW, railH, baseTrackLength);
    const zBaseTrack = zCenter;

    const outerL = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerL.position.set(railX_L, yLevel, zBaseTrack);
    outerL.castShadow = true;
    outerL.userData = { isBar: true, isTelescopicRail: true, barLength: baseTrackLength, barLabel: 'Calha Fixa Base da Corrediça', profileSpec: 'Trilho Telescópico Heavy Duty' };
    if (fixedGroup) fixedGroup.add(outerL);

    const outerR = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerR.position.set(railX_R, yLevel, zBaseTrack);
    outerR.castShadow = true;
    outerR.userData = { isBar: true, isTelescopicRail: true, barLength: baseTrackLength, barLabel: 'Calha Fixa Base da Corrediça', profileSpec: 'Trilho Telescópico Heavy Duty' };
    if (fixedGroup) fixedGroup.add(outerR);

    // Braquetes de ancoragem vertical da calha fixa nas travessas do rack base
    const bracketHeight = Math.max(0.012, yLevel - railH / 2 - baseTopY);
    const bracketGeo = new THREE.BoxGeometry(railW + 0.02, bracketHeight, 0.04);
    const bracketCenterY = baseTopY + bracketHeight / 2;

    const zBrackets = [
      zBaseTrack - (baseTrackLength / 2) + 0.08,
      zBaseTrack + (baseTrackLength / 2) - 0.08
    ];
    zBrackets.forEach(zb => {
      const bL = new THREE.Mesh(bracketGeo, mats.telescopicRail);
      bL.position.set(railX_L, bracketCenterY, zb);
      if (fixedGroup) fixedGroup.add(bL);

      const bR = new THREE.Mesh(bracketGeo, mats.telescopicRail);
      bR.position.set(railX_R, bracketCenterY, zb);
      if (fixedGroup) fixedGroup.add(bR);
    });

    // 2. Braço Telescópico Intermediário (Intermediate Extension Beam)
    const interLength = baseTrackLength * 0.96;
    const interGeo = new THREE.BoxGeometry(railW * 0.82, railH * 0.82, interLength);

    const interL = new THREE.Mesh(interGeo, mats.telescopicInner);
    interL.position.set(railX_L, yLevel, zBaseTrack);
    interL.castShadow = true;
    interL.userData = { isBar: true, isTelescopicRail: true, barLength: interLength, barLabel: 'Braço Extensor da Corrediça', profileSpec: 'Aço Laminado / Corrediça' };
    if (intermediateGroup) intermediateGroup.add(interL);

    const interR = new THREE.Mesh(interGeo, mats.telescopicInner);
    interR.position.set(railX_R, yLevel, zBaseTrack);
    interR.castShadow = true;
    interR.userData = { isBar: true, isTelescopicRail: true, barLength: interLength, barLabel: 'Braço Extensor da Corrediça', profileSpec: 'Aço Laminado / Corrediça' };
    if (intermediateGroup) intermediateGroup.add(interR);

    // 3. Trilho Interno Solidário à Bandeja Móvel (Inner Tray Slider)
    const innerGeo = new THREE.BoxGeometry(railW * 0.65, railH * 0.65, length);

    const innerL = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerL.position.set(railX_L, yLevel, zCenter);
    innerL.userData = { isBar: true, isTelescopicRail: true, barLength: length, barLabel: 'Trilho Móvel da Gaveta', profileSpec: 'Corrediça Telescópica' };
    if (movingGroup) movingGroup.add(innerL);

    const innerR = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerR.position.set(railX_R, yLevel, zCenter);
    innerR.userData = { isBar: true, isTelescopicRail: true, barLength: length, barLabel: 'Trilho Móvel da Gaveta', profileSpec: 'Corrediça Telescópica' };
    if (movingGroup) movingGroup.add(innerR);

    // Braquetes de fixação na moldura da bandeja
    const trayBracketGeo = new THREE.BoxGeometry(0.012, railH, 0.035);
    const stepZ = length / 3;
    for (let i = -1; i <= 1; i++) {
      const bz = zCenter + i * stepZ;
      const tbL = new THREE.Mesh(trayBracketGeo, mats.telescopicRail);
      tbL.position.set(railX_L + railW / 2 + 0.006, yLevel, bz);
      if (movingGroup) movingGroup.add(tbL);

      const tbR = new THREE.Mesh(trayBracketGeo, mats.telescopicRail);
      tbR.position.set(railX_R - railW / 2 - 0.006, yLevel, bz);
      if (movingGroup) movingGroup.add(tbR);
    }
  }

  /**
   * Adiciona corrediças telescópicas para expansão lateral (asas/toldo)
   */
  static addLateralRails(
    fixedGroup: THREE.Group,
    intermediateGroup: THREE.Group,
    movingGroup: THREE.Group,
    width: number,
    length: number,
    xCenter: number,
    yLevel: number,
    zCenter: number,
    directionSign: number,
    baseTopY: number
  ) {
    const mats = MaterialLibrary.materials;
    const railH = 0.024;
    const railL = 0.016;

    const railZ_F = (zCenter + length / 2) + (railL / 2);
    const railZ_R = (zCenter - length / 2) - (railL / 2);

    // 1. Calhas transversais fixas no rack base — alinhadas exatamente à posição retraída da gaveta na borda lateral
    const baseTrackWidth = width;
    const outerGeo = new THREE.BoxGeometry(baseTrackWidth, railH, railL);
    const xBaseTrack = xCenter;

    const outerF = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerF.position.set(xBaseTrack, yLevel, railZ_F);
    outerF.userData = { isBar: true, isTelescopicRail: true, barLength: baseTrackWidth, barLabel: 'Calha Fixa Transversal da Corrediça', profileSpec: 'Trilho Telescópico Lateral' };
    if (fixedGroup) fixedGroup.add(outerF);

    const outerR = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerR.position.set(xBaseTrack, yLevel, railZ_R);
    outerR.userData = { isBar: true, isTelescopicRail: true, barLength: baseTrackWidth, barLabel: 'Calha Fixa Transversal da Corrediça', profileSpec: 'Trilho Telescópico Lateral' };
    if (fixedGroup) fixedGroup.add(outerR);

    // Suportes verticais conectando a calha fixa à base do rack
    const bracketHeight = Math.max(0.012, yLevel - railH / 2 - baseTopY);
    const bracketGeo = new THREE.BoxGeometry(0.035, bracketHeight, railL + 0.010);
    const bracketCenterY = baseTopY + bracketHeight / 2;
    const xAnchorPoints = [
      xBaseTrack - (baseTrackWidth / 2) + 0.06,
      xBaseTrack + (baseTrackWidth / 2) - 0.06
    ];

    xAnchorPoints.forEach(bx => {
      const bF = new THREE.Mesh(bracketGeo, mats.telescopicRail);
      bF.position.set(bx, bracketCenterY, railZ_F);
      if (fixedGroup) fixedGroup.add(bF);

      const bR = new THREE.Mesh(bracketGeo, mats.telescopicRail);
      bR.position.set(bx, bracketCenterY, railZ_R);
      if (fixedGroup) fixedGroup.add(bR);
    });

    // 2. Braço intermediário telescópico lateral
    const interWidth = baseTrackWidth * 0.96;
    const interGeo = new THREE.BoxGeometry(interWidth, railH * 0.82, railL * 0.82);

    const interF = new THREE.Mesh(interGeo, mats.telescopicInner);
    interF.position.set(xBaseTrack, yLevel, railZ_F);
    interF.userData = { isBar: true, isTelescopicRail: true, barLength: interWidth, barLabel: 'Braço Extensor Lateral da Corrediça', profileSpec: 'Trilho Telescópico Lateral' };
    if (intermediateGroup) intermediateGroup.add(interF);

    const interR = new THREE.Mesh(interGeo, mats.telescopicInner);
    interR.position.set(xBaseTrack, yLevel, railZ_R);
    interR.userData = { isBar: true, isTelescopicRail: true, barLength: interWidth, barLabel: 'Braço Extensor Lateral da Corrediça', profileSpec: 'Trilho Telescópico Lateral' };
    if (intermediateGroup) intermediateGroup.add(interR);

    // 3. Trilho interno solidário à bandeja lateral
    const innerGeo = new THREE.BoxGeometry(width, railH * 0.65, railL * 0.65);

    const innerF = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerF.position.set(xCenter, yLevel, railZ_F);
    innerF.userData = { isBar: true, isTelescopicRail: true, barLength: width, barLabel: 'Trilho Móvel da Gaveta Lateral', profileSpec: 'Trilho Telescópico Lateral' };
    if (movingGroup) movingGroup.add(innerF);

    const innerR = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerR.position.set(xCenter, yLevel, railZ_R);
    innerR.userData = { isBar: true, isTelescopicRail: true, barLength: width, barLabel: 'Trilho Móvel da Gaveta Lateral', profileSpec: 'Trilho Telescópico Lateral' };
    if (movingGroup) movingGroup.add(innerR);
  }
}

