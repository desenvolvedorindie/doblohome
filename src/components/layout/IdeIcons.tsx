import React from 'react';

interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const base = (size = 16, strokeWidth = 2) => ({
  xmlns: 'http://www.w3.org/2000/svg',
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const PanelLeftIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 2.2 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

export const PanelRightIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 2.2 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M15 3v18" />
  </svg>
);

export const Maximize2Icon: React.FC<IconProps> = ({ size = 14, strokeWidth = 2.2 }) => (
  <svg {...base(size, strokeWidth)}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" x2="14" y1="3" y2="10" />
    <line x1="3" x2="10" y1="21" y2="14" />
  </svg>
);

export const Minimize2Icon: React.FC<IconProps> = ({ size = 14, strokeWidth = 2.2 }) => (
  <svg {...base(size, strokeWidth)}>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" x2="21" y1="10" y2="3" />
    <line x1="3" x2="10" y1="21" y2="14" />
  </svg>
);

export const ChevronsLeftIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 2.2 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="m11 17-5-5 5-5" />
    <path d="m18 17-5-5 5-5" />
  </svg>
);

export const ChevronsRightIcon: React.FC<IconProps> = ({ size = 14, strokeWidth = 2.2 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="m6 17 5-5-5-5" />
    <path d="m13 17 5-5-5-5" />
  </svg>
);

export const GridBoxesIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

export const Box3DIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

export const CeilingLightIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export const SlidersIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <line x1="4" x2="4" y1="21" y2="14" />
    <line x1="4" x2="4" y1="10" y2="3" />
    <line x1="12" x2="12" y1="21" y2="12" />
    <line x1="12" x2="12" y1="8" y2="3" />
    <line x1="20" x2="20" y1="21" y2="16" />
    <line x1="20" x2="20" y1="12" y2="3" />
    <line x1="2" x2="6" y1="14" y2="14" />
    <line x1="10" x2="14" y1="8" y2="8" />
    <line x1="18" x2="22" y1="16" y2="16" />
  </svg>
);

export const SunIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

export const StructureFrameIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M4 20h16" />
    <path d="M6 20V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14" />
    <path d="M6 12h12" />
    <path d="M12 4v16" />
  </svg>
);

export const LuggageIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect width="18" height="14" x="3" y="7" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 13h18" />
  </svg>
);

export const ZapIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </svg>
);

export const DropletIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  </svg>
);

export const ScissorsIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="6" cy="6" r="3" />
    <path d="M8.12 8.12 12 12" />
    <path d="M20 4 8.12 15.88" />
    <circle cx="6" cy="18" r="3" />
    <path d="M14.8 14.8 20 20" />
  </svg>
);

export const LayersIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
    <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
  </svg>
);

export const BedIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M2 4v16" />
    <path d="M2 8h18a2 2 0 0 1 2 2v10" />
    <path d="M2 17h20" />
    <path d="M6 8v9" />
  </svg>
);

export const ScaleIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
);

export const CameraIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export const BatteryIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect width="16" height="10" x="2" y="7" rx="2" ry="2" />
    <line x1="22" x2="22" y1="11" y2="13" />
    <line x1="6" x2="6" y1="10" y2="14" />
    <line x1="10" x2="10" y1="10" y2="14" />
  </svg>
);

export const ShoppingCartIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

export const CompassIcon: React.FC<IconProps> = ({ size = 19, strokeWidth = 1.9 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);
