import * as THREE from 'three';
import { MaterialLibrary } from './Materials';
import { AluminumExtrusionFactory } from './AluminumExtrusion';
import { StructureMaterial, AluminumColor } from '../types';

/**
 * Construtor dos Pilares de Sustentação Vertical e Desvios Estruturais do Nível 2
 * Eleva a bandeja superior fixando-se nas longarinas do rack base, com braços de topo
 * para contornar o curso das gavetas inferiores sem colisão.
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
    aluminumColor: AluminumColor = 'silver'
  ) {
    const mats = MaterialLibrary.materials;
    const isAluminum = (structureMaterial === 'aluminum');
    const postMat = isAluminum
      ? (aluminumColor === 'black' ? mats.aluminumProfileBlack : mats.aluminumProfileSilver)
      : mats.weldedSteelMetalon;
    const postSize = 0.030; // 30 mm T-Slot

    // Longarinas externas do rack base (largura 1.40m)
    const rackOuterX = 1.40 / 2 - 0.04 / 2; // 0.68 m

    // Longarinas laterais da bandeja L2
    const trayOuterX = l2Width / 2 - postSize / 2;

    const pillarX = rackOuterX; // 0.68m
    const needsTopArm = trayOuterX < rackOuterX - 0.005;
    const topArmLen = needsTopArm ? (rackOuterX - trayOuterX) : 0;
    const topRailX = needsTopArm ? trayOuterX : rackOuterX;

    const yTopPillar = yTo - postSize / 2;
    const postH = Math.max(0.04, yTopPillar - yFrom);
    const yCenterPillar = yFrom + postH / 2;

    // Desvio longitudinal de 8cm para livre saída das gavetas
    const zPillarFront = zCenter + (l2Length / 2 + 0.08);
    const zPillarRear  = zCenter - (l2Length / 2 + 0.08);

    // 1. Pilares Verticais nos 4 cantos
    const pillarsConfig = [
      { xSign: -1, z: zPillarFront, label: 'Dianteira Esquerda' },
      { xSign:  1, z: zPillarFront, label: 'Dianteira Direita'  },
      { xSign: -1, z: zPillarRear,  label: 'Traseira Esquerda'  },
      { xSign:  1, z: zPillarRear,  label: 'Traseira Direita'   }
    ];

    pillarsConfig.forEach(cfg => {
      const xP = cfg.xSign * pillarX;

      let post;
      if (isAluminum) {
        post = AluminumExtrusionFactory.createProfileMesh(postH, postMat, { axis: 'y', size: postSize, showCutFace: true });
      } else {
        const postGeo = new THREE.BoxGeometry(postSize, postH, postSize);
        post = new THREE.Mesh(postGeo, postMat);
      }
      post.position.set(xP, yCenterPillar, cfg.z);
      post.castShadow = true;
      post.userData = {
        isBar: true,
        barLength: postH,
        barLabel: `Pilar de Sustentação (${cfg.label})`,
        profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30'
      };
      targetGroup.add(post);

      // Cantoneira de fixação na base sobre a longarina do rack
      const baseBracketGeo = new THREE.BoxGeometry(0.036, 0.008, 0.036);
      const baseBracket = new THREE.Mesh(baseBracketGeo, mats.telescopicRail || postMat);
      baseBracket.position.set(xP, yFrom + 0.004, cfg.z);
      targetGroup.add(baseBracket);

      // Braço horizontal no topo do pilar
      if (needsTopArm) {
        let armMesh;
        if (isAluminum) {
          armMesh = AluminumExtrusionFactory.createProfileMesh(topArmLen, postMat, { axis: 'x', size: postSize });
        } else {
          const armGeo = new THREE.BoxGeometry(topArmLen, postSize, postSize);
          armMesh = new THREE.Mesh(armGeo, postMat);
        }
        const armCenterX = cfg.xSign * (trayOuterX + topArmLen / 2);
        armMesh.position.set(armCenterX, yTo, cfg.z);
        armMesh.castShadow = true;
        armMesh.userData = {
          isBar: true,
          barLength: topArmLen,
          barLabel: `Braço de Topo (${cfg.label})`,
          profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30'
        };
        targetGroup.add(armMesh);
      }
    });

    // 2. Longarinas Longitudinais Contínuas no TOPO (Esquerda e Direita)
    const zLongStart = zPillarRear  - postSize / 2;
    const zLongEnd   = zPillarFront + postSize / 2;
    const longLen     = zLongEnd - zLongStart;
    const longCenterZ = (zLongStart + zLongEnd) / 2;

    const longSides = [
      { xSign: -1, label: 'Esquerda' },
      { xSign:  1, label: 'Direita'  }
    ];

    longSides.forEach(side => {
      const xPos = side.xSign * topRailX;
      let longMesh;
      if (isAluminum) {
        longMesh = AluminumExtrusionFactory.createProfileMesh(longLen, postMat, { axis: 'z', size: postSize, showCutFace: true });
      } else {
        const longGeo = new THREE.BoxGeometry(postSize, postSize, longLen);
        longMesh = new THREE.Mesh(longGeo, postMat);
      }
      longMesh.position.set(xPos, yTo, longCenterZ);
      longMesh.castShadow = true;
      longMesh.userData = {
        isBar: true,
        barLength: longLen,
        barLabel: `Longarina Superior (${side.label})`,
        profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30'
      };
      targetGroup.add(longMesh);
    });

    // 3. Travessas Transversais no TOPO
    const xInnerL  = -topRailX + postSize / 2;
    const xInnerR  =  topRailX - postSize / 2;
    const transLen  = xInnerR - xInnerL;
    const transCenterX = 0;

    const transPositions = [
      { z: zPillarFront, label: 'Dianteira' },
      { z: zPillarRear,  label: 'Traseira'  }
    ];

    transPositions.forEach(tp => {
      if (transLen <= 0.01) return;
      let transMesh;
      if (isAluminum) {
        transMesh = AluminumExtrusionFactory.createProfileMesh(transLen, postMat, { axis: 'x', size: postSize });
      } else {
        const transGeo = new THREE.BoxGeometry(transLen, postSize, postSize);
        transMesh = new THREE.Mesh(transGeo, postMat);
      }
      transMesh.position.set(transCenterX, yTo, tp.z);
      transMesh.castShadow = true;
      transMesh.userData = {
        isBar: true,
        barLength: transLen,
        barLabel: `Travessa Superior (${tp.label})`,
        profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : 'Metalon 30x30'
      };
      targetGroup.add(transMesh);

      [-1, 1].forEach(xSign => {
        const cornerBracketGeo = new THREE.BoxGeometry(0.026, 0.026, 0.026);
        const cornerBracket = new THREE.Mesh(cornerBracketGeo, mats.telescopicRail || postMat);
        cornerBracket.position.set(xSign * (topRailX - postSize / 2 - 0.013), yTo, tp.z);
        targetGroup.add(cornerBracket);
      });
    });

    // 4. Cantoneiras de fixação da bandeja L2 às longarinas superiores
    const zCorners = [
      zCenter + (l2Length / 2 - postSize / 2),
      zCenter - (l2Length / 2 - postSize / 2)
    ];
    zCorners.forEach(zC => {
      [-1, 1].forEach(xSign => {
        const xTrayOuter = xSign * (l2Width / 2);
        const trayBracketGeo = new THREE.BoxGeometry(0.026, 0.026, 0.026);
        const trayBracket = new THREE.Mesh(trayBracketGeo, mats.telescopicRail || postMat);
        trayBracket.position.set(xTrayOuter, yTo, zC);
        targetGroup.add(trayBracket);
      });
    });
  }
}

