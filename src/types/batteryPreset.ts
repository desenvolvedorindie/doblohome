export interface BatteryPreset {
  id: string;
  isDefault?: boolean;
  name: string;         // ex: 'Kingbo LiFePO4 560Ah'
  brand: string;
  model: string;
  chemistry: string;    // ex: 'LiFePO4', 'AGM', 'GEL'
  voltageNominal: number; // 12.8
  capacityAh: number;   // 560
  bmsAmps: number;      // 200
  dimensionsMm: { width: number; height: number; depth: number };
  weightKg: number;
  features?: string[];
  description?: string;
}
