import * as THREE from 'three';
import { InternalBoxItem, UpperCabinetSide, getUpperCabinetClosure, getUpperCabinetShelfDoorDiscountMm, InternalGridConfig } from '../../types';
import { FLOOR_Y, CEILING_Y, getBoxThickness, getWoodMaterialName } from './BoxGeometryHelpers';
import { UpperCabinetContext } from './UpperCabinetContext';
import { UpperCabinetTransverseBuilder } from './UpperCabinetTransverseBuilder';
import { UpperCabinetLongitudinalBuilder } from './UpperCabinetLongitudinalBuilder';

export class UpperCabinetBuilder {
  private transverseBuilder = new UpperCabinetTransverseBuilder();
  private longitudinalBuilder = new UpperCabinetLongitudinalBuilder();

  buildUpperCabinet(
    container: THREE.Group,
    boxWM: number,
    boxLM: number,
    boxHM: number,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean,
    grid?: InternalGridConfig
  ) {
    const tConfig = getBoxThickness(box);
    const t = tConfig.cabinet; // Espessura das chapas do armário aéreo
    const tMm = Math.round(t * 1000);
    const doorT = tConfig.door; // Espessura das portas do armário aéreo
    const doorTMm = Math.round(doorT * 1000);
    const woodMat = getWoodMaterialName(box.material);
    const cabinetUserData = {
      thicknessMm: tMm,
      woodMaterial: woodMat,
      moduleName: box.name,
      partType: 'cabinet',
      material: `${woodMat} ${tMm}mm Impermeabilizado`
    };
    const floorY = FLOOR_Y;
    const heightOffsetM = (grid?.ceiling?.heightOffsetMm ?? 0) / 1000;
    const ceilingY = CEILING_Y + heightOffsetM; // Altura do teto da Doblò
    const isSlatted = (grid?.ceiling?.type || 'slatted') === 'slatted';
    const ceilingThicknessM = (grid?.ceiling && grid.ceiling.enabled !== false)
      ? (isSlatted ? (grid.ceiling.slatThicknessMm || 12) / 1000 : (grid.ceiling.thicknessMm || 9) / 1000)
      : 0;
    // O armário aéreo termina na face inferior do forro do teto, garantindo que o teto fique acima do armário sem invadir o interior:
    const cabinetCeilingLimitY = ceilingY - ceilingThicknessM;
    const boxTopY = floorY + boxHM;

    // Espaçamento inferior configurável (padrão 0mm)
    const bottomGapMm = Math.max(0, box.upperCabinetBottomGapMm ?? 0);
    const bottomGapM = bottomGapMm / 1000;

    // Altura vai do topo do vão inferior até a face inferior do forro do teto
    const availableH = cabinetCeilingLimitY - (boxTopY + bottomGapM);
    const cabinetH = Math.max(0.15, availableH);

    // Posição Y relativa ao centro da caixa base (centro da caixa está em boxHM / 2):
    const cabinetCenterY = boxHM / 2 + bottomGapM + cabinetH / 2;

    const cabinetMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x38bdf8 : (box.material === 'white_mdf' ? 0xf8fafc : (box.material === 'dark_wood' ? 0x78350f : 0xd4a373)),
      roughness: 0.65,
      metalness: 0.05
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0x475569,
      linewidth: 1,
      transparent: true,
      opacity: 0.6
    });

    const positionMode = box.upperCabinetPositionMode || 'on_box';
    const behindOffsetMm = Math.max(0, box.upperCabinetBehindOffsetMm ?? 0);
    const behindOffsetM = behindOffsetMm / 1000;
    const transverseMode = box.upperCabinetTransverseMode || 'on_box';
    const besideOffsetMm = Math.max(0, box.upperCabinetBesideOffsetMm ?? 0);
    const besideOffsetM = besideOffsetMm / 1000;
    const besideSide = box.upperCabinetBesideSide || 'corridor';
    const offsetMm = box.upperCabinetOffsetMm ?? 0;
    const offsetM = offsetMm / 1000;
    const depthOffsetMm = box.upperCabinetDepthOffsetMm ?? 0;
    const depthOffsetM = depthOffsetMm / 1000;

    // Se NÃO tiver espaçamento inferior (bottomGapMm === 0) e a caixa tiver tampo superior,
    // não precisa ter 2 madeiras a menos que o armário comece fora ou depois do final da caixa.
    const isOverhanging = Math.abs(offsetM) > 0.05 || Math.abs(depthOffsetM) > 0.05 || positionMode === 'behind_box' || transverseMode === 'beside_box';
    const hasBasePanelAuto = bottomGapM > 0.001 || (box.panels?.top === false) || isOverhanging;
    // upperCabinetHasBasePanel: true = forçar 5 faces (com base inferior), false = forçar 4 faces (sem base), undefined = automático
    const hasBasePanel = box.upperCabinetHasBasePanel !== undefined ? box.upperCabinetHasBasePanel : hasBasePanelAuto;
    const innerH = hasBasePanel ? (cabinetH - 2 * t) : (cabinetH - t);
    const interiorBottomY = hasBasePanel ? (-cabinetH / 2 + t) : (-cabinetH / 2);
    const backY = hasBasePanel ? 0 : -t / 2;

    const closure = getUpperCabinetClosure(box);
    const hasDoors = closure === 'doors';
    const isSlidingDoors = closure === 'sliding_doors';
    const isDrawer = false;
    const numShelves = Math.max(1, Math.min(3, box.upperCabinetShelves ?? 1));
    const shelfDoorDiscountMm = getUpperCabinetShelfDoorDiscountMm(box);
    const shelfDoorDiscountM = shelfDoorDiscountMm / 1000;

    // Determina quais laterais estão ativas
    const activeSides: UpperCabinetSide[] = (() => {
      if (box.upperCabinetSides && box.upperCabinetSides.length > 0) {
        return Array.from(new Set(box.upperCabinetSides));
      }
      if (box.upperCabinetAlign === 'all') {
        return ['rear', 'front', 'left', 'right'];
      }
      if (box.upperCabinetAlign === 'left') return ['left'];
      if (box.upperCabinetAlign === 'right') return ['right'];
      if (box.upperCabinetAlign === 'front') return ['front'];
      return ['rear'];
    })();

    activeSides.forEach((side) => {
      const upperGroup = new THREE.Group();
      upperGroup.name = `UpperCabinet_${box.id}_${side}`;

      const ctx: UpperCabinetContext = {
        container,
        upperGroup,
        box,
        side,
        boxWM,
        boxLM,
        cabinetH,
        cabinetCenterY,
        t,
        tMm,
        doorT,
        doorTMm,
        woodMat,
        cabinetUserData,
        cabinetMat,
        edgeMat,
        offsetM,
        depthOffsetM,
        positionMode,
        behindOffsetM,
        transverseMode,
        besideSide,
        besideOffsetM,
        closure,
        hasDoors,
        isSlidingDoors,
        isDrawer,
        numShelves,
        shelfDoorDiscountM,
        shelfDoorDiscountMm,
        isOpen,
        isSelected,
        innerH,
        interiorBottomY,
        backY,
        hasBasePanel
      };

      if (side === 'rear' || side === 'front') {
        this.transverseBuilder.buildTransverseCabinet(ctx);
      } else {
        this.longitudinalBuilder.buildLongitudinalCabinet(ctx);
      }

      container.add(upperGroup);
    });
  }
}
