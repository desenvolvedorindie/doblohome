import * as THREE from 'three';
import { InternalBoxItem, BoxPanelsConfig, UpperCabinetSide } from '../../types';

export const PLYWOOD_THICKNESS = 0.015; // 15mm
export const FLOOR_Y = 0.48;
export const CEILING_Y = 1.72;

export function getBoxThickness(box?: InternalBoxItem) {
  const dMm = box?.thicknessMm || 15;
  const p = box?.panelThickness;
  const cabinetMm = (p?.cabinet ?? dMm) || 15;
  const isSlidingUpper =
    box?.upperCabinet &&
    (box.upperCabinetClosure === 'sliding_doors' ||
      (box.upperCabinetClosure === undefined && box.upperCabinetDoors === undefined));
  const defaultDoorMm = isSlidingUpper ? 6 : cabinetMm;
  return {
    default: dMm / 1000,
    top: ((p?.top ?? dMm) || 15) / 1000,
    bottom: ((p?.bottom ?? dMm) || 15) / 1000,
    left: ((p?.left ?? dMm) || 15) / 1000,
    right: ((p?.right ?? dMm) || 15) / 1000,
    front: ((p?.front ?? dMm) || 15) / 1000,
    rear: ((p?.rear ?? dMm) || 15) / 1000,
    cabinet: cabinetMm / 1000,
    door: ((p?.door ?? defaultDoorMm) || defaultDoorMm) / 1000,
    tray: ((p?.tray ?? dMm) || 15) / 1000,
    slat: ((p?.slat ?? dMm) || 15) / 1000,
    shelf: ((p?.shelf ?? dMm) || 15) / 1000
  };
}

export function getWoodMaterialName(material?: string): string {
  switch (material) {
    case 'dark_wood':
      return 'Madeira Nobre Maciça';
    case 'white_mdf':
      return 'MDF Branco Ultra';
    case 'aluminum':
    case 'aluminum_box':
      return 'Gabinete Alumínio Modular';
    case 'plywood':
    default:
      return 'Compensado Naval';
  }
}

export function createBoxMaterial(box: InternalBoxItem, _isSelected: boolean): THREE.Material {
  const color = new THREE.Color(box.color || '#d97706').getHex();

  switch (box.material) {
    case 'plywood':
      return new THREE.MeshStandardMaterial({
        color: 0xd4a373,
        roughness: 0.75,
        metalness: 0.05
      });
    case 'dark_wood':
      return new THREE.MeshStandardMaterial({
        color: 0x78350f,
        roughness: 0.65,
        metalness: 0.05
      });
    case 'white_mdf':
      return new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.35,
        metalness: 0.1
      });
    case 'aluminum_box':
      return new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.25,
        metalness: 0.8
      });
    default:
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.65,
        metalness: 0.08
      });
  }
}

export function getUpperCabinetExclusionZones(
  box: InternalBoxItem,
  boxWM: number,
  boxLM: number,
  options?: { maxGapMm?: number; marginM?: number }
): Array<{ minX: number; maxX: number; minZ: number; maxZ: number }> {
  if (!box.upperCabinet) return [];

  const maxGapMm = options?.maxGapMm ?? 25;
  const marginM = options?.marginM ?? 0.015;

  // Se houver espaçamento inferior significativo (> maxGapMm), o armário não encosta na tampa de cima
  const bottomGapMm = box.upperCabinetBottomGapMm ?? 0;
  if (bottomGapMm > maxGapMm) return [];

  const positionMode = box.upperCabinetPositionMode || 'on_box';
  const transverseMode = box.upperCabinetTransverseMode || 'on_box';
  const besideSide = box.upperCabinetBesideSide || 'outer';
  const besideOffsetM = (box.upperCabinetBesideOffsetMm ?? 0) / 1000;
  const behindOffsetM = (box.upperCabinetBehindOffsetMm ?? 0) / 1000;

  const offsetM = (box.upperCabinetOffsetMm ?? 0) / 1000;
  const depthOffsetM = (box.upperCabinetDepthOffsetMm ?? 0) / 1000;

  const activeSides: UpperCabinetSide[] = (() => {
    if (box.upperCabinetSides && box.upperCabinetSides.length > 0) {
      return Array.from(new Set(box.upperCabinetSides));
    }
    if (box.upperCabinetAlign === 'all') return ['rear', 'front', 'left', 'right'];
    if (box.upperCabinetAlign === 'left') return ['left'];
    if (box.upperCabinetAlign === 'right') return ['right'];
    if (box.upperCabinetAlign === 'front') return ['front'];
    return ['rear'];
  })();

  const zones: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }> = [];

  const tCfg = getBoxThickness(box);
  const doorT = box.panelThickness?.door !== undefined ? (Math.max(0.004, tCfg.door) + 0.002) : 0.016; // 15mm espessura da porta/trilho + folga

  activeSides.forEach(side => {
    if (side === 'rear' || side === 'front') {
      const maxDepthMm = Math.max(Math.round(boxLM * 1000), 1200);
      const depthMm = Math.max(50, Math.min(maxDepthMm, box.upperCabinetDepthMm ?? 250));
      const cabinetDepthM = depthMm / 1000;

      const maxWMm = Math.max(Math.round(boxWM * 1000), 1600);
      const widthMm = Math.max(100, Math.min(maxWMm, box.upperCabinetWidthMm ?? Math.round(boxWM * 1000)));
      const cabinetWidthM = widthMm / 1000;

      let cabinetCenterX = (-boxWM / 2 + cabinetWidthM / 2) + offsetM;
      let cabinetCenterZ = side === 'rear'
        ? (-boxLM / 2 + cabinetDepthM / 2 + depthOffsetM)
        : (boxLM / 2 - cabinetDepthM / 2 - depthOffsetM);

      if (transverseMode === 'beside_box') {
        cabinetCenterX = (besideSide === 'outer')
          ? (-boxWM / 2 - cabinetWidthM / 2 - besideOffsetM)
          : (boxWM / 2 + cabinetWidthM / 2 + besideOffsetM);
      }
      if (positionMode === 'behind_box') {
        cabinetCenterZ = side === 'rear'
          ? (-boxLM / 2 - cabinetDepthM / 2 - behindOffsetM)
          : (boxLM / 2 + cabinetDepthM / 2 + behindOffsetM);
      }

      const minZ = side === 'rear'
        ? (cabinetCenterZ - cabinetDepthM / 2 - marginM)
        : (cabinetCenterZ - cabinetDepthM / 2 - doorT - marginM);
      const maxZ = side === 'rear'
        ? (cabinetCenterZ + cabinetDepthM / 2 + doorT + marginM)
        : (cabinetCenterZ + cabinetDepthM / 2 + marginM);

      zones.push({
        minX: cabinetCenterX - cabinetWidthM / 2 - marginM,
        maxX: cabinetCenterX + cabinetWidthM / 2 + marginM,
        minZ,
        maxZ
      });
    } else {
      const maxDepthMm = Math.max(Math.round(boxWM * 1000), 800);
      const depthMm = Math.max(50, Math.min(maxDepthMm, box.upperCabinetDepthMm ?? 250));
      const cabinetDepthM = depthMm / 1000;

      const maxLMm = Math.max(Math.round(boxLM * 1000), 2000);
      const lengthMm = Math.max(100, Math.min(maxLMm, box.upperCabinetWidthMm ?? Math.round(boxLM * 1000)));
      const cabinetLengthM = lengthMm / 1000;

      let cabinetCenterX = side === 'left'
        ? (boxWM / 2 - cabinetDepthM / 2 - depthOffsetM)
        : (-boxWM / 2 + cabinetDepthM / 2 + depthOffsetM);
      let cabinetCenterZ = (-boxLM / 2 + cabinetLengthM / 2) + offsetM;

      if (transverseMode === 'beside_box') {
        if (side === 'left') {
          cabinetCenterX = (besideSide === 'outer')
            ? (boxWM / 2 + cabinetDepthM / 2 + besideOffsetM)
            : (-boxWM / 2 - cabinetDepthM / 2 - besideOffsetM);
        } else {
          cabinetCenterX = (besideSide === 'outer')
            ? (-boxWM / 2 - cabinetDepthM / 2 - besideOffsetM)
            : (boxWM / 2 + cabinetDepthM / 2 + besideOffsetM);
        }
      }
      if (positionMode === 'behind_box') {
        cabinetCenterZ = (-boxLM / 2 - cabinetLengthM / 2) - behindOffsetM;
      }

      const minX = side === 'left'
        ? (cabinetCenterX - cabinetDepthM / 2 - doorT - marginM)
        : (cabinetCenterX - cabinetDepthM / 2 - marginM);
      const maxX = side === 'left'
        ? (cabinetCenterX + cabinetDepthM / 2 + marginM)
        : (cabinetCenterX + cabinetDepthM / 2 + doorT + marginM);

      zones.push({
        minX,
        maxX,
        minZ: cabinetCenterZ - cabinetLengthM / 2 - marginM,
        maxZ: cabinetCenterZ + cabinetLengthM / 2 + marginM
      });
    }
  });

  return zones;
}

/**
 * Constrói a geometria de uma chapa com furos circulares passantes CNC para alívio de peso e aeração do colchão.
 * Centralizada em (0, 0, 0), com largura w (eixo X), espessura h (eixo Y) e comprimento l (eixo Z).
 */
export function createPerforatedGeometry(
  w: number,
  h: number,
  l: number,
  options?: {
    holeDiameterMm?: number;
    spacingMm?: number;
    exclusionZones?: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
  }
): THREE.BufferGeometry {
  const hw = w / 2;
  const hl = l / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-hw, -hl);
  shape.lineTo(hw, -hl);
  shape.lineTo(hw, hl);
  shape.lineTo(-hw, hl);
  shape.closePath();

  // Diâmetro configurável do furo (padrão 40mm / 4cm)
  const diameterMm = Math.max(15, Math.min(85, options?.holeDiameterMm ?? 40));
  const customHoleRadius = (diameterMm / 1000) / 2;

  // Espaçamento configurável entre centros (padrão 85mm)
  const spacingMm = Math.max(diameterMm + 12, Math.min(180, options?.spacingMm ?? 85));
  const targetSpacing = spacingMm / 1000;

  const margin = Math.min(0.05, Math.min(w, l) * 0.12);
  const usableW = Math.max(0.02, w - 2 * margin);
  const usableL = Math.max(0.02, l - 2 * margin);

  const cols = Math.max(1, Math.round(usableW / targetSpacing));
  const rows = Math.max(1, Math.round(usableL / targetSpacing));
  const stepX = usableW / cols;
  const stepZ = usableL / rows;

  // Garante borda estrutural de madeira de segurança
  const maxSafeRadius = Math.max(0.008, Math.min(stepX, stepZ) * 0.46);
  const holeRadius = Math.min(customHoleRadius, maxSafeRadius);

  const exclusionZones = options?.exclusionZones || [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = -hw + margin + (c + 0.5) * stepX;
      const cz = -hl + margin + (r + 0.5) * stepZ;

      // Se o furo estiver sob a área de contato do armário aéreo encostado na tampa, NÃO perfura
      const isExcluded = exclusionZones.some(zone =>
        (cx + holeRadius >= zone.minX) &&
        (cx - holeRadius <= zone.maxX) &&
        (cz + holeRadius >= zone.minZ) &&
        (cz - holeRadius <= zone.maxZ)
      );

      if (isExcluded) continue;

      // Nota: ExtrudeGeometry é girado em -90° no eixo X (rotateX(-PI/2)),
      // o que projeta o eixo Y 2D da Shape diretamente no eixo -Z 3D.
      // Portanto, para que o centro 3D do furo coincida com o cz calculado e testado,
      // o centro Y no plano 2D é -cz (pois -(-cz) = +cz em 3D).
      const holePath = new THREE.Path();
      holePath.absarc(cx, -cz, holeRadius, 0, Math.PI * 2, true);
      shape.holes.push(holePath);
    }
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: false,
    curveSegments: 16
  });

  // ExtrudeGeometry extruda para +Z. Giramos -90° em X para o plano horizontal XZ
  // e transladamos em Y para centralizar perfeitamente [-h/2, +h/2].
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -h / 2, 0);

  return geo;
}

export function addPerforatedPanel(
  parent: THREE.Group,
  w: number,
  h: number,
  l: number,
  posX: number,
  posY: number,
  posZ: number,
  mat: THREE.Material,
  edgeMat?: THREE.LineBasicMaterial,
  boxId?: string,
  boxRoot?: THREE.Group,
  panelLabel?: string,
  box?: InternalBoxItem,
  extraUserData?: Record<string, any>
): THREE.Mesh {
  const exclusionZones = box ? getUpperCabinetExclusionZones(box, w, l) : [];
  const hasCabinetExclusion = exclusionZones.length > 0;
  const geo = createPerforatedGeometry(w, h, l, {
    holeDiameterMm: box?.perforationHoleDiameterMm,
    spacingMm: box?.perforationSpacingMm,
    exclusionZones
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(posX, posY, posZ);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const woodMaterial = getWoodMaterialName(box?.material);
  const thickMm = extraUserData?.thicknessMm || Math.round(Math.min(w, h, l) * 1000);
  mesh.userData = {
    isWoodPart: true,
    dimW: w,
    dimH: h,
    dimL: l,
    thicknessMm: thickMm,
    partLabel: panelLabel || (hasCabinetExclusion
      ? `Tampo Superior Vazado CNC c/ Apoio Maciço de Armário (${thickMm}mm)`
      : `Tampo Superior Vazado ${thickMm}mm (Alívio de Peso)`),
    material: `${woodMaterial} ${thickMm}mm ${hasCabinetExclusion ? 'Vazado CNC c/ Apoio do Aéreo' : 'Vazado (Alívio Peso)'}`,
    woodMaterial,
    moduleName: box?.name || '',
    partType: extraUserData?.partType || 'top',
    isInternalBox: Boolean(boxId),
    boxId,
    boxRoot,
    isPerforated: true,
    hasCabinetExclusion,
    exclusionZones,
    holeDiameterMm: box?.perforationHoleDiameterMm || 40,
    spacingMm: box?.perforationSpacingMm || 85,
    ...extraUserData
  };
  parent.add(mesh);

  if (edgeMat) {
    const edgeGeo = new THREE.EdgesGeometry(geo, 25);
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
    edgeLine.position.set(posX, posY, posZ);
    parent.add(edgeLine);
  }

  return mesh;
}

export function addPanel(
  parent: THREE.Group,
  w: number,
  h: number,
  l: number,
  posX: number,
  posY: number,
  posZ: number,
  mat: THREE.Material,
  edgeMat?: THREE.LineBasicMaterial,
  boxId?: string,
  boxRoot?: THREE.Group,
  panelLabel?: string,
  extraUserData?: Record<string, any>
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, l);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(posX, posY, posZ);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const sortedDims = [w, h, l].sort((a, b) => a - b);
  const thickMm = extraUserData?.thicknessMm || Math.round(sortedDims[0] * 1000);
  const woodMaterial = extraUserData?.woodMaterial || 'Compensado Naval';
  mesh.userData = {
    isWoodPart: true,
    dimW: w,
    dimH: h,
    dimL: l,
    thicknessMm: thickMm,
    partLabel: panelLabel || `Chapa ${woodMaterial} ${thickMm}mm`,
    material: extraUserData?.material || `${woodMaterial} ${thickMm}mm Impermeabilizado`,
    woodMaterial,
    moduleName: extraUserData?.moduleName || '',
    partType: extraUserData?.partType || 'panel',
    isInternalBox: Boolean(boxId),
    boxId,
    boxRoot,
    ...extraUserData
  };
  parent.add(mesh);

  if (edgeMat) {
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
    edgeLine.position.set(posX, posY, posZ);
    parent.add(edgeLine);
  }

  return mesh;
}

/**
 * Constrói paredes perimetrais de 15mm conforme a configuração de tamponamento
 * Por padrão NÃO possui fundo, pois o fundo de todas as caixas é a própria
 * chapa de compensado naval de 15mm da base da Doblò.
 * includeBottom só é true para a gaveta corrediça móvel (que sai para fora da van no ar) ou se selecionado.
 */

export function buildHollowBox(
  parent: THREE.Group,
  w: number,
  h: number,
  l: number,
  t: number,
  mat: THREE.Material,
  edgeMat: THREE.LineBasicMaterial,
  includeBottom: boolean = false,
  boxId?: string,
  boxRoot?: THREE.Group,
  panelsConfig?: BoxPanelsConfig,
  boxName?: string,
  box?: InternalBoxItem
) {
  const hasBottom = panelsConfig?.bottom ?? includeBottom;
  const hasLeft = panelsConfig?.left ?? true;
  const hasRight = panelsConfig?.right ?? true;
  const hasFront = panelsConfig?.front ?? true;
  const hasRear = panelsConfig?.rear ?? true;
  const hasTop = panelsConfig?.top ?? false;

  const tConfig = getBoxThickness(box);
  const tBottom = tConfig.bottom;
  const tTop = tConfig.top;
  const tLeft = tConfig.left;
  const tRight = tConfig.right;
  const tFront = tConfig.front;
  const tRear = tConfig.rear;
  const woodMat = getWoodMaterialName(box?.material);

  const jointStyle = box?.boxJointStyle || 'top_bottom_cap';
  const backCoverMode = box?.boxBackCoverMode || (jointStyle === 'back_over_all' ? 'overlay_all' : 'inset');
  const isBackOverlay = hasRear && (backCoverMode === 'overlay_all' || jointStyle === 'back_over_all');
  const isSidesOutside = jointStyle === 'sides_outside';

  // Se o fundo (rear) for sobreposto cobrindo tudo (5 partes), todas as paredes laterais, fundo base e tampo descontam tRear na traseira (-Z)
  const zBackDiscount = isBackOverlay ? tRear : 0;
  const usableL = Math.max(0.01, l - zBackDiscount);
  const zCenterOffset = zBackDiscount / 2; // Desloca o corpo +tRear/2 para frente para deixar o espaço da chapa traseira inteiriça

  // Tamponamento correto:
  // Se 'sides_outside', as laterais vão até o teto/piso (-h/2 a +h/2, altura h).
  // Se 'top_bottom_cap' (padrão), o tampo e o fundo cobrem as laterais, portanto as laterais devem descontar tTop e tBottom.
  const wallH = !isSidesOutside
    ? Math.max(0.01, h - (hasBottom ? tBottom : 0) - (hasTop ? tTop : 0))
    : (hasBottom ? Math.max(0.01, h - tBottom) : h);
  const wallY = !isSidesOutside
    ? (-h / 2 + (hasBottom ? tBottom : 0) + wallH / 2)
    : (hasBottom ? (-h / 2 + tBottom + wallH / 2) : 0);
  const prefix = boxName ? `${boxName} • ` : '';

  const xMin = hasRight ? (-w / 2 + tRight) : (-w / 2);
  const xMax = hasLeft ? (w / 2 - tLeft) : (w / 2);
  const innerW = Math.max(0.01, xMax - xMin);
  const centerInnerX = (xMin + xMax) / 2;

  // Fundo: APENAS se hasBottom for true
  if (hasBottom) {
    const tBMm = Math.round(tBottom * 1000);
    const bottomW = isSidesOutside ? innerW : w;
    const bottomX = isSidesOutside ? centerInnerX : 0;
    addPanel(
      parent, bottomW, tBottom, usableL, bottomX, -h / 2 + tBottom / 2, zCenterOffset, mat, edgeMat, boxId, boxRoot,
      `${prefix}Fundo Base (${Math.round(bottomW * 1000)}×${Math.round(usableL * 1000)}×${tBMm}mm)`,
      { thicknessMm: tBMm, woodMaterial: woodMat, moduleName: boxName, partType: 'bottom', material: `${woodMat} ${tBMm}mm Impermeabilizado` }
    );
  }

  // Lateral Esquerda (+X / motorista)
  if (hasLeft) {
    const tLMm = Math.round(tLeft * 1000);
    addPanel(
      parent, tLeft, wallH, usableL, w / 2 - tLeft / 2, wallY, zCenterOffset, mat, edgeMat, boxId, boxRoot,
      `${prefix}Lateral Esquerda (${Math.round(usableL * 1000)}×${Math.round(wallH * 1000)}×${tLMm}mm)`,
      { thicknessMm: tLMm, woodMaterial: woodMat, moduleName: boxName, partType: 'left', material: `${woodMat} ${tLMm}mm Impermeabilizado` }
    );
  }

  // Lateral Direita (-X / passageiro)
  if (hasRight) {
    const tRMm = Math.round(tRight * 1000);
    addPanel(
      parent, tRight, wallH, usableL, -w / 2 + tRight / 2, wallY, zCenterOffset, mat, edgeMat, boxId, boxRoot,
      `${prefix}Lateral Direita (${Math.round(usableL * 1000)}×${Math.round(wallH * 1000)}×${tRMm}mm)`,
      { thicknessMm: tRMm, woodMaterial: woodMat, moduleName: boxName, partType: 'right', material: `${woodMat} ${tRMm}mm Impermeabilizado` }
    );
  }

  // Altura e Y da parede frontal e do fundo embutido (descontando a base e o tampo superior para encaixe perfeito)
  const frontRearH = Math.max(0.01, h - (hasBottom ? tBottom : 0) - (hasTop ? tTop : 0));
  const frontRearY = -h / 2 + (hasBottom ? tBottom : 0) + frontRearH / 2;

  // Parede Frontal (+Z, em direção aos bancos dianteiros)
  if (hasFront) {
    const tFMm = Math.round(tFront * 1000);
    addPanel(
      parent, innerW, frontRearH, tFront, centerInnerX, frontRearY, l / 2 - tFront / 2, mat, edgeMat, boxId, boxRoot,
      `${prefix}Parede Frontal (${Math.round(innerW * 1000)}×${Math.round(frontRearH * 1000)}×${tFMm}mm)`,
      { thicknessMm: tFMm, woodMaterial: woodMat, moduleName: boxName, partType: 'front', material: `${woodMat} ${tFMm}mm Impermeabilizado` }
    );
  }

  // Parede Traseira / Tampo de Fundo (-Z, em direção ao porta-malas)
  if (hasRear) {
    const tRMm = Math.round(tRear * 1000);
    const rearW = isBackOverlay ? w : innerW;
    const rearH = isBackOverlay ? h : frontRearH;
    const rearX = isBackOverlay ? 0 : centerInnerX;
    const rearY = isBackOverlay ? 0 : frontRearY;
    const rearLabel = isBackOverlay
      ? `${prefix}Tampo Traseiro Total (Fecha 5 Partes • ${Math.round(rearW * 1000)}×${Math.round(rearH * 1000)}×${tRMm}mm)`
      : `${prefix}Fundo Traseiro Embutido (4 Partes em Volta • ${Math.round(rearW * 1000)}×${Math.round(rearH * 1000)}×${tRMm}mm)`;
    addPanel(
      parent, rearW, rearH, tRear, rearX, rearY, -l / 2 + tRear / 2, mat, edgeMat, boxId, boxRoot,
      rearLabel,
      { thicknessMm: tRMm, woodMaterial: woodMat, moduleName: boxName, partType: 'rear', material: `${woodMat} ${tRMm}mm Impermeabilizado` }
    );
  }
}


