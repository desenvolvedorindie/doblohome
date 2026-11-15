import { CargoBoxConfig, WaterTankConfig, AwningConfig, PanelOrientation, SlideDirection } from '../../types';

export const DEFAULT_PANEL_SPECS = {
  width: 0.590,
  length: 0.875,
  thickness: 0.003,
  weightKg: 1.8,
  powerWatts: 100,
  voc: 18.0,
  vmp: 15.0,
  isc: 7.32,
  imp: 6.67,
  name: 'Placa Solar Flexível Inohouse 100W (JTN-100W)',
  cellCount: 32,
  cols: 4,
  rows: 8
};

export const DEFAULT_CARGO_BOX_CONFIG: CargoBoxConfig = {
  enabled: true,
  length: 1600,
  width: 1000,
  height: 330,
  verticalLiftMm: 0,
  hingeSide: 'driver',
  tiltAngle: 0,
  lidAngle: 0
};

export const DEFAULT_WATER_TANK_CONFIG: WaterTankConfig = {
  enabled: true,
  lengthMm: 2200,
  diameterMm: 200,
  connectionPosition: 'front'
};

export const DEFAULT_AWNING_CONFIG: AwningConfig = {
  enabled: true,
  type: 'rear',
  side: 'passenger',
  lengthMm: 1500,
  extensionMm: 2000,
  isOpen: false,
  fabricColor: '#374151'
};

export const DEFAULT_LEVEL1_CONFIG = {
  panels: 2,
  slideDirection: 'longitudinal' as SlideDirection,
  orientation: 'longitudinal' as PanelOrientation
};

export const DEFAULT_LEVEL2_CONFIG = {
  panels: 2,
  slideDirection: 'fixed' as SlideDirection,
  orientation: 'longitudinal' as PanelOrientation
};
