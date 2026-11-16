export interface MpptPreset {
  id: string;
  isDefault?: boolean;
  name: string;         // ex: 'Kingbo MPPT 60A'
  brand: string;
  model: string;
  maxAmps: number;      // 60
  maxPvVoltage: number; // 230
  dimensionsMm: { width: number; height: number; depth: number };
  weightKg: number;
  features?: string[];
  description?: string;
}
