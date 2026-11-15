import {
  ElectricalPort,
  ElectricalPortPolarity,
  POLARITY_META
} from './coreTypes';

export function buildFuseBoxPorts(
  wayCount: number,
  existingPorts?: ElectricalPort[]
): ElectricalPort[] {
  const ports: ElectricalPort[] = [
    {
      id: 'in_pos',
      label: '+ Geral',
      polarity: 'pos',
      side: 'left',
      direction: 'in',
      maxAmps: 100
    },
    {
      id: 'in_neg',
      label: '- Barra Neg',
      polarity: 'neg',
      side: 'left',
      direction: 'in',
      maxAmps: 100
    }
  ];

  for (let i = 1; i <= wayCount; i++) {
    const existingOut = existingPorts?.find((p) => p.id === `fuse_${i}`);
    if (existingOut?.isManualFuse && existingOut.fuseAmps) {
      const fuseAmps = existingOut.fuseAmps;
      ports.push({
        id: `fuse_${i}`,
        label: `F${i} (${fuseAmps}A)`,
        polarity: 'pos',
        side: 'right',
        direction: 'out',
        fuseAmps,
        isManualFuse: true,
        maxAmps: fuseAmps,
        wayIndex: i
      });
    } else {
      ports.push({
        id: `fuse_${i}`,
        label: `F${i}`,
        polarity: 'pos',
        side: 'right',
        direction: 'out',
        fuseAmps: undefined,
        isManualFuse: false,
        maxAmps: 40,
        wayIndex: i
      });
    }
  }

  for (let i = 1; i <= wayCount; i++) {
    ports.push({
      id: `neg_${i}`,
      label: `- N${i}`,
      polarity: 'neg',
      side: 'bottom',
      direction: 'out',
      maxAmps: 40,
      wayIndex: i
    });
  }

  return ports;
}

export function buildBusbarPorts(
  polarity: ElectricalPortPolarity,
  termCount: number
): ElectricalPort[] {
  const symbol = POLARITY_META[polarity].shortLabel;
  const ports: ElectricalPort[] = [];

  for (let i = 1; i <= termCount; i++) {
    ports.push({
      id: `term_${i}`,
      label: `${symbol} T${i}`,
      polarity,
      side: 'left',
      direction: 'bidirectional',
      wayIndex: i
    });
  }
  return ports;
}

export function buildBreakerPorts(
  breakerAmps: number,
  poles: 1 | 2,
  isAC: boolean
): ElectricalPort[] {
  if (isAC) {
    if (poles === 2) {
      return [
        { id: 'in_1', label: 'Entrada F1', polarity: 'ac_phase', side: 'left', direction: 'in', maxAmps: breakerAmps },
        { id: 'in_2', label: 'Entrada N/F2', polarity: 'ac_neutral', side: 'left', direction: 'in', maxAmps: breakerAmps },
        { id: 'out_1', label: 'Saída F1', polarity: 'ac_phase', side: 'right', direction: 'out', maxAmps: breakerAmps },
        { id: 'out_2', label: 'Saída N/F2', polarity: 'ac_neutral', side: 'right', direction: 'out', maxAmps: breakerAmps }
      ];
    }
    return [
      { id: 'in_1', label: 'Entrada F', polarity: 'ac_phase', side: 'left', direction: 'in', maxAmps: breakerAmps },
      { id: 'out_1', label: 'Saída F', polarity: 'ac_phase', side: 'right', direction: 'out', maxAmps: breakerAmps }
    ];
  }

  if (poles === 2) {
    return [
      { id: 'in_pos', label: '+ IN', polarity: 'pos', side: 'left', direction: 'in', maxAmps: breakerAmps },
      { id: 'in_neg', label: '- IN', polarity: 'neg', side: 'left', direction: 'in', maxAmps: breakerAmps },
      { id: 'out_pos', label: '+ OUT', polarity: 'pos', side: 'right', direction: 'out', maxAmps: breakerAmps },
      { id: 'out_neg', label: '- OUT', polarity: 'neg', side: 'right', direction: 'out', maxAmps: breakerAmps }
    ];
  }
  return [
    { id: 'in_pos', label: '+ IN', polarity: 'pos', side: 'left', direction: 'in', maxAmps: breakerAmps },
    { id: 'out_pos', label: '+ OUT', polarity: 'pos', side: 'right', direction: 'out', maxAmps: breakerAmps }
  ];
}
