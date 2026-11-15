import { ElectricalPortPolarity } from '../../types/electricalPlanar';

export interface WireGaugeSpec {
  mm2: number;
  maxAmps: number;
}

/** Tabela de bitolas comerciais de cabo de cobre flexível (automotivo/solar) */
export const COPPER_WIRE_TABLE: WireGaugeSpec[] = [
  { mm2: 1.0, maxAmps: 11 },
  { mm2: 1.5, maxAmps: 15 },
  { mm2: 2.5, maxAmps: 24 },
  { mm2: 4, maxAmps: 32 },
  { mm2: 6, maxAmps: 41 },
  { mm2: 10, maxAmps: 57 },
  { mm2: 16, maxAmps: 76 },
  { mm2: 25, maxAmps: 101 },
  { mm2: 35, maxAmps: 125 },
  { mm2: 50, maxAmps: 151 },
  { mm2: 70, maxAmps: 192 },
  { mm2: 95, maxAmps: 232 }
];

export const STANDARD_PROTECTION_RATINGS = [
  5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 100, 125, 150, 200, 250, 300
];

const COPPER_RESISTIVITY = 0.0172; // Ohm * mm² / m

export function getWireMaxAmps(gaugeMm2: number): number {
  const exact = COPPER_WIRE_TABLE.find((w) => w.mm2 === gaugeMm2);
  if (exact) return exact.maxAmps;
  const closest = COPPER_WIRE_TABLE.reduce((prev, curr) =>
    Math.abs(curr.mm2 - gaugeMm2) < Math.abs(prev.mm2 - gaugeMm2) ? curr : prev
  );
  return closest.maxAmps;
}

export function suggestProtectionRating(currentAmps: number): number {
  if (currentAmps <= 0) return 5;
  const target = currentAmps * 1.25;
  for (const rating of STANDARD_PROTECTION_RATINGS) {
    if (rating >= target) return rating;
  }
  return STANDARD_PROTECTION_RATINGS[STANDARD_PROTECTION_RATINGS.length - 1];
}

export interface WireCalculationInput {
  currentAmps: number;
  voltage: number;
  lengthMeters: number;
  polarity: ElectricalPortPolarity;
  manualGaugeMm2?: number;
  isManualGauge?: boolean;
  connectedMaxAmps?: number;
  connectedFuseAmps?: number;
}

export interface WireCalculationResult {
  suggestedGaugeMm2: number;
  gaugeMm2: number;
  suggestedProtectionAmps: number;
  voltageDropVolts: number;
  voltageDropPercent: number;
  isOverloaded: boolean;
  overloadWarning?: string;
}

/**
 * Calcula a bitola ideal, queda de tensão (ida + volta) e alertas de sobrecarga.
 */
export function calculateWireSpecs(input: WireCalculationInput): WireCalculationResult {
  const amps = Math.max(0, input.currentAmps || 0);
  const voltage = Math.max(1, input.voltage || 12.8);
  const length = Math.max(0.1, input.lengthMeters || 1);

  // Sinal D+ não carrega potência relevante; sempre 1.0 mm² ou 1.5 mm²
  if (input.polarity === 'signal') {
    const gauge = input.isManualGauge && input.manualGaugeMm2 ? input.manualGaugeMm2 : 1.0;
    return {
      suggestedGaugeMm2: 1.0,
      gaugeMm2: gauge,
      suggestedProtectionAmps: 5,
      voltageDropVolts: 0,
      voltageDropPercent: 0,
      isOverloaded: false
    };
  }

  // Queda de tensão considerando circuito ida e volta (2 * L) para dimensionamento seguro
  const maxAllowedDropPct = voltage >= 100 ? 4.0 : 3.0;

  let suggestedGaugeMm2 = COPPER_WIRE_TABLE[0].mm2;
  for (const spec of COPPER_WIRE_TABLE) {
    if (amps <= 0.01) {
      suggestedGaugeMm2 = 2.5;
      break;
    }
    const dropVolts = (2 * COPPER_RESISTIVITY * length * amps) / spec.mm2;
    const dropPct = (dropVolts / voltage) * 100;
    if (spec.maxAmps >= amps && dropPct <= maxAllowedDropPct) {
      suggestedGaugeMm2 = spec.mm2;
      break;
    }
    suggestedGaugeMm2 = spec.mm2;
  }

  const gaugeMm2 =
    input.isManualGauge && input.manualGaugeMm2 && input.manualGaugeMm2 > 0
      ? input.manualGaugeMm2
      : suggestedGaugeMm2;

  const voltageDropVolts = +((2 * COPPER_RESISTIVITY * length * amps) / gaugeMm2).toFixed(2);
  const voltageDropPercent = +((voltageDropVolts / voltage) * 100).toFixed(2);
  const suggestedProtectionAmps = suggestProtectionRating(amps);

  const wireMaxAmps = getWireMaxAmps(gaugeMm2);
  const warnings: string[] = [];

  if (amps > wireMaxAmps) {
    warnings.push(`Corrente (${amps.toFixed(1)}A) excede limite do cabo ${gaugeMm2}mm² (${wireMaxAmps}A)`);
  }
  if (voltageDropPercent > 5.0 && amps > 0.5) {
    warnings.push(`Queda de tensão alta (${voltageDropPercent}% > 5%)`);
  }
  if (input.connectedFuseAmps !== undefined && amps > input.connectedFuseAmps) {
    warnings.push(`Carga (${amps.toFixed(1)}A) excede fusível de ${input.connectedFuseAmps}A`);
  }
  if (input.connectedMaxAmps !== undefined && amps > input.connectedMaxAmps) {
    warnings.push(`Corrente (${amps.toFixed(1)}A) excede capacidade da porta/disjuntor (${input.connectedMaxAmps}A)`);
  }

  return {
    suggestedGaugeMm2,
    gaugeMm2,
    suggestedProtectionAmps,
    voltageDropVolts,
    voltageDropPercent,
    isOverloaded: warnings.length > 0,
    overloadWarning: warnings.length > 0 ? warnings.join(' • ') : undefined
  };
}
