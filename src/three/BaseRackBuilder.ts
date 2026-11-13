import * as THREE from 'three';
import { MaterialLibrary } from './Materials';
import { AluminumExtrusionFactory } from './AluminumExtrusion';
import { StructureMaterial, AluminumColor, SteelProfileUnit, getSteelProfileSpec } from '../types';

/**
 * Construtor do Quadro Base (220 x 140 cm) em Perfil 40x40 (T-Slot ou Metalon)
 * Inclui longarinas principais de 2,20m, travessas transversais de 1,32m, leito central
 * de apoio das corrediças, sapatas nas calhas da van e cantoneiras de fixação.
 */
export class BaseRackBuilder {
  static buildBaseRack(
    targetGroup: THREE.Group,
    rackMeshes: THREE.Mesh[],
    aluminumBracketsGroup: THREE.Group,
    weldGussetsGroup: THREE.Group,
    trayDims: any,
    zCenter: number,
    curBaseY: number,
    structureMaterial: StructureMaterial,
    aluminumColor: AluminumColor,
    cargoBoxEnabled: boolean,
    vanBaseY: number = 2.06,
    steelProfileUnit: SteelProfileUnit = 'mm'
  ) {
    const mats = MaterialLibrary.materials;
    const rack = new THREE.Group();

    const length = 2.20;
    const width = 1.40;
    const profileSize = 0.04;
    const isAluminum = (structureMaterial === 'aluminum');
    const steelSpec40 = getSteelProfileSpec(40, steelProfileUnit);

    const frameMat = isAluminum
      ? (aluminumColor === 'black' ? mats.aluminumProfileBlack : mats.aluminumProfileSilver)
      : mats.weldedSteelMetalon;

    // 1. Longarinas Principais (2.20m ao longo do teto)
    let barLeft, barRight;
    if (isAluminum) {
      barLeft = AluminumExtrusionFactory.createProfileMesh(length, frameMat, { axis: 'z', showCutFace: true });
      barRight = AluminumExtrusionFactory.createProfileMesh(length, frameMat, { axis: 'z', showCutFace: true });
    } else {
      const longBarGeo = new THREE.BoxGeometry(profileSize, profileSize, length);
      barLeft = new THREE.Mesh(longBarGeo, frameMat);
      barRight = new THREE.Mesh(longBarGeo, frameMat);
    }

    barLeft.position.set(-width / 2 + profileSize / 2, curBaseY, zCenter);
    barLeft.castShadow = true;
    barLeft.userData = { isBar: true, barLength: length, barLabel: 'Longarina Lateral do Rack Base', profileSpec: isAluminum ? 'Perfil T-Slot 40x40' : steelSpec40 };
    rack.add(barLeft);
    rackMeshes.push(barLeft);

    barRight.position.set(width / 2 - profileSize / 2, curBaseY, zCenter);
    barRight.castShadow = true;
    barRight.userData = { isBar: true, barLength: length, barLabel: 'Longarina Lateral do Rack Base', profileSpec: isAluminum ? 'Perfil T-Slot 40x40' : steelSpec40 };
    rack.add(barRight);
    rackMeshes.push(barRight);

    // 2. Travessas Transversais Contínuas (Frente, Trás e Apoio sob as Quinas da Bandeja)
    const crossBarLength = width - profileSize * 2;
    const zFront = zCenter + length / 2 - profileSize / 2;
    const zRear = zCenter - length / 2 + profileSize / 2;
    const tL = (trayDims && trayDims.trayLength) ? trayDims.trayLength : 1.08;
    // Clamp nas travessas centrais para manter distância mínima de 12cm das travessas de ponta (evita colisão quando tL >= 2.16m)
    const maxMidHalf = (length / 2) - profileSize * 3;
    const midHalf = Math.min(maxMidHalf, Math.max(0.20, (tL / 2) - 0.015));
    const zMidFront = zCenter + midHalf;
    const zMidRear = zCenter - midHalf;
    const crossZPositions = [zFront, zRear, zMidFront, zMidRear];

    crossZPositions.forEach(zPos => {
      let crossBar;
      if (isAluminum) {
        crossBar = AluminumExtrusionFactory.createProfileMesh(crossBarLength, frameMat, { axis: 'x' });
      } else {
        const crossGeo = new THREE.BoxGeometry(crossBarLength, profileSize, profileSize);
        crossBar = new THREE.Mesh(crossGeo, frameMat);
      }
      crossBar.position.set(0, curBaseY, zPos);
      crossBar.castShadow = true;
      crossBar.userData = { isBar: true, barLength: crossBarLength, barLabel: 'Travessa Transversal do Rack Base', profileSpec: isAluminum ? 'Perfil T-Slot 40x40' : steelSpec40 };
      rack.add(crossBar);
      rackMeshes.push(crossBar);
    });

    // 2.1 Segmentos Longitudinais Centrais de Apoio e Leito das Gavetas
    const midXPositions = [-0.34, 0.34];
    const longitudinalSpans = [
      {
        len: (zFront - profileSize / 2) - (zMidFront + profileSize / 2),
        z: ((zFront - profileSize / 2) + (zMidFront + profileSize / 2)) / 2
      },
      {
        len: (zMidFront - profileSize / 2) - (zMidRear + profileSize / 2),
        z: ((zMidFront - profileSize / 2) + (zMidRear + profileSize / 2)) / 2
      },
      {
        len: (zMidRear - profileSize / 2) - (zRear + profileSize / 2),
        z: ((zMidRear - profileSize / 2) + (zRear + profileSize / 2)) / 2
      }
    ];

    midXPositions.forEach(mx => {
      longitudinalSpans.forEach(span => {
        if (span.len <= 0.02) return;
        let midBar;
        if (isAluminum) {
          midBar = AluminumExtrusionFactory.createProfileMesh(span.len, frameMat, { axis: 'z' });
        } else {
          const midGeo = new THREE.BoxGeometry(profileSize, profileSize, span.len);
          midBar = new THREE.Mesh(midGeo, frameMat);
        }
        midBar.position.set(mx, curBaseY, span.z);
        midBar.castShadow = true;
        midBar.userData = { isBar: true, barLength: span.len, barLabel: 'Longarina Central de Apoio do Leito', profileSpec: isAluminum ? 'Perfil T-Slot 40x40' : steelSpec40 };
        rack.add(midBar);
        rackMeshes.push(midBar);
      });
    });

    // 3. Cantoneiras com parafusos Allen
    if (isAluminum) {
      AluminumExtrusionFactory.addRackBrackets(aluminumBracketsGroup, width, length, zCenter, curBaseY, profileSize, [zMidFront, zMidRear]);
      aluminumBracketsGroup.visible = true;
      weldGussetsGroup.visible = false;
    } else {
      aluminumBracketsGroup.visible = false;
      weldGussetsGroup.visible = true;
      const gussetGeo = new THREE.BoxGeometry(0.06, 0.008, 0.06);
      const gussetCorners = [
        [-width / 2 + 0.04, zCenter + length / 2 - 0.04],
        [width / 2 - 0.04, zCenter + length / 2 - 0.04],
        [-width / 2 + 0.04, zCenter - length / 2 + 0.04],
        [width / 2 - 0.04, zCenter - length / 2 + 0.04]
      ];
      gussetCorners.forEach(([gx, gz]) => {
        const gusset = new THREE.Mesh(gussetGeo, mats.weldedSteelMetalon);
        gusset.position.set(gx, curBaseY + 0.02, gz);
        weldGussetsGroup.add(gusset);
      });
    }

    // 4. Sapatas de elevação para as calhas da Doblò (apenas quando sem baú)
    if (!cargoBoxEnabled) {
      const riserH = 0.06;
      const riserGeo = new THREE.BoxGeometry(0.05, riserH, 0.08);
      const riserY = vanBaseY - profileSize / 2 - riserH / 2;
      const risersPos = [
        [-width / 2 + profileSize / 2, riserY, zCenter + 0.85],
        [width / 2 - profileSize / 2, riserY, zCenter + 0.85],
        [-width / 2 + profileSize / 2, riserY, zCenter - 0.85],
        [width / 2 - profileSize / 2, riserY, zCenter - 0.85]
      ];
      risersPos.forEach((p, idx) => {
        const riser = new THREE.Mesh(riserGeo, frameMat);
        riser.position.set(p[0], p[1], p[2]);
        riser.userData = { isBar: true, barLength: 0.08, barLabel: `Sapata do Rack Base (#${idx + 1})`, profileSpec: 'Sapata de Ancoragem 50x60x80mm' };
        rack.add(riser);
        rackMeshes.push(riser);
      });
    }

    targetGroup.add(rack);
  }
}

