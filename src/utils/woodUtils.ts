import { groupProfilesByThickness, ProfileThicknessGroup, CutGroupThicknessSection } from './weldedJointsUtils';

export interface WoodCutGroup {
  key: string;
  label: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  lengthM: number;
  widthM: number;
  areaM2: number;
  qty: number;
  totalAreaM2: number;
  material: string;
  woodMaterial?: string;
  moduleName?: string;
  partType?: string;
  isPerforated?: boolean;
  holeDiameterMm?: number;
  spacingMm?: number;
  exclusionZones?: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
  hasCabinetExclusion?: boolean;
  isRearShelf?: boolean;
}

export interface WoodGroupByCategory {
  key: string;
  woodMaterial: string;
  thicknessMm: number;
  totalPieces: number;
  totalAreaM2: number;
  estimatedSheets: number;
  pieces: WoodCutGroup[];
}

export interface BarCutGroup {
  key: string;
  label: string;
  profileSpec: string;
  lengthMm: number;
  lengthM: number;
  qty: number;
  totalLengthM: number;
}

export interface ProfileSummary {
  profileSpec: string;
  pieces: number;
  totalMeters: number;
  bars6m: number;
  bars3m: number;
}

/**
 * Extrai todas as peças e chapas de madeira dos módulos internos do campervan
 * a partir do sceneManager.internalBoxesBuilder.
 */
export function extractWoodCutGroups(sceneManager: any): {
  totalPieces: number;
  totalAreaM2: number;
  standardSheets: number;
  cutGroups: WoodCutGroup[];
} {
  const groupsMap = new Map<string, WoodCutGroup>();
  let totalPieces = 0;
  let totalAreaM2 = 0;

  if (sceneManager && sceneManager.internalBoxesBuilder) {
    sceneManager.internalBoxesBuilder.group.traverse((obj: any) => {
      if (!obj.isMesh || !obj.userData || !obj.userData.isWoodPart) return;
      if (obj.userData.isInternalBoxHitbox) return;

      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
      const bb = obj.geometry.boundingBox;
      const dx = Number(obj.userData.dimW) || (bb ? Math.abs(bb.max.x - bb.min.x) : 0.05);
      const dy = Number(obj.userData.dimH) || (bb ? Math.abs(bb.max.y - bb.min.y) : 0.015);
      const dz = Number(obj.userData.dimL) || (bb ? Math.abs(bb.max.z - bb.min.z) : 0.05);
      const dims = [dx, dy, dz].sort((a, b) => b - a);

      const lengthM = dims[0];
      const widthM = Math.max(0.015, dims[1]);
      const thicknessM = Math.max(0.003, dims[2]);
      const areaM2 = lengthM * widthM;

      const lengthMm = Math.round(lengthM * 1000);
      const widthMm = Math.round(widthM * 1000);
      const thicknessMm = Number(obj.userData.thicknessMm) || Math.round(thicknessM * 1000);
      const isPerforated = Boolean(obj.userData.isPerforated);
      const hasCabinetExclusion = Boolean(obj.userData.hasCabinetExclusion);
      const isRearShelf = Boolean(obj.userData.isRearShelf);

      const woodMaterial = String(
        obj.userData.woodMaterial ||
        (obj.userData.material?.includes('MDF')
          ? 'MDF Branco Ultra'
          : obj.userData.material?.includes('Maciça')
            ? 'Madeira Nobre Maciça'
            : 'Compensado Naval')
      );

      const moduleName = String(obj.userData.moduleName || '');
      const partType = String(obj.userData.partType || '');
      const holeDiameterMm = obj.userData.holeDiameterMm ? Number(obj.userData.holeDiameterMm) : 40;
      const spacingMm = obj.userData.spacingMm ? Number(obj.userData.spacingMm) : 85;
      const exclusionZones = obj.userData.exclusionZones || undefined;

      const rawLabel = String(obj.userData.partLabel || obj.userData.name || `Chapa ${woodMaterial} ${thicknessMm}mm`)
        .replace(/\s*\(#\d+\)/g, '')
        .trim();
      const material = String(obj.userData.material || `${woodMaterial} ${thicknessMm}mm Impermeabilizado`);

      totalPieces += 1;
      totalAreaM2 += areaM2;

      const key = `${woodMaterial}__${thicknessMm}__${rawLabel}__${widthMm}x${lengthMm}${isPerforated ? '__perf' : ''}${hasCabinetExclusion ? '__cabex' : ''}${isRearShelf ? '__shelf' : ''}`;
      const existing = groupsMap.get(key);
      if (existing) {
        existing.qty += 1;
        existing.totalAreaM2 += areaM2;
      } else {
        groupsMap.set(key, {
          key,
          label: rawLabel,
          lengthMm,
          widthMm,
          thicknessMm,
          lengthM,
          widthM,
          areaM2,
          qty: 1,
          totalAreaM2: areaM2,
          material,
          woodMaterial,
          moduleName,
          partType,
          isPerforated,
          holeDiameterMm,
          spacingMm,
          exclusionZones,
          hasCabinetExclusion,
          isRearShelf
        });
      }
    });
  }

  const cutGroups = Array.from(groupsMap.values()).sort((a, b) => {
    if (Math.abs(b.totalAreaM2 - a.totalAreaM2) > 0.0001) return b.totalAreaM2 - a.totalAreaM2;
    if (b.lengthMm !== a.lengthMm) return b.lengthMm - a.lengthMm;
    return a.label.localeCompare(b.label);
  });

  const standardSheets = Math.max(1, Math.ceil((totalAreaM2 * 1.10) / 2.977));

  return {
    totalPieces,
    totalAreaM2,
    standardSheets,
    cutGroups
  };
}

/**
 * Agrupa as peças de madeira por [Tipo de Madeira] + [Espessura] estilo Corte Cloud
 */
export function groupWoodCutPieces(cutGroups: WoodCutGroup[]): WoodGroupByCategory[] {
  const map = new Map<string, WoodGroupByCategory>();

  cutGroups.forEach((group) => {
    const woodMat = group.woodMaterial || 'Compensado Naval';
    const thick = group.thicknessMm || 15;
    const key = `${woodMat}__${thick}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        woodMaterial: woodMat,
        thicknessMm: thick,
        totalPieces: 0,
        totalAreaM2: 0,
        estimatedSheets: 0,
        pieces: []
      });
    }

    const cat = map.get(key)!;
    cat.pieces.push(group);
    cat.totalPieces += group.qty;
    cat.totalAreaM2 += group.totalAreaM2;
  });

  const result = Array.from(map.values());
  result.forEach((cat) => {
    const sheetArea = cat.woodMaterial.includes('MDF') ? 2.75 * 1.83 : 2.44 * 1.22;
    cat.estimatedSheets = Math.max(1, Math.ceil((cat.totalAreaM2 * 1.10) / sheetArea));
  });

  return result.sort((a, b) => {
    if (a.woodMaterial !== b.woodMaterial) return a.woodMaterial.localeCompare(b.woodMaterial);
    return b.thicknessMm - a.thicknessMm;
  });
}

/**
 * Extrai todas as barras metálicas estruturais (Perfis T-Slot / Metalon)
 */
export function extractBarStats(sceneManager: any): {
  totalPieces: number;
  totalMeters: number;
  totalBars6m: number;
  cutGroups: BarCutGroup[];
  profileSummaries: ProfileSummary[];
  thicknessGroups: ProfileThicknessGroup[];
  cutThicknessGroups: CutGroupThicknessSection[];
} {
  const groupsMap = new Map<string, BarCutGroup>();
  const profileMap = new Map<string, ProfileSummary>();
  let totalPieces = 0;
  let totalMeters = 0;

  if (sceneManager && sceneManager.solarSystem) {
    const cargoDisabled = !sceneManager.solarSystem.cargoBoxConfig?.enabled;
    const cargoGroup = sceneManager.solarSystem.cargoBoxSystem?.group;

    sceneManager.solarSystem.group.traverse((obj: any) => {
      if (!obj.isMesh || !obj.userData || !obj.userData.isBar) return;

      if (cargoDisabled && cargoGroup) {
        let p = obj.parent;
        while (p) {
          if (p === cargoGroup) return;
          p = p.parent;
        }
      }

      const lengthM = Number(obj.userData.barLength) || 0;
      const lengthMm = Math.round(lengthM * 1000);
      const rawLabel = String(obj.userData.barLabel || 'Barra Estrutural')
        .replace(/\s*\(#\d+\)/g, '')
        .trim();
      const profileSpec = String(obj.userData.profileSpec || 'Perfil Estrutural');

      totalPieces += 1;
      totalMeters += lengthM;

      const key = `${profileSpec}__${rawLabel}__${lengthMm}`;
      const existing = groupsMap.get(key);
      if (existing) {
        existing.qty += 1;
        existing.totalLengthM += lengthM;
      } else {
        groupsMap.set(key, {
          key,
          label: rawLabel,
          profileSpec,
          lengthMm,
          lengthM,
          qty: 1,
          totalLengthM: lengthM
        });
      }

      const pSum = profileMap.get(profileSpec);
      if (pSum) {
        pSum.pieces += 1;
        pSum.totalMeters += lengthM;
      } else {
        profileMap.set(profileSpec, {
          profileSpec,
          pieces: 1,
          totalMeters: lengthM,
          bars6m: 0,
          bars3m: 0
        });
      }
    });
  }

  const cutGroups = Array.from(groupsMap.values()).sort((a, b) => {
    if (b.lengthMm !== a.lengthMm) return b.lengthMm - a.lengthMm;
    return a.label.localeCompare(b.label);
  });

  const profileSummaries = Array.from(profileMap.values())
    .map((p) => ({
      ...p,
      bars6m: Math.max(1, Math.ceil((p.totalMeters * 1.05) / 6.0)),
      bars3m: Math.max(1, Math.ceil((p.totalMeters * 1.05) / 3.0))
    }))
    .sort((a, b) => b.totalMeters - a.totalMeters);

  const totalBars6m = profileSummaries
    .filter((p) =>
      p.profileSpec.includes('T-Slot') ||
      p.profileSpec.includes('Metalon') ||
      p.profileSpec.includes('Tubo Retangular') ||
      p.profileSpec.includes('Tubo Telescópico')
    )
    .reduce((acc, p) => acc + p.bars6m, 0);

  const { thicknessGroups, cutThicknessGroups } = groupProfilesByThickness(profileSummaries, cutGroups);

  return {
    totalPieces,
    totalMeters,
    totalBars6m,
    cutGroups,
    profileSummaries,
    thicknessGroups,
    cutThicknessGroups
  };
}
