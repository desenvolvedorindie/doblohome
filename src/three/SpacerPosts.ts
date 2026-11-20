import * as THREE from 'three';
import { MaterialLibrary } from './Materials';
import { AluminumExtrusionFactory } from './AluminumExtrusion';
import { MetalonTubeFactory } from './MetalonTube';
import { StructureMaterial, AluminumColor, SteelProfileUnit, getSteelProfileSpec } from '../types';

/**
 * Construtor dos Pilares de Sustentação Vertical e Berço Estrutural do Nível 2
 * Eleva a bandeja superior apoiando-se diretamente sobre as longarinas do rack base,
 * com travessas superiores inteiriças que passam por cima dos pilares e servem de berço,
 * eliminando a necessidade de braços de topo intermediários.
 */
export class SpacerPostsBuilder {
  static addSpacerPosts(
    targetGroup: THREE.Group,
    l2Width: number,
    l2Length: number,
    yFrom: number,
    yTo: number,
    zCenter: number,
    structureMaterial: StructureMaterial = 'aluminum',
    aluminumColor: AluminumColor = 'silver',
    steelProfileUnit: SteelProfileUnit = 'mm',
    metalonThickness: number = 1.5
  ) {
    const mats = MaterialLibrary.materials;
    const isTSlot = (structureMaterial === 'aluminum');
    const isAluTube = (structureMaterial === 'aluminum_tube');
    const isAluminum = isTSlot || isAluTube;
    const thicknessM = Math.max(0.0005, (metalonThickness || 1.5) / 1000);
    const steelSpec30 = getSteelProfileSpec(30, steelProfileUnit, metalonThickness);
    const postMat = isTSlot
      ? (aluminumColor === 'black' ? mats.aluminumProfileBlack : mats.aluminumProfileSilver)
      : isAluTube
        ? (aluminumColor === 'black' ? mats.aluminumTubeBlack : mats.aluminumTubeSilver)
        : mats.weldedSteelMetalon;

    const profileSpec30 = isTSlot
      ? 'Perfil T-Slot 30x30'
      : isAluTube
        ? `Tubo Retangular Alumínio 30x30x${metalonThickness.toFixed(1)}mm`
        : steelSpec30;
    const postSize = 0.030; // 30 mm T-Slot

    // Longarinas externas do rack base (largura 1.40m, centros em ±0.68m)
    const rackOuterX = 1.40 / 2 - 0.04 / 2; // 0.68 m

    // Longarinas laterais de apoio sob a bandeja L2
    const trayOuterX = l2Width / 2 - postSize / 2;
    const topRailX = trayOuterX;
    const pillarX = rackOuterX; // 0.68m

    // O berço estrutural de topo (travessas e longarinas superiores) fica
    // imediatamente abaixo da bandeja do Nível 2 (yTo - postSize).
    const yTopRail = yTo - postSize;

    // Os pilares de sustentação verticais são encurtados para que o topo do pilar
    // sirva de assento/apoio para a face inferior das travessas superiores inteiriças.
    const yTopPillar = yTopRail - postSize / 2;
    const postH = Math.max(0.04, yTopPillar - yFrom);
    const yCenterPillar = yFrom + postH / 2;

    // Desvio longitudinal de 8cm para livre saída das gavetas
    const zPillarFront = zCenter + (l2Length / 2 + 0.08);
    const zPillarRear = zCenter - (l2Length / 2 + 0.08);

    // 1. Pilares Verticais nos 4 cantos (encurtados para receber a travessa superior por cima)
    const pillarsConfig = [
      { xSign: -1, z: zPillarFront, label: 'Dianteira Esquerda' },
      { xSign: 1, z: zPillarFront, label: 'Dianteira Direita' },
      { xSign: -1, z: zPillarRear, label: 'Traseira Esquerda' },
      { xSign: 1, z: zPillarRear, label: 'Traseira Direita' }
    ];

    pillarsConfig.forEach(cfg => {
      const xP = cfg.xSign * pillarX;

      let post;
      if (isTSlot) {
        post = AluminumExtrusionFactory.createProfileMesh(postH, postMat, { axis: 'y', size: postSize, showCutFace: true });
      } else {
        post = MetalonTubeFactory.createTubeMesh(postH, postMat, { axis: 'y', size: postSize, thickness: thicknessM, showCutFace: true });
      }
      post.position.set(xP, yCenterPillar, cfg.z);
      post.castShadow = true;
      post.userData = {
        isBar: true,
        barLength: postH,
        barLabel: `Pilar de Sustentação (${cfg.label})`,
        profileSpec: profileSpec30
      };
      targetGroup.add(post);
    });

    // 2. Travessas Transversais Inteiriças no TOPO (Dianteira e Traseira)
    // Passam por cima dos pilares e se projetam 25 mm para fora de cada pilar ("passando")
    const transOverhang = 0.025; // 25 mm de sobra além da face externa de cada pilar
    const transLen = (pillarX + postSize / 2 + transOverhang) * 2; // 1.44 m
    const transCenterX = 0;

    const transPositions = [
      { z: zPillarFront, label: 'Dianteira' },
      { z: zPillarRear, label: 'Traseira' }
    ];

    transPositions.forEach(tp => {
      let transMesh;
      if (isTSlot) {
        transMesh = AluminumExtrusionFactory.createProfileMesh(transLen, postMat, { axis: 'x', size: postSize, showCutFace: true, addCaps: true });
      } else {
        transMesh = MetalonTubeFactory.createTubeMesh(transLen, postMat, { axis: 'x', size: postSize, thickness: thicknessM, showCutFace: true, addCaps: true });
      }
      transMesh.position.set(transCenterX, yTopRail, tp.z);
      transMesh.castShadow = true;
      transMesh.userData = {
        isBar: true,
        barLength: transLen,
        barLabel: `Travessa Superior (${tp.label})`,
        profileSpec: profileSpec30
      };
      targetGroup.add(transMesh);
    });

    // 3. Longarinas Longitudinais Superiores (Esquerda e Direita)
    // Encurtadas para conectar diretamente entre a face interna da travessa traseira e da dianteira
    const zLongStart = zPillarRear + postSize / 2;
    const zLongEnd = zPillarFront - postSize / 2;
    const longLen = Math.max(0.05, zLongEnd - zLongStart);
    const longCenterZ = (zLongStart + zLongEnd) / 2;

    const longSides = [
      { xSign: -1, label: 'Esquerda' },
      { xSign: 1, label: 'Direita' }
    ];

    longSides.forEach(side => {
      const xPos = side.xSign * topRailX;
      let longMesh;
      if (isTSlot) {
        longMesh = AluminumExtrusionFactory.createProfileMesh(longLen, postMat, { axis: 'z', size: postSize, showCutFace: true });
      } else {
        longMesh = MetalonTubeFactory.createTubeMesh(longLen, postMat, { axis: 'z', size: postSize, thickness: thicknessM });
      }
      longMesh.position.set(xPos, yTopRail, longCenterZ);
      longMesh.castShadow = true;
      longMesh.userData = {
        isBar: true,
        barLength: longLen,
        barLabel: `Longarina Superior (${side.label})`,
        profileSpec: profileSpec30
      };
      targetGroup.add(longMesh);
    });
  }
}

