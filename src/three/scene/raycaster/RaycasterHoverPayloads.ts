import * as THREE from 'three';
import { BarMeasurementData } from '../../../types';

const WOOD_PART_PURPOSE: Record<string, string> = {
  top: 'Tampo ou tampa superior de fechamento e apoio estrutural do módulo',
  bottom: 'Fundo ou base estrutural de sustentação do módulo',
  left: 'Lateral esquerda estrutural do módulo (+X / motorista)',
  right: 'Lateral direita estrutural do módulo (-X / passageiro)',
  front: 'Parede ou frente estrutural do módulo (+Z / cabine)',
  rear: 'Fechamento ou parede traseira do módulo (-Z / porta-malas)',
  divider: 'Divisória interna para compartimentação e travamento estrutural',
  shelf: 'Prateleira ou bancada do módulo',
  slat: 'Ripa ou aba do estrado retrátil articulado da cama',
  leg: 'Pé de apoio articulado no assoalho quando o estrado está estendido',
  cabinet: 'Chapa estrutural do armário aéreo superior do módulo'
};

export function extractCleanPartName(partLabel?: string, moduleName?: string): string {
  if (!partLabel) return '';
  if (moduleName && partLabel.startsWith(`${moduleName} • `)) {
    return partLabel.slice(moduleName.length + 3);
  }
  return partLabel;
}

export function buildWoodHoverPayload(d: Record<string, any>, fallbackModuleName?: string): BarMeasurementData {
  const dimsM = [Number(d.dimW) || 0, Number(d.dimH) || 0, Number(d.dimL) || 0].filter((v) => v > 0);
  const sortedDescM = [...dimsM].sort((a, b) => b - a);
  const maxDimM = sortedDescM[0] || 0;
  const midDimM = sortedDescM[1] || maxDimM;
  const minDimMm = sortedDescM.length >= 3 ? Math.round(sortedDescM[2] * 1000) : (d.thicknessMm || 15);
  const thickMm = d.thicknessMm || minDimMm;
  const maxDimMm = Math.round(maxDimM * 1000);
  const midDimMm = Math.round(midDimM * 1000);

  const modName = d.moduleName || fallbackModuleName || '';
  const name = extractCleanPartName(d.partLabel, modName)
    || `Chapa ${d.woodMaterial || 'Compensado Naval'} ${thickMm}mm`;
  const moduleSuffix = modName ? ` • ${modName}` : '';
  const roleDescription = d.isRearShelf
    ? 'Prateleira/bancada traseira rebatível com acabamento decorativo'
    : (WOOD_PART_PURPOSE[d.partType] || 'Peça estrutural de marcenaria do módulo');
  const purpose = modName
    ? `Peça "${name}" do módulo "${modName}". ${roleDescription}`
    : roleDescription;

  return {
    name,
    category: `🪵 Peça de Madeira${moduleSuffix}`,
    barLength: maxDimM > 0 ? maxDimM : undefined,
    barWidth: midDimM > 0 ? midDimM : undefined,
    barProfile: maxDimMm > 0 ? `${maxDimMm} × ${midDimMm} mm (Espessura: ${thickMm} mm)` : `Espessura: ${thickMm} mm`,
    material: d.material || `${d.woodMaterial || 'Compensado Naval'} ${thickMm}mm`,
    purpose
  };
}

export function buildUpholsteryHoverPayload(d: Record<string, any>): BarMeasurementData {
  const dimsM = [Number(d.dimW) || 0, Number(d.dimH) || 0, Number(d.dimL) || 0].filter((v) => v > 0);
  const sortedDescM = [...dimsM].sort((a, b) => b - a);
  const maxDimM = sortedDescM[0] || 0;
  const midDimM = sortedDescM[1] || maxDimM;
  const thickMm = d.thicknessMm || Math.round((sortedDescM[2] || 0) * 1000);
  const maxDimMm = Math.round(maxDimM * 1000);
  const midDimMm = Math.round(midDimM * 1000);

  return {
    name: extractCleanPartName(d.partLabel, d.moduleName) || 'Almofada / Estofado',
    category: d.category || `🛏️ Estofaria${d.moduleName ? ` • ${d.moduleName}` : ''}`,
    barLength: maxDimM > 0 ? maxDimM : undefined,
    barProfile: maxDimMm > 0 ? `${maxDimMm} × ${midDimMm} × ${thickMm} mm` : `${thickMm} mm`,
    material: d.material || 'Espuma D33 Revestida em Tecido Impermeável',
    purpose: d.hasCabinetCutout
      ? 'Estofado modular sob medida com recorte para interferência de módulo/armário'
      : 'Estofado modular removível do módulo cama/sofá'
  };
}

export function buildHardwareHoverPayload(d: Record<string, any>, fallbackName: string): BarMeasurementData {
  return {
    name: extractCleanPartName(d.partLabel || d.name || fallbackName, d.moduleName) || 'Ferragem / Acessório',
    category: d.category || `🔩 Ferragem${d.moduleName ? ` • ${d.moduleName}` : ''}`,
    barProfile: d.barProfile,
    capacity: d.capacity,
    material: d.material || 'Aço / Metal Náutico',
    purpose: d.purpose || 'Ferragem de sustentação, deslizamento ou travamento do módulo'
  };
}

export function buildTargetHoverPayload(target: THREE.Object3D): BarMeasurementData {
  const d = target.userData || {};
  if (d.isLineupPart) {
    return {
      name: d.name || 'Peça da Bancada',
      category: d.category || (d.isWoodPart ? '🪵 Madeira 15mm' : '🔩 Perfil Metálico'),
      barLength: d.barLength,
      barWidth: d.barWidth,
      barProfile: d.profileSpec,
      material: d.material,
      purpose: d.purpose
    };
  }
  if (d.isInternalFloorPlywood || d.isBasePlywood) {
    return {
      name: d.name || 'Chapa Base Compensado Naval 15mm',
      category: d.category || '🪵 Assoalho Base Campervan',
      barProfile: d.barProfile || 'Compensado Naval 15mm',
      capacity: d.capacity || 'Fundo Comum dos Módulos',
      material: d.material || 'Compensado Naval 15mm Impermeabilizado',
      purpose: d.purpose || 'Base estrutural de nivelamento e fixação dos móveis internos da Doblò'
    };
  }
  if (d.isAppliance) {
    const dims = d.dimensions || {};
    const applianceType = d.isStove ? 'stove' : d.isFridge ? 'fridge' : 'portapotti';
    return {
      name: d.partLabel || d.name || 'Equipamento Embarcado',
      category: d.category || 'Equipamento Camper',
      isAppliance: true,
      applianceType,
      barProfile: dims.widthMm ? `${dims.widthMm} × ${dims.depthMm} × ${dims.heightMm} mm` : undefined,
      power: d.power,
      capacity: d.capacity,
      weightText: d.weightKg !== undefined ? `${d.weightKg} kg` : undefined,
      material: d.material,
      purpose: d.purpose,
      features: d.features
    };
  }
  if (d.isElectrical) {
    return {
      name: d.name || target.name || 'Componente Elétrico',
      category: d.category || 'Componente Elétrico',
      isElectrical: true,
      electricalType: d.electricalType,
      voltage: d.voltage,
      capacity: d.capacity,
      current: d.current,
      power: d.power,
      efficiency: d.efficiency,
      material: d.material,
      purpose: d.purpose,
      features: d.features
    };
  }
  if (d.isWoodPart) {
    return buildWoodHoverPayload(d);
  }
  if (d.isUpholstery) {
    return buildUpholsteryHoverPayload(d);
  }
  if (d.isHardware) {
    return buildHardwareHoverPayload(d, target.name);
  }
  if (d.isInternalBox) {
    const dims = d.dimensions || {};
    return {
      name: d.boxName || 'Armazenador Interno',
      category: d.boxType === 'drawer' ? '📦 Gavetão Deslizante Camper' : '🧰 Baú de Armazenamento',
      barProfile: `${dims.widthMm} × ${dims.lengthMm} × ${dims.heightMm} mm`,
      capacity: `${dims.volumeLiters} Litros`,
      material: 'Compensado Naval / MDF Camper',
      purpose: 'Armazenamento interno modular no assoalho da Doblò'
    };
  }
  return {
    name: d.barLabel || target.name || 'Barra Estrutural',
    barLength: d.barLength,
    barProfile: d.profileSpec,
    cutAngle: d.cutAngle,
    material: d.material,
    level: d.level
  };
}
