export interface B2bPreset {
  id: string;
  isDefault?: boolean;
  name: string;         // ex: 'B2B1230 Renogy 30A'
  brand: string;
  model: string;
  chargingAmps: number; // 30
  voltageIn: number;    // 12
  voltageOut: number;   // 14.4
  dimensionsMm: { width: number; height: number; depth: number };
  weightKg: number;
  features?: string[];
  description?: string;
}
