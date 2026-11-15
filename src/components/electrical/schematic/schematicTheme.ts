import React from 'react';
import {
  ElectricalNodeData,
  ElectricalPort,
  POLARITY_META
} from '../../../types/electricalPlanar';

export interface SchematicCategoryTheme {
  border: string;
  headerBg: string;
  accent: string;
  badgeBg: string;
}

export const CATEGORY_THEME: Record<
  ElectricalNodeData['category'],
  SchematicCategoryTheme
> = {
  system_fixed: {
    border: 'rgba(56, 189, 248, 0.55)',
    headerBg: 'rgba(14, 165, 233, 0.18)',
    accent: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.16)'
  },
  consumption_load: {
    border: 'rgba(245, 158, 11, 0.55)',
    headerBg: 'rgba(245, 158, 11, 0.18)',
    accent: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.16)'
  },
  distribution_protection: {
    border: 'rgba(16, 185, 129, 0.55)',
    headerBg: 'rgba(16, 185, 129, 0.16)',
    accent: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.16)'
  },
  custom: {
    border: 'rgba(192, 132, 252, 0.55)',
    headerBg: 'rgba(168, 85, 247, 0.18)',
    accent: '#c084fc',
    badgeBg: 'rgba(192, 132, 252, 0.16)'
  }
};

export function renderPortDotStyle(port: ElectricalPort): React.CSSProperties {
  const meta = POLARITY_META[port.polarity] || POLARITY_META.pos;
  return {
    width: 11,
    height: 11,
    background: meta.color,
    border: `2px solid ${meta.handleBorder}`,
    borderRadius: '50%',
    boxShadow: '0 0 0 2px rgba(15, 23, 42, 0.9)'
  };
}

export function getSchematicComputedAmps(data: ElectricalNodeData): number {
  if (data.amps > 0) return data.amps;
  if (data.watts > 0 && data.voltage > 0) {
    return +(data.watts / data.voltage).toFixed(1);
  }
  return 0;
}

export function getSchematicNodeMinWidth(
  data: ElectricalNodeData,
  topPortsCount: number,
  bottomPortsCount: number
): number {
  if (data.kind === 'fuse_box') return 260;
  if (data.kind === 'busbar') return 220;
  return Math.max(185, topPortsCount * 64, bottomPortsCount * 42);
}
