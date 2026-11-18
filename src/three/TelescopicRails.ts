import * as THREE from 'three';
import { MaterialLibrary } from './Materials';

/**
 * Construtor do Sistema Deslizante do Rack de Teto
 * Sistema por Perfis de Alumínio Guiados com Parafusos Deslizantes em Aço Inox e Arruelas de Nylon/Teflon.
 * Substitui corrediças telescópicas de gaveta de aço por um sistema imune a poeira, lama e oxidação externa.
 */
export class TelescopicRailsBuilder {
  /**
   * Cria um conjunto de parafuso guia M8 inox com arruela espaçadora deslizante em nylon/teflon
   */
  private static createGuideBolt(
    mats: any,
    axis: 'x' | 'z',
    headSide: 1 | -1
  ): THREE.Group {
    const boltGroup = new THREE.Group();

    // 1. Eixo do parafuso M8 (Inox)
    const shaftGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.026, 12);
    if (axis === 'x') {
      shaftGeo.rotateZ(Math.PI / 2);
    } else {
      shaftGeo.rotateX(Math.PI / 2);
    }
    const shaft = new THREE.Mesh(shaftGeo, mats.telescopicRail);
    shaft.castShadow = true;
    boltGroup.add(shaft);

    // 2. Cabeça do parafuso (flangeada M8 inox)
    const headGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.004, 12);
    if (axis === 'x') {
      headGeo.rotateZ(Math.PI / 2);
    } else {
      headGeo.rotateX(Math.PI / 2);
    }
    const head = new THREE.Mesh(headGeo, mats.telescopicRail);
    if (axis === 'x') {
      head.position.x = headSide * 0.013;
    } else {
      head.position.z = headSide * 0.013;
    }
    head.castShadow = true;
    boltGroup.add(head);

    // 3. Arruela deslizante em Nylon / Teflon (baixo atrito e sem folga metálica)
    const washerGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.003, 14);
    if (axis === 'x') {
      washerGeo.rotateZ(Math.PI / 2);
    } else {
      washerGeo.rotateX(Math.PI / 2);
    }
    const washerMat = mats.flexiblePanelSubstrate || mats.telescopicRail;
    const washer = new THREE.Mesh(washerGeo, washerMat);
    boltGroup.add(washer);

    // 4. Porca auto-travante M8 Parlock (Inox)
    const nutGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 0.0045, 6);
    if (axis === 'x') {
      nutGeo.rotateZ(Math.PI / 2);
    } else {
      nutGeo.rotateX(Math.PI / 2);
    }
    const nut = new THREE.Mesh(nutGeo, mats.telescopicRail);
    if (axis === 'x') {
      nut.position.x = -headSide * 0.013;
    } else {
      nut.position.z = -headSide * 0.013;
    }
    nut.castShadow = true;
    boltGroup.add(nut);

    boltGroup.userData = {
      isBoltGuide: true,
      barLabel: 'Parafuso Guia Deslizante M8 Inox c/ Arruela Teflon',
      profileSpec: 'Parafuso Inox M8 Flangeado + Arruela Deslizante Nylon/Teflon',
    };

    return boltGroup;
  }

  /**
   * Adiciona guias de deslizamento entre 2 perfis de alumínio com parafusos guia para expansão longitudinal (frente/trás)
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
    const railH = 0.020; // Perfil alumínio 20x20 mm
    const railW = 0.020;

    const railX_L = (xCenter - width / 2) - (railW / 2);
    const railX_R = (xCenter + width / 2) + (railW / 2);

    // 1. Perfil de Alumínio Guia Fixo no Rack Base (Trilho Guia com Canal)
    const baseTrackLength = length;
    const outerGeo = new THREE.BoxGeometry(railW, railH, baseTrackLength);
    const zBaseTrack = zCenter;

    const outerL = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerL.position.set(railX_L, yLevel, zBaseTrack);
    outerL.castShadow = true;
    outerL.userData = {
      isBar: true,
      isTelescopicRail: true,
      isRailGuide: true,
      barLength: baseTrackLength,
      barLabel: 'Perfil Alumínio Guia do Rack (Trilho Fixo)',
      profileSpec: 'Perfil Alumínio Guia 20x20 c/ Canal p/ Parafuso'
    };
    if (fixedGroup) fixedGroup.add(outerL);

    const outerR = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerR.position.set(railX_R, yLevel, zBaseTrack);
    outerR.castShadow = true;
    outerR.userData = {
      isBar: true,
      isTelescopicRail: true,
      isRailGuide: true,
      barLength: baseTrackLength,
      barLabel: 'Perfil Alumínio Guia do Rack (Trilho Fixo)',
      profileSpec: 'Perfil Alumínio Guia 20x20 c/ Canal p/ Parafuso'
    };
    if (fixedGroup) fixedGroup.add(outerR);

    // Braquetes de ancoragem vertical do perfil guia fixo nas travessas do rack base
    const bracketHeight = Math.max(0.012, yLevel - railH / 2 - baseTopY);
    const bracketGeo = new THREE.BoxGeometry(railW + 0.015, bracketHeight, 0.04);
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

    // 2. Perfil de Alumínio Deslizante Solidário à Bandeja Móvel
    const innerX_L = railX_L + railW;
    const innerX_R = railX_R - railW;
    const innerGeo = new THREE.BoxGeometry(railW, railH, length);

    const innerL = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerL.position.set(innerX_L, yLevel, zCenter);
    innerL.castShadow = true;
    innerL.userData = {
      isBar: true,
      isTelescopicRail: true,
      isRailRunner: true,
      barLength: length,
      barLabel: 'Perfil Alumínio Deslizante da Bandeja',
      profileSpec: 'Perfil Alumínio 20x20 Deslizante'
    };
    if (movingGroup) movingGroup.add(innerL);

    const innerR = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerR.position.set(innerX_R, yLevel, zCenter);
    innerR.castShadow = true;
    innerR.userData = {
      isBar: true,
      isTelescopicRail: true,
      isRailRunner: true,
      barLength: length,
      barLabel: 'Perfil Alumínio Deslizante da Bandeja',
      profileSpec: 'Perfil Alumínio 20x20 Deslizante'
    };
    if (movingGroup) movingGroup.add(innerR);

    // 3. Parafusos Guia Deslizantes em Aço Inox com Arruelas em Nylon/Teflon
    // Dispostos ao longo da interface de deslizamento entre os 2 perfis de alumínio
    const boltZPositions = [
      zCenter - (length * 0.35),
      zCenter,
      zCenter + (length * 0.35),
      zCenter + directionSign * (length * 0.44) // Parafuso limitador/batente de fim de curso
    ];

    const boltX_L = (railX_L + innerX_L) / 2;
    const boltX_R = (railX_R + innerX_R) / 2;

    boltZPositions.forEach(bz => {
      const boltL = this.createGuideBolt(mats, 'x', -1);
      boltL.position.set(boltX_L, yLevel, bz);
      if (movingGroup) movingGroup.add(boltL);

      const boltR = this.createGuideBolt(mats, 'x', 1);
      boltR.position.set(boltX_R, yLevel, bz);
      if (movingGroup) movingGroup.add(boltR);
    });

    // Braquetes de reforço e conexão do perfil deslizante à estrutura da bandeja
    const trayBracketGeo = new THREE.BoxGeometry(0.012, railH, 0.035);
    const stepZ = length / 3;
    for (let i = -1; i <= 1; i++) {
      const bz = zCenter + i * stepZ;
      const tbL = new THREE.Mesh(trayBracketGeo, mats.telescopicRail);
      tbL.position.set(innerX_L + railW / 2 + 0.005, yLevel, bz);
      if (movingGroup) movingGroup.add(tbL);

      const tbR = new THREE.Mesh(trayBracketGeo, mats.telescopicRail);
      tbR.position.set(innerX_R - railW / 2 - 0.005, yLevel, bz);
      if (movingGroup) movingGroup.add(tbR);
    }
  }

  /**
   * Adiciona guias de deslizamento entre 2 perfis de alumínio com parafusos guia para expansão lateral (asas/toldo)
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
    const railH = 0.020;
    const railL = 0.020;

    const railZ_F = (zCenter + length / 2) + (railL / 2);
    const railZ_R = (zCenter - length / 2) - (railL / 2);

    // 1. Perfis transversais fixos de alumínio no rack base
    const baseTrackWidth = width;
    const outerGeo = new THREE.BoxGeometry(baseTrackWidth, railH, railL);
    const xBaseTrack = xCenter;

    const outerF = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerF.position.set(xBaseTrack, yLevel, railZ_F);
    outerF.castShadow = true;
    outerF.userData = {
      isBar: true,
      isTelescopicRail: true,
      isRailGuide: true,
      barLength: baseTrackWidth,
      barLabel: 'Perfil Alumínio Guia Transversal do Rack (Trilho Fixo)',
      profileSpec: 'Perfil Alumínio Guia 20x20 c/ Canal p/ Parafuso'
    };
    if (fixedGroup) fixedGroup.add(outerF);

    const outerR = new THREE.Mesh(outerGeo, mats.telescopicRail);
    outerR.position.set(xBaseTrack, yLevel, railZ_R);
    outerR.castShadow = true;
    outerR.userData = {
      isBar: true,
      isTelescopicRail: true,
      isRailGuide: true,
      barLength: baseTrackWidth,
      barLabel: 'Perfil Alumínio Guia Transversal do Rack (Trilho Fixo)',
      profileSpec: 'Perfil Alumínio Guia 20x20 c/ Canal p/ Parafuso'
    };
    if (fixedGroup) fixedGroup.add(outerR);

    // Suportes verticais conectando os perfis guia à base do rack
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

    // 2. Perfis transversais deslizantes de alumínio da bandeja lateral
    const innerZ_F = railZ_F - railL;
    const innerZ_R = railZ_R + railL;
    const innerGeo = new THREE.BoxGeometry(width, railH, railL);

    const innerF = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerF.position.set(xCenter, yLevel, innerZ_F);
    innerF.castShadow = true;
    innerF.userData = {
      isBar: true,
      isTelescopicRail: true,
      isRailRunner: true,
      barLength: width,
      barLabel: 'Perfil Alumínio Deslizante da Bandeja Lateral',
      profileSpec: 'Perfil Alumínio 20x20 Deslizante'
    };
    if (movingGroup) movingGroup.add(innerF);

    const innerR = new THREE.Mesh(innerGeo, mats.telescopicRail);
    innerR.position.set(xCenter, yLevel, innerZ_R);
    innerR.castShadow = true;
    innerR.userData = {
      isBar: true,
      isTelescopicRail: true,
      isRailRunner: true,
      barLength: width,
      barLabel: 'Perfil Alumínio Deslizante da Bandeja Lateral',
      profileSpec: 'Perfil Alumínio 20x20 Deslizante'
    };
    if (movingGroup) movingGroup.add(innerR);

    // 3. Parafusos Guia Deslizantes em Aço Inox com Arruelas em Nylon/Teflon
    const boltXPositions = [
      xCenter - (width * 0.35),
      xCenter,
      xCenter + (width * 0.35),
      xCenter + directionSign * (width * 0.44)
    ];

    const boltZ_F = (railZ_F + innerZ_F) / 2;
    const boltZ_R = (railZ_R + innerZ_R) / 2;

    boltXPositions.forEach(bx => {
      const boltF = this.createGuideBolt(mats, 'z', 1);
      boltF.position.set(bx, yLevel, boltZ_F);
      if (movingGroup) movingGroup.add(boltF);

      const boltR = this.createGuideBolt(mats, 'z', -1);
      boltR.position.set(bx, yLevel, boltZ_R);
      if (movingGroup) movingGroup.add(boltR);
    });
  }
}
