import * as THREE from 'three';
import { LineupItem, LineupRowGroup } from './LineupTypes';
import { InternalBoxesBuilder } from '../InternalBoxesBuilder';
import { extractPvcCutStats } from '../../utils/pvcUtils';
import { sanitizeUpholsteryLabel } from '../../utils/woodUtils';

export class BarsLineupCollector {
  static collect(solarSystem: any, internalBoxesBuilder: any): {
    sortedWoodRows: LineupRowGroup[];
    sortedUpholsteryRows: LineupRowGroup[];
    sortedMetalRows: LineupRowGroup[];
    sortedPvcRows: LineupRowGroup[];
    metalItems: LineupItem[];
    woodItems: LineupItem[];
    upholsteryItems: LineupItem[];
    totalPvc: number;
  } {
    const metalItems: LineupItem[] = [];
    const woodItems: LineupItem[] = [];
    const upholsteryItems: LineupItem[] = [];

    // 1. Coleta das barras metálicas estruturais (Grupo Ferragens)
    const cargoDisabled = !solarSystem.cargoBoxConfig?.enabled;
    const cargoGroup = solarSystem.cargoBoxSystem?.group;

    solarSystem.group.traverse((obj: any) => {
      if (!obj.isMesh || !obj.userData || !obj.userData.isBar) return;

      if (cargoDisabled && cargoGroup) {
        let p = obj.parent;
        while (p) {
          if (p === cargoGroup) return;
          p = p.parent;
        }
      }

      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
      const bb = obj.geometry.boundingBox;
      const dx = bb ? Math.abs(bb.max.x - bb.min.x) : 0.04;
      const dy = bb ? Math.abs(bb.max.y - bb.min.y) : 0.04;
      const dz = bb ? Math.abs(bb.max.z - bb.min.z) : 0.04;
      const dims = [dx, dy, dz].sort((a, b) => b - a);

      const length = Number(obj.userData.barLength) || dims[0];
      const width = Math.max(0.015, dims[1]);
      const thickness = Math.max(0.005, dims[2]);
      const area = length * width;

      metalItems.push({
        sourceMesh: obj as THREE.Mesh,
        type: 'metal',
        length,
        width,
        thickness,
        thicknessMm: Math.round(thickness * 1000),
        area,
        name: obj.userData.barLabel || 'Barra Estrutural',
        profileSpec: obj.userData.profileSpec || 'Perfil Metálico Estrutural',
        material: obj.userData.material || 'Alumínio Estrutural T-Slot / Aço'
      });
    });

    // 2. Coleta das peças e chapas de madeira e almofadas de estofaria
    internalBoxesBuilder.group.traverse((obj: any) => {
      const isWood = Boolean(obj.userData?.isWoodPart);
      const isUpholstery = Boolean(obj.userData?.isUpholstery);
      if (!obj.isMesh || !obj.userData || (!isWood && !isUpholstery)) return;
      if (obj.userData.isInternalBoxHitbox) return;

      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
      const bb = obj.geometry.boundingBox;
      const dx = Number(obj.userData.dimW) || (bb ? Math.abs(bb.max.x - bb.min.x) : 0.05);
      const dy = Number(obj.userData.dimH) || (bb ? Math.abs(bb.max.y - bb.min.y) : 0.015);
      const dz = Number(obj.userData.dimL) || (bb ? Math.abs(bb.max.z - bb.min.z) : 0.05);
      const dims = [dx, dy, dz].sort((a, b) => b - a);

      const length = dims[0];
      const width = Math.max(0.015, dims[1]);
      const rawThickness = Math.max(0.003, dims[2]);
      const area = length * width;
      const isPerforated = Boolean(obj.userData.isPerforated);
      const hasCabinetExclusion = Boolean(obj.userData.hasCabinetExclusion);
      const hasCabinetCutout = Boolean(obj.userData.hasCabinetCutout);

      const thicknessMm = Number(obj.userData.thicknessMm) || Math.round(rawThickness * 1000);
      const thickness = thicknessMm > 0 ? thicknessMm / 1000 : rawThickness;

      if (isUpholstery) {
        const woodMat = String(obj.userData.woodMaterial || 'Espuma D33 (Colchão)');
        upholsteryItems.push({
          sourceMesh: obj as THREE.Mesh,
          type: 'upholstery',
          length,
          width,
          thickness,
          thicknessMm,
          woodMaterial: woodMat,
          area,
          hasCabinetCutout,
          isUpholstery: true,
          name: sanitizeUpholsteryLabel(String(obj.userData.partLabel || obj.userData.name || `Almofada Colchão ${woodMat} ${thicknessMm}mm`)),
          profileSpec: `Almofada Espuma ${Math.round(width * 1000)} × ${Math.round(length * 1000)} × ${thicknessMm} mm${hasCabinetCutout ? ' [Recorte Armário Aéreo]' : ''}`,
          material: obj.userData.material || `${woodMat} Impermeável`
        });
      } else {
        const woodMaterial = String(
          obj.userData.woodMaterial ||
          InternalBoxesBuilder.getWoodMaterialName(obj.userData.material) ||
          'Compensado Naval'
        );

        woodItems.push({
          sourceMesh: obj as THREE.Mesh,
          type: 'wood',
          length,
          width,
          thickness,
          thicknessMm,
          woodMaterial,
          area,
          isPerforated,
          hasCabinetExclusion,
          hasCabinetCutout,
          name: obj.userData.partLabel || obj.userData.name || `Chapa ${woodMaterial} ${thicknessMm}mm`,
          profileSpec: `Chapa ${Math.round(width * 1000)} × ${Math.round(length * 1000)} × ${thicknessMm} mm${isPerforated ? (hasCabinetExclusion ? ' [Vazada CNC + Base Maciça Aéreo]' : ' [Vazada CNC]') : ''}`,
          material: obj.userData.material || `${woodMaterial} ${thicknessMm}mm Impermeabilizado`
        });
      }
    });

    // 3. AGRUPAMENTO EM GRID: CADA LINHA É UM GRUPO (TIPO DE MADEIRA + ESPESSURA)
    const woodRowMap = new Map<string, LineupRowGroup>();
    woodItems.forEach((item) => {
      const thickMm = item.thicknessMm || 15;
      const woodMat = item.woodMaterial || 'Compensado Naval';
      const key = `${woodMat}__${thickMm}`;

      if (!woodRowMap.has(key)) {
        let colorHex = 0xd97706;
        if (woodMat.includes('MDF')) {
          colorHex = 0x38bdf8;
        } else if (woodMat.includes('Maciça') || woodMat.includes('Nobre')) {
          colorHex = 0xb45309;
        } else if (thickMm >= 18) {
          colorHex = 0xf59e0b;
        }

        woodRowMap.set(key, {
          key,
          type: 'wood',
          title: `🪵 ${woodMat.toUpperCase()} • ${thickMm}mm`,
          subtitle: '',
          woodMaterial: woodMat,
          thicknessMm: thickMm,
          colorHex,
          items: []
        });
      }
      woodRowMap.get(key)!.items.push(item);
    });

    const sortedWoodRows = Array.from(woodRowMap.values()).sort((a, b) => {
      if (a.woodMaterial !== b.woodMaterial) return (a.woodMaterial || '').localeCompare(b.woodMaterial || '');
      return (b.thicknessMm || 0) - (a.thicknessMm || 0);
    });

    sortedWoodRows.forEach((row) => {
      row.items.sort((a, b) => {
        if (Math.abs(b.area - a.area) > 0.0001) return b.area - a.area;
        if (Math.abs(b.length - a.length) > 0.001) return b.length - a.length;
        return a.name.localeCompare(b.name);
      });
      const totalArea = row.items.reduce((acc, it) => acc + it.area, 0);
      row.subtitle = `${row.items.length} peças • ${totalArea.toFixed(2)} m²`;
    });

    // 3.1. AGRUPAMENTO DAS ALMOFADAS DE COLCHÃO (ESTOFARIA ESPUMA D33)
    const upholsteryRowMap = new Map<string, LineupRowGroup>();
    upholsteryItems.forEach((item) => {
      const thickMm = item.thicknessMm || 80;
      const mat = item.woodMaterial || 'Espuma D33 (Colchão)';
      const key = `${mat}__${thickMm}`;

      if (!upholsteryRowMap.has(key)) {
        upholsteryRowMap.set(key, {
          key,
          type: 'upholstery',
          title: `🛏️ ${mat.toUpperCase()} • ${thickMm}mm`,
          subtitle: '',
          woodMaterial: mat,
          thicknessMm: thickMm,
          colorHex: 0x0284c7,
          items: []
        });
      }
      upholsteryRowMap.get(key)!.items.push(item);
    });

    const sortedUpholsteryRows = Array.from(upholsteryRowMap.values());
    sortedUpholsteryRows.forEach((row) => {
      row.items.sort((a, b) => {
        if (Math.abs(b.area - a.area) > 0.0001) return b.area - a.area;
        if (Math.abs(b.length - a.length) > 0.001) return b.length - a.length;
        return a.name.localeCompare(b.name);
      });
      const totalArea = row.items.reduce((acc, it) => acc + it.area, 0);
      row.subtitle = `${row.items.length} ${row.items.length === 1 ? 'almofada' : 'almofadas'} • ${totalArea.toFixed(2)} m²`;
    });

    // 4. AGRUPAMENTO DAS FERRAGENS METÁLICAS EM LINHAS POR PERFIL
    const metalRowMap = new Map<string, LineupRowGroup>();
    metalItems.forEach((item) => {
      const spec = item.profileSpec || 'Perfil Metálico';
      const key = spec;

      if (!metalRowMap.has(key)) {
        metalRowMap.set(key, {
          key,
          type: 'metal',
          title: `🔩 ${spec.toUpperCase()}`,
          subtitle: '',
          profileSpec: spec,
          colorHex: 0x38bdf8,
          items: []
        });
      }
      metalRowMap.get(key)!.items.push(item);
    });

    const sortedMetalRows = Array.from(metalRowMap.values()).sort((a, b) => {
      return b.items.length - a.items.length;
    });

    sortedMetalRows.forEach((row) => {
      row.items.sort((a, b) => {
        if (Math.abs(b.length - a.length) > 0.001) return b.length - a.length;
        return a.name.localeCompare(b.name);
      });
      const totalMeters = row.items.reduce((acc, it) => acc + it.length, 0);
      row.subtitle = `${row.items.length} barras • ${totalMeters.toFixed(1)} m`;
    });

    // 4.1 COLETA DOS CANOS & CONEXÕES DE PVC
    const pvcItems: LineupItem[] = [];
    const pvcFittingItems: LineupItem[] = [];
    const sortedPvcRows: LineupRowGroup[] = [];

    if (solarSystem.waterTankConfig?.enabled) {
      const pvcStats = extractPvcCutStats(solarSystem.waterTankConfig);
      const diamM = pvcStats.diameterMm / 1000;
      pvcStats.cutItems.forEach((c) => {
        pvcItems.push({
          sourceMesh: null,
          type: 'pvc',
          length: c.lengthM,
          width: diamM,
          thickness: diamM,
          thicknessMm: pvcStats.diameterMm,
          area: c.lengthM * diamM,
          name: c.label,
          profileSpec: c.spec,
          material: `PVC Série R / Esgoto Ø${pvcStats.diameterMm}mm`,
          pvcFittingType: 'pipe'
        });
      });

      if (pvcItems.length > 0) {
        sortedPvcRows.push({
          key: 'pvc_water_pipes',
          type: 'pvc',
          title: `💧 TUBOS PVC • Ø${pvcStats.diameterMm}mm (CAIXA D'ÁGUA EM U)`,
          subtitle: `${pvcItems.length} tubos lineares • ${pvcStats.totalLinearMeters}m corte • ${pvcStats.totalCapacityL}L total`,
          profileSpec: `Tubo PVC Ø${pvcStats.diameterMm}mm`,
          colorHex: 0x0ea5e9,
          items: pvcItems
        });
      }

      const elbowSpanM = Math.round(diamM * 1.45 * 1000) / 1000;
      const fittingThickM = Math.round(diamM * 1.10 * 1000) / 1000;
      const capLenM = Math.round(diamM * 0.485 * 1000) / 1000;

      pvcFittingItems.push(
        {
          sourceMesh: null,
          type: 'pvc',
          length: elbowSpanM,
          width: elbowSpanM,
          thickness: fittingThickM,
          thicknessMm: pvcStats.diameterMm,
          area: +(elbowSpanM * elbowSpanM).toFixed(3),
          name: 'Joelho 90° PVC com Bolsa Reforçada (Dianteiro Esq.)',
          profileSpec: `Joelho 90° Ø${pvcStats.diameterMm}mm`,
          material: `PVC Série R / Esgoto Ø${pvcStats.diameterMm}mm`,
          pvcFittingType: 'elbow_90'
        },
        {
          sourceMesh: null,
          type: 'pvc',
          length: elbowSpanM,
          width: elbowSpanM,
          thickness: fittingThickM,
          thicknessMm: pvcStats.diameterMm,
          area: +(elbowSpanM * elbowSpanM).toFixed(3),
          name: 'Joelho 90° PVC com Bolsa Reforçada (Dianteiro Dir.)',
          profileSpec: `Joelho 90° Ø${pvcStats.diameterMm}mm`,
          material: `PVC Série R / Esgoto Ø${pvcStats.diameterMm}mm`,
          pvcFittingType: 'elbow_90'
        },
        {
          sourceMesh: null,
          type: 'pvc',
          length: capLenM,
          width: fittingThickM,
          thickness: fittingThickM,
          thicknessMm: pvcStats.diameterMm,
          area: +(capLenM * fittingThickM).toFixed(3),
          name: 'CAP (Tampão) de Vedação PVC Traseiro (Esq.)',
          profileSpec: `CAP Soldável Ø${pvcStats.diameterMm}mm`,
          material: `PVC Série R / Esgoto Ø${pvcStats.diameterMm}mm`,
          pvcFittingType: 'cap'
        },
        {
          sourceMesh: null,
          type: 'pvc',
          length: capLenM,
          width: fittingThickM,
          thickness: fittingThickM,
          thicknessMm: pvcStats.diameterMm,
          area: +(capLenM * fittingThickM).toFixed(3),
          name: 'CAP (Tampão) de Vedação PVC Traseiro (Dir.)',
          profileSpec: `CAP Soldável Ø${pvcStats.diameterMm}mm`,
          material: `PVC Série R / Esgoto Ø${pvcStats.diameterMm}mm`,
          pvcFittingType: 'cap'
        }
      );

      sortedPvcRows.push({
        key: 'pvc_water_fittings',
        type: 'pvc',
        title: `💧 CONEXÕES PVC & VEDAÇÃO • Ø${pvcStats.diameterMm}mm (JOELHOS 90° & CAPS)`,
        subtitle: `4 conexões (2× Joelhos 90° c/ bolsa + 2× CAPs soldáveis) • Caixa d'Água em U`,
        profileSpec: `Conexões PVC Ø${pvcStats.diameterMm}mm`,
        colorHex: 0x38bdf8,
        items: pvcFittingItems
      });
    }

    const totalPvc = pvcItems.length + pvcFittingItems.length;

    return {
      sortedWoodRows,
      sortedUpholsteryRows,
      sortedMetalRows,
      sortedPvcRows,
      metalItems,
      woodItems,
      upholsteryItems,
      totalPvc
    };
  }
}
