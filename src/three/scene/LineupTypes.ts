import * as THREE from 'three';

export interface LineupItem {
  sourceMesh: THREE.Mesh | null;
  type: 'metal' | 'wood' | 'upholstery' | 'pvc' | 'awning';
  length: number;
  width: number;
  thickness: number;
  thicknessMm: number;
  woodMaterial?: string;
  area: number;
  name: string;
  profileSpec: string;
  material: string;
  isPerforated?: boolean;
  hasCabinetExclusion?: boolean;
  hasCabinetCutout?: boolean;
  isUpholstery?: boolean;
  pvcFittingType?: 'elbow_90' | 'tee_90' | 'cap' | 'pipe';
  isMetalonCap?: boolean;
  capProfileSize?: 30 | 40;
  colorHex?: number;
}

export interface LineupRowGroup {
  key: string;
  type: 'metal' | 'wood' | 'upholstery' | 'pvc' | 'awning';
  title: string;
  subtitle: string;
  woodMaterial?: string;
  thicknessMm?: number;
  profileSpec?: string;
  colorHex: number;
  items: LineupItem[];
}
