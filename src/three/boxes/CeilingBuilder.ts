import * as THREE from 'three';
import { CeilingConfig, CeilingType, CeilingSheetMaterial, CeilingSlattedWood, InternalGridConfig, InternalBoxesPreviewOptions } from '../../types';
import { DEFAULT_CEILING_CONFIG } from '../../data/internalBoxesPresets';
import { CEILING_Y } from './BoxGeometryHelpers';
import { CeilingLedBuilder } from './CeilingLedBuilder';

export function getCeilingArchOffset(x: number, w: number, archM: number): { yDrop: number; rotZ: number } {
  if (archM <= 0.001 || w <= 0.001) return { yDrop: 0, rotZ: 0 };
  const halfW = w / 2;
  const clampedX = Math.max(-halfW, Math.min(halfW, x));
  const normX = clampedX / halfW;
  const yDrop = (1 - normX * normX) * archM;
  const slope = -2 * normX * (archM / halfW);
  const rotZ = Math.atan(slope);
  return { yDrop, rotZ };
}

export class CeilingBuilder {
  ceilingGroup: THREE.Group;
  ledBuilder: CeilingLedBuilder;

  constructor(ceilingGroup: THREE.Group) {
    this.ceilingGroup = ceilingGroup;
    this.ledBuilder = new CeilingLedBuilder(ceilingGroup);
  }

    buildCeiling(
    grid: InternalGridConfig,
    defaultWidthM: number,
    defaultLengthM: number,
    floorY: number,
    previewOpen: boolean | InternalBoxesPreviewOptions = false
  ) {
    const ceiling = grid.ceiling;
    if (!ceiling || ceiling.enabled === false) return;

    const hideCeiling = (typeof previewOpen === 'object' && Boolean(previewOpen.hideCeiling));
    const isVisible3D = (ceiling.visibleIn3D !== false) && !hideCeiling;
    this.ceilingGroup.visible = isVisible3D;

    const ceilingL = (ceiling.lengthMm ? ceiling.lengthMm / 1000 : defaultLengthM);
    const ceilingW = (ceiling.widthMm ? ceiling.widthMm / 1000 : defaultWidthM);
    const heightOffset = (ceiling.heightOffsetMm ?? 0) / 1000;
    const ceilingY = CEILING_Y + heightOffset;
    const centerZ = -ceilingL / 2;
    // Curvatura / flecha transversal do teto em metros (padrão 25mm, limitado a no máx 30mm para a Fiat Doblò)
    const archM = Math.max(0, Math.min(0.03, (ceiling.curvatureMm ?? 25) / 1000));

    const opacity = Math.max(0.1, Math.min(1.0, ceiling.opacity ?? 1.0));
    const isTranslucent = opacity < 0.99;

    const isSlatted = (ceiling.type || 'slatted') === 'slatted';
    const ceilingThicknessM = isSlatted
      ? (ceiling.slatThicknessMm || 12) / 1000
      : (ceiling.thicknessMm || 9) / 1000;

    if (isSlatted) {
      this.buildSlattedCeiling(ceiling, ceilingW, ceilingL, ceilingY, centerZ, opacity, isTranslucent, archM);
    } else {
      this.buildSheetCeiling(ceiling, ceilingW, ceilingL, ceilingY, centerZ, opacity, isTranslucent, archM);
    }

    // Iluminação LED no Teto
    if (ceiling.led && ceiling.led.enabled !== false) {
      this.ledBuilder.buildCeilingLed(
        ceiling.led,
        ceilingW,
        ceilingL,
        ceilingY,
        centerZ,
        isSlatted,
        archM,
        ceilingThicknessM,
        ceiling
      );
    }
  }

  /**
   * Calcula a elevação vertical em Y e a inclinação rotacional em Z (em radianos)
   * decorrentes do arqueamento transversal do teto da Fiat Doblò.
   * A posição de referência base é SEMPRE a parte mais baixa (bordas laterais x = ±w/2, onde yOffset = 0).
   * A partir das laterais na base, o teto compensa e sobe em direção ao centro (x = 0, onde yOffset = +archM).
   * x = posição lateral (-w/2 a +w/2)
   * w = largura total do teto
   * archM = flecha do arco (elevação do centro em relação às laterais mais baixas em metros)
   */
  static getCeilingArchOffset(x: number, w: number, archM: number): { yDrop: number; rotZ: number } {
    if (archM <= 0.0001 || w <= 0.001) {
      return { yDrop: 0, rotZ: 0 };
    }
    const halfW = w / 2;
    const clampedX = Math.max(-halfW, Math.min(halfW, x));
    const normX = clampedX / halfW; // -1 a +1
    // As laterais são a parte mais baixa de referência (normX = ±1 => yRise = 0).
    // Em direção ao centro (normX = 0), sobe compensando a curvatura (+archM).
    const yRise = archM * (1 - normX * normX);
    // Inclinação angular tangente: dy/dx = -8 * archM * x / (w * w)
    const slope = (-8 * archM * clampedX) / (w * w);
    const rotZ = Math.atan(slope);
    return { yDrop: yRise, rotZ };
  }

  /**
   * Constrói o forro ripado com ripas de madeira nobre e fundo acústico automotivo preto
   * com suporte a curvatura suave acompanhando o arco da Fiat Doblò
   */
  private buildSlattedCeiling(
    ceiling: CeilingConfig,
    w: number,
    l: number,
    ceilingY: number,
    centerZ: number,
    opacity: number,
    isTranslucent: boolean,
    archM: number = 0.025
  ) {
    const woodKey = ceiling.slattedWood || 'freijo';
    const woodSpecs: Record<CeilingSlattedWood, { color: number; label: string; materialName: string }> = {
      pinus: { color: 0xdfb889, label: 'Pinus Claro', materialName: 'Pinus Maciço' },
      freijo: { color: 0xc89355, label: 'Freijó Nobre', materialName: 'Freijó Nobre' },
      teak: { color: 0xb06c35, label: 'Teca Náutica', materialName: 'Teca Náutica' },
      dark_wood: { color: 0x5c3a21, label: 'Imbuia / Madeira Nobre', materialName: 'Madeira Nobre Maciça' },
      cedro: { color: 0xb45309, label: 'Cedro Rosa Real', materialName: 'Cedro Rosa' },
      plywood: { color: 0xd4a373, label: 'Compensado Naval', materialName: 'Compensado Naval' },
      white_mdf: { color: 0xf8fafc, label: 'MDF Branco Ultra', materialName: 'MDF Branco Ultra' }
    };
    const spec = woodSpecs[woodKey] || woodSpecs.freijo;

    const slatWM = (ceiling.slatWidthMm || 40) / 1000;
    const slatHM = (ceiling.slatThicknessMm || 12) / 1000;
    const slatGapM = (ceiling.slatGapMm || 10) / 1000;
    const isTransverse = ceiling.slatDirection === 'transverse';

    // 1. Fundo Acústico Automotivo Preto (Feltro / TNT / Chapa Eucatex 3mm preta)
    if (ceiling.acousticFeltBacking !== false) {
      const feltThick = 0.003;
      const feltMat = new THREE.MeshStandardMaterial({
        color: 0x111827, // Preto grafite escuro fosco de feltro automotivo
        roughness: 0.95,
        metalness: 0.02,
        transparent: isTranslucent,
        opacity: opacity
      });

      if (archM > 0.001) {
        // Superfície curva contínua acompanhando o arco do teto
        const feltShape = new THREE.Shape();
        const segs = 32;
        for (let k = 0; k <= segs; k++) {
          const px = -w / 2 + (k / segs) * w;
          const { yDrop } = getCeilingArchOffset(px, w, archM);
          const py = ceilingY + feltThick + yDrop;
          if (k === 0) feltShape.moveTo(px, py);
          else feltShape.lineTo(px, py);
        }
        for (let k = segs; k >= 0; k--) {
          const px = -w / 2 + (k / segs) * w;
          const { yDrop } = getCeilingArchOffset(px, w, archM);
          const py = ceilingY + yDrop;
          feltShape.lineTo(px, py);
        }
        feltShape.closePath();

        const feltGeo = new THREE.ExtrudeGeometry(feltShape, { depth: l, bevelEnabled: false });
        const feltMesh = new THREE.Mesh(feltGeo, feltMat);
        feltMesh.position.set(0, 0, centerZ - l / 2);
        feltMesh.name = 'CeilingAcousticBacking';
        feltMesh.receiveShadow = true;
        this.ceilingGroup.add(feltMesh);
      } else {
        const feltGeo = new THREE.BoxGeometry(w, feltThick, l);
        const feltMesh = new THREE.Mesh(feltGeo, feltMat);
        feltMesh.position.set(0, ceilingY + feltThick / 2, centerZ);
        feltMesh.name = 'CeilingAcousticBacking';
        feltMesh.receiveShadow = true;
        this.ceilingGroup.add(feltMesh);
      }
    }

    // 2. Ripas de Madeira
    const slatMat = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.65,
      metalness: 0.04,
      transparent: isTranslucent,
      opacity: opacity
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: isTranslucent ? opacity * 0.4 : 0.45
    });

    const slatY = ceilingY - slatHM / 2;

    if (!isTransverse) {
      // Longitudinal (ao longo do veículo - padrão van life)
      const pitch = slatWM + slatGapM;
      const count = Math.max(1, Math.floor((w - slatGapM) / pitch));
      const totalSpan = count * slatWM + (count - 1) * slatGapM;
      const startX = -totalSpan / 2 + slatWM / 2;

      const slatGeo = new THREE.BoxGeometry(slatWM, slatHM, l);
      const slatEdgeGeo = new THREE.EdgesGeometry(slatGeo);

      for (let i = 0; i < count; i++) {
        const x = startX + i * pitch;
        const { yDrop, rotZ } = getCeilingArchOffset(x, w, archM);

        const slatMesh = new THREE.Mesh(slatGeo, slatMat);
        slatMesh.position.set(x, slatY + yDrop, centerZ);
        slatMesh.rotation.z = rotZ; // Inclina a ripa de acordo com a tangente do arco
        slatMesh.castShadow = true;
        slatMesh.receiveShadow = true;
        slatMesh.name = `CeilingSlat_${i + 1}`;
        slatMesh.userData = {
          isWoodPart: true,
          dimW: slatWM,
          dimL: l,
          dimH: slatHM,
          thicknessMm: Math.round(slatHM * 1000),
          partLabel: `Ripa de Teto (${spec.label}) ${Math.round(slatWM * 1000)}×${Math.round(l * 1000)}mm`,
          name: `Ripa de Teto (${spec.label})`,
          category: '🪵 Teto & Forro Campervan',
          barProfile: `${Math.round(slatWM * 1000)} × ${Math.round(l * 1000)} × ${Math.round(slatHM * 1000)} mm`,
          capacity: `${count} ripas no teto`,
          material: `${spec.materialName} ${Math.round(slatHM * 1000)}mm Acabamento Nobre`,
          woodMaterial: spec.materialName,
          moduleName: 'Forro de Teto Ripado',
          partType: 'ceiling',
          purpose: 'Ripas decorativas e acústicas do forro de teto da Doblò'
        };
        this.ceilingGroup.add(slatMesh);

        const edgeLine = new THREE.LineSegments(slatEdgeGeo, edgeMat);
        edgeLine.position.copy(slatMesh.position);
        edgeLine.rotation.copy(slatMesh.rotation);
        this.ceilingGroup.add(edgeLine);
      }
    } else {
      // Transversal (ao longo da largura com curvatura acompanhando o teto)
      const pitch = slatWM + slatGapM;
      const count = Math.max(1, Math.floor((l - slatGapM) / pitch));
      const totalSpan = count * slatWM + (count - 1) * slatGapM;
      const startZ = centerZ + totalSpan / 2 - slatWM / 2;

      let slatGeo: THREE.BufferGeometry;
      if (archM > 0.001) {
        const slatShape = new THREE.Shape();
        const segs = 32;
        for (let k = 0; k <= segs; k++) {
          const px = -w / 2 + (k / segs) * w;
          const { yDrop } = getCeilingArchOffset(px, w, archM);
          const py = ceilingY + yDrop;
          if (k === 0) slatShape.moveTo(px, py);
          else slatShape.lineTo(px, py);
        }
        for (let k = segs; k >= 0; k--) {
          const px = -w / 2 + (k / segs) * w;
          const { yDrop } = getCeilingArchOffset(px, w, archM);
          const py = ceilingY - slatHM + yDrop;
          slatShape.lineTo(px, py);
        }
        slatShape.closePath();
        slatGeo = new THREE.ExtrudeGeometry(slatShape, { depth: slatWM, bevelEnabled: false });
      } else {
        slatGeo = new THREE.BoxGeometry(w, slatHM, slatWM);
      }
      const slatEdgeGeo = new THREE.EdgesGeometry(slatGeo);

      for (let i = 0; i < count; i++) {
        const z = startZ - i * pitch;
        const slatMesh = new THREE.Mesh(slatGeo, slatMat);
        if (archM > 0.001) {
          slatMesh.position.set(0, 0, z - slatWM / 2);
        } else {
          slatMesh.position.set(0, slatY, z);
        }
        slatMesh.castShadow = true;
        slatMesh.receiveShadow = true;
        slatMesh.name = `CeilingSlatTrans_${i + 1}`;
        slatMesh.userData = {
          isWoodPart: true,
          dimW: w,
          dimL: slatWM,
          dimH: slatHM,
          thicknessMm: Math.round(slatHM * 1000),
          partLabel: `Ripa Transversal de Teto (${spec.label}) ${Math.round(w * 1000)}×${Math.round(slatWM * 1000)}mm`,
          name: `Ripa Transversal (${spec.label})`,
          category: '🪵 Teto & Forro Campervan',
          barProfile: `${Math.round(w * 1000)} × ${Math.round(slatWM * 1000)} × ${Math.round(slatHM * 1000)} mm`,
          capacity: `${count} ripas no teto`,
          material: `${spec.materialName} ${Math.round(slatHM * 1000)}mm`,
          woodMaterial: spec.materialName,
          moduleName: 'Forro de Teto Ripado',
          partType: 'ceiling',
          purpose: 'Ripas transversais de teto campervan'
        };
        this.ceilingGroup.add(slatMesh);

        const edgeLine = new THREE.LineSegments(slatEdgeGeo, edgeMat);
        edgeLine.position.copy(slatMesh.position);
        this.ceilingGroup.add(edgeLine);
      }
    }
  }

  /**
   * Constrói o forro em chapa contínua (MDF ou Compensado Naval)
   * moldado no arco de curvatura transversal da Fiat Doblò
   */
  private buildSheetCeiling(
    ceiling: CeilingConfig,
    w: number,
    l: number,
    ceilingY: number,
    centerZ: number,
    opacity: number,
    isTranslucent: boolean,
    archM: number = 0.025
  ) {
    const matKey = ceiling.sheetMaterial || 'white_mdf';
    const sheetSpecs: Record<CeilingSheetMaterial, { color: number; label: string; materialName: string }> = {
      white_mdf: { color: 0xf8fafc, label: 'MDF Branco Ultra', materialName: 'MDF Branco Ultra' },
      gray_mdf: { color: 0x475569, label: 'MDF Cinza Grafite', materialName: 'MDF Cinza Grafite' },
      wood_mdf: { color: 0xc89355, label: 'MDF Freijó Natural', materialName: 'MDF Freijó Natural' },
      black_mdf: { color: 0x1e293b, label: 'MDF Preto Fosco', materialName: 'MDF Preto Fosco' },
      sand_mdf: { color: 0xdcd0c0, label: 'MDF Bege Areia', materialName: 'MDF Bege Areia' },
      plywood: { color: 0xd4a373, label: 'Compensado Naval', materialName: 'Compensado Naval' }
    };
    const spec = sheetSpecs[matKey] || sheetSpecs.white_mdf;
    const thicknessMm = ceiling.thicknessMm || 9;
    const thickM = thicknessMm / 1000;
    const sheetY = ceilingY - thickM / 2;

    const sheetMat = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.55,
      metalness: 0.04,
      transparent: isTranslucent,
      opacity: opacity
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: isTranslucent ? opacity * 0.5 : 0.6
    });

    const panelMode = ceiling.sheetPanels || 'single';

    // Cria geometria curva transversal extrudada
    const createCurvedSheetGeo = (xStart: number, xEnd: number, depthL: number) => {
      if (archM <= 0.001) {
        return new THREE.BoxGeometry(xEnd - xStart, thickM, depthL);
      }
      const shape = new THREE.Shape();
      const segs = 32;
      const span = xEnd - xStart;
      for (let k = 0; k <= segs; k++) {
        const px = xStart + (k / segs) * span;
        const { yDrop } = getCeilingArchOffset(px, w, archM);
        const py = ceilingY + yDrop;
        if (k === 0) shape.moveTo(px, py);
        else shape.lineTo(px, py);
      }
      for (let k = segs; k >= 0; k--) {
        const px = xStart + (k / segs) * span;
        const { yDrop } = getCeilingArchOffset(px, w, archM);
        const py = ceilingY - thickM + yDrop;
        shape.lineTo(px, py);
      }
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: depthL, bevelEnabled: false });
    };

    if (panelMode === 'single') {
      const geo = createCurvedSheetGeo(-w / 2, w / 2, l);
      const mesh = new THREE.Mesh(geo, sheetMat);
      if (archM > 0.001) {
        mesh.position.set(0, 0, centerZ - l / 2);
      } else {
        mesh.position.set(0, sheetY, centerZ);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = 'CeilingSheet_Single';
      mesh.userData = {
        isWoodPart: true,
        dimW: w,
        dimL: l,
        dimH: thickM,
        thicknessMm: thicknessMm,
        partLabel: `Chapa Única de Teto (${spec.label} ${thicknessMm}mm)`,
        name: `Chapa de Teto (${spec.label})`,
        category: '🪵 Teto & Forro Campervan',
        barProfile: `${Math.round(w * 1000)} × ${Math.round(l * 1000)} × ${thicknessMm} mm`,
        material: `${spec.materialName} ${thicknessMm}mm`,
        woodMaterial: spec.materialName,
        moduleName: 'Forro de Teto em Chapa',
        partType: 'ceiling',
        purpose: 'Chapa inteira para forração e isolamento do teto'
      };
      this.ceilingGroup.add(mesh);

      const edgeLine = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      edgeLine.position.copy(mesh.position);
      this.ceilingGroup.add(edgeLine);
    } else if (panelMode === 'split_longitudinal') {
      // 2 chapas longitudinais (lado esquerdo e direito com friso central de 3mm)
      const gap = 0.003;
      const subW = (w - gap) / 2;

      [-1, 1].forEach((side, idx) => {
        const xStart = side === -1 ? -w / 2 : gap / 2;
        const xEnd = side === -1 ? -gap / 2 : w / 2;
        const geo = createCurvedSheetGeo(xStart, xEnd, l);
        const mesh = new THREE.Mesh(geo, sheetMat);
        if (archM > 0.001) {
          mesh.position.set(0, 0, centerZ - l / 2);
        } else {
          const xCenter = (xStart + xEnd) / 2;
          mesh.position.set(xCenter, sheetY, centerZ);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `CeilingSheet_Long_${idx + 1}`;
        mesh.userData = {
          isWoodPart: true,
          dimW: subW,
          dimL: l,
          dimH: thickM,
          thicknessMm: thicknessMm,
          partLabel: `Painel de Teto Bipartido (${spec.label})`,
          name: `Painel de Teto Longitudinal (${spec.label})`,
          category: '🪵 Teto & Forro Campervan',
          barProfile: `${Math.round(subW * 1000)} × ${Math.round(l * 1000)} × ${thicknessMm} mm`,
          material: `${spec.materialName} ${thicknessMm}mm`,
          woodMaterial: spec.materialName,
          moduleName: 'Forro de Teto Bipartido',
          partType: 'ceiling',
          purpose: 'Painel longitudinal para montagem facilitada do forro de teto'
        };
        this.ceilingGroup.add(mesh);

        const edgeLine = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
        edgeLine.position.copy(mesh.position);
        this.ceilingGroup.add(edgeLine);
      });
    } else {
      // 3 chapas transversais (frente, meio, traseira com frisos de 3mm)
      const gap = 0.003;
      const subL = (l - 2 * gap) / 3;

      [-1, 0, 1].forEach((posIdx, idx) => {
        const z = centerZ - posIdx * (subL + gap);
        const geo = createCurvedSheetGeo(-w / 2, w / 2, subL);
        const mesh = new THREE.Mesh(geo, sheetMat);
        if (archM > 0.001) {
          mesh.position.set(0, 0, z - subL / 2);
        } else {
          mesh.position.set(0, sheetY, z);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `CeilingSheet_Trans_${idx + 1}`;
        mesh.userData = {
          isWoodPart: true,
          dimW: w,
          dimL: subL,
          dimH: thickM,
          thicknessMm: thicknessMm,
          partLabel: `Painel Transversal de Teto (${spec.label})`,
          name: `Painel Transversal (${spec.label})`,
          category: '🪵 Teto & Forro Campervan',
          barProfile: `${Math.round(w * 1000)} × ${Math.round(subL * 1000)} × ${thicknessMm} mm`,
          material: `${spec.materialName} ${thicknessMm}mm`,
          woodMaterial: spec.materialName,
          moduleName: 'Forro de Teto Modular',
          partType: 'ceiling',
          purpose: 'Módulo transversal desmontável do teto'
        };
        this.ceilingGroup.add(mesh);

        const edgeLine = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
        edgeLine.position.copy(mesh.position);
        this.ceilingGroup.add(edgeLine);
      });
    }
  }

  /**
   * Constrói a iluminação LED no teto (perfis lineares ou spots circulares)
   * acompanhando o arco e as inclinações da curvatura do teto
   */
}
