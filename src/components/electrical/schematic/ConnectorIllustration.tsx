import React from 'react';
import { CONNECTOR_META, ElectricalConnectorType } from '../../../types/electricalPlanar';
import { useElectricalIconScale } from '../planar/ElectricalIconScaleContext';

interface ConnectorIllustrationProps {
  type: ElectricalConnectorType;
  size?: number;
  title?: string;
}

export const ConnectorIllustration: React.FC<ConnectorIllustrationProps> = ({
  type,
  size = 36,
  title
}) => {
  const iconScale = useElectricalIconScale();
  const scaledSize = Math.round(size * iconScale);
  const label = title || CONNECTOR_META[type]?.label || type;

  const renderGraphic = () => {
    switch (type) {
      case 'ring_m8':
        return (
          <>
            {/* Olhal grande M8 (cobre estanhado + manga termorretrátil vermelha) */}
            <path
              d="M24 5 C15.2 5 10 11 10 18 C10 23 13 26.5 17 28.2 L17 34 L31 34 L31 28.2 C35 26.5 38 23 38 18 C38 11 32.8 5 24 5 Z"
              fill="#cbd5e1"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            <circle cx="24" cy="17.5" r="7.2" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            <rect x="16" y="31" width="16" height="12" rx="2.5" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.2" />
            <line x1="16" y1="35.5" x2="32" y2="35.5" stroke="#991b1b" strokeWidth="1.5" />
            <text x="24" y="41.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#ffffff" fontFamily="monospace">
              M8
            </text>
          </>
        );

      case 'ring_m6':
        return (
          <>
            {/* Olhal médio M6 (cobre estanhado + manga azul) */}
            <path
              d="M24 7 C16.5 7 12 12 12 18.2 C12 22.8 14.8 26 18.2 27.6 L18.2 33 L29.8 33 L29.8 27.6 C33.2 26 36 22.8 36 18.2 C36 12 31.5 7 24 7 Z"
              fill="#cbd5e1"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            <circle cx="24" cy="18" r="5.5" fill="#0f172a" stroke="#475569" strokeWidth="1.4" />
            <rect x="17" y="31" width="14" height="12" rx="2.5" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.2" />
            <text x="24" y="39.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#ffffff" fontFamily="monospace">
              M6
            </text>
          </>
        );

      case 'ring_m5':
        return (
          <>
            {/* Olhal pequeno M4/M5 (isolação amarela) */}
            <path
              d="M24 9 C18 9 14 13 14 18.5 C14 22.5 16.5 25.5 19.2 27 L19.2 32 L28.8 32 L28.8 27 C31.5 25.5 34 22.5 34 18.5 C34 13 30 9 24 9 Z"
              fill="#e2e8f0"
              stroke="#64748b"
              strokeWidth="1.4"
            />
            <circle cx="24" cy="18.5" r="4.2" fill="#0f172a" stroke="#475569" strokeWidth="1.3" />
            <rect x="18" y="30" width="12" height="13" rx="2.5" fill="#eab308" stroke="#fef08a" strokeWidth="1.2" />
            <text x="24" y="39" textAnchor="middle" fontSize="6" fontWeight="800" fill="#0f172a" fontFamily="monospace">
              M5
            </text>
          </>
        );

      case 'spade':
        return (
          <>
            {/* Terminal Forquilha / Garfo (U aberto + colar azul) */}
            <path
              d="M15 7 L20 7 L20 19 C20 21.5 21.8 23 24 23 C26.2 23 28 21.5 28 19 L28 7 L33 7 L33 21 C33 25.5 30 28 28.5 29 L28.5 32 L19.5 32 L19.5 29 C18 28 15 25.5 15 21 Z"
              fill="#cbd5e1"
              stroke="#64748b"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <rect x="17.5" y="30" width="13" height="13" rx="2.5" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1.2" />
            <line x1="17.5" y1="35" x2="30.5" y2="35" stroke="#0369a1" strokeWidth="1.4" />
          </>
        );

      case 'faston':
        return (
          <>
            {/* Terminal Faston 6.3mm (latão dourado com abas laterais + capa vermelha) */}
            <rect x="14" y="7" width="20" height="21" rx="2" fill="#f59e0b" stroke="#b45309" strokeWidth="1.4" />
            <path d="M14 10 C17 10 18.5 12 18.5 15 L18.5 25" fill="none" stroke="#fef3c7" strokeWidth="1.6" />
            <path d="M34 10 C31 10 29.5 12 29.5 15 L29.5 25" fill="none" stroke="#fef3c7" strokeWidth="1.6" />
            <line x1="24" y1="9" x2="24" y2="26" stroke="#92400e" strokeWidth="1.5" />
            <rect x="16.5" y="27" width="15" height="16" rx="3" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.2" />
            <line x1="16.5" y1="33" x2="31.5" y2="33" stroke="#991b1b" strokeWidth="1.5" />
          </>
        );

      case 'ferrule':
        return (
          <>
            {/* Terminal Tubular / Ilhós (pino metálico longo + colar cônico azul) */}
            <rect x="20.5" y="6" width="7" height="22" rx="1.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.4" />
            <line x1="22.8" y1="8" x2="22.8" y2="26" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />
            <path
              d="M17.5 27 L30.5 27 L33.5 42 L14.5 42 Z"
              fill="#2563eb"
              stroke="#93c5fd"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <line x1="16.5" y1="36" x2="31.5" y2="36" stroke="#1d4ed8" strokeWidth="1.5" />
          </>
        );

      case 'mc4':
        return (
          <>
            {/* Conector Solar MC4 (corpo preto com travas laterais e prensa-cabo) */}
            <rect x="18" y="5" width="12" height="11" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1.3" />
            {/* Travas laterais MC4 */}
            <path d="M18 11 L13.5 13.5 L15 19 L18 17.5" fill="#475569" stroke="#94a3b8" strokeWidth="1.1" />
            <path d="M30 11 L34.5 13.5 L33 19 L30 17.5" fill="#475569" stroke="#94a3b8" strokeWidth="1.1" />
            {/* Corpo central */}
            <rect x="16" y="16" width="16" height="14" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1.3" />
            <line x1="16" y1="21" x2="32" y2="21" stroke="#475569" strokeWidth="1.2" />
            <line x1="16" y1="25" x2="32" y2="25" stroke="#475569" strokeWidth="1.2" />
            {/* Prensa-cabo */}
            <path d="M18.5 30 L29.5 30 L27.5 42 L20.5 42 Z" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
            <text x="24" y="25" textAnchor="middle" fontSize="5.5" fontWeight="800" fill="#e2e8f0" fontFamily="monospace">
              MC4
            </text>
          </>
        );

      case 'wago':
        return (
          <>
            {/* Conector Wago 221 (corpo translúcido + alavancas laranja) */}
            <rect
              x="7"
              y="17"
              width="34"
              height="24"
              rx="3"
              fill="rgba(148, 163, 184, 0.28)"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            {/* Barra interna de cobre */}
            <rect x="11" y="29" width="26" height="4.5" rx="1" fill="#d97706" />
            {/* Alavancas laranja */}
            <rect x="11" y="8" width="10" height="16" rx="2" fill="#f97316" stroke="#fed7aa" strokeWidth="1.2" />
            <rect x="27" y="8" width="10" height="16" rx="2" fill="#f97316" stroke="#fed7aa" strokeWidth="1.2" />
            {/* Entradas inferiores dos fios */}
            <rect x="13.5" y="36" width="5" height="5" rx="1" fill="#0f172a" />
            <rect x="29.5" y="36" width="5" height="5" rx="1" fill="#0f172a" />
          </>
        );

      case 'anderson':
        return (
          <>
            {/* Conector Anderson SB50/120 (bloco vermelho/cinza polarizado + 2 cabos) */}
            <path
              d="M10 10 L38 10 L38 33 L10 33 Z"
              fill="#dc2626"
              stroke="#fca5a5"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Slots frontais de contato */}
            <rect x="14" y="13.5" width="7.5" height="9" rx="1.2" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
            <rect x="26.5" y="13.5" width="7.5" height="9" rx="1.2" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
            {/* Contatos prateados internos */}
            <rect x="15.5" y="15.5" width="4.5" height="5" rx="0.6" fill="#e2e8f0" />
            <rect x="28" y="15.5" width="4.5" height="5" rx="0.6" fill="#e2e8f0" />
            {/* Cabos saindo */}
            <rect x="14.5" y="33" width="6" height="9" rx="1.5" fill="#ef4444" stroke="#fca5a5" strokeWidth="1" />
            <rect x="27.5" y="33" width="6" height="9" rx="1.5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
          </>
        );

      case 'xt60':
        return (
          <>
            {/* Conector XT60 (corpo amarelo chanfrado + pinos de latão) */}
            <path
              d="M12 10 L33 10 L38 15 L38 33 L10 33 L10 12 Z"
              fill="#eab308"
              stroke="#fef08a"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="18" cy="21" r="4.2" fill="#0f172a" stroke="#a16207" strokeWidth="1.2" />
            <circle cx="18" cy="21" r="2.2" fill="#f59e0b" />
            <circle cx="30" cy="21" r="4.2" fill="#0f172a" stroke="#a16207" strokeWidth="1.2" />
            <circle cx="30" cy="21" r="2.2" fill="#f59e0b" />
            <text x="24" y="31" textAnchor="middle" fontSize="6" fontWeight="900" fill="#0f172a" fontFamily="monospace">
              XT60
            </text>
            <rect x="15" y="33" width="5.5" height="9" rx="1.5" fill="#ef4444" />
            <rect x="27.5" y="33" width="5.5" height="9" rx="1.5" fill="#334155" />
          </>
        );

      case 'bare':
        return (
          <>
            {/* Fio Estanhado / Cobre Nu */}
            <path d="M24 25 L16 9" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M24 25 L20.5 7" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M24 25 L24 6.5" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M24 25 L27.5 7" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M24 25 L32 9" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
            <rect x="18" y="24" width="12" height="19" rx="2.5" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.3" />
          </>
        );

      case 'none':
      default:
        return (
          <>
            <circle
              cx="24"
              cy="24"
              r="14"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <line x1="14" y1="34" x2="34" y2="14" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <svg
      width={scaledSize}
      height={scaledSize}
      viewBox="0 0 48 48"
      role="img"
      aria-label={label}
      style={{
        display: 'block',
        flexShrink: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        borderRadius: '6px',
        border: '1px solid rgba(148, 163, 184, 0.22)',
        padding: '2px'
      }}
    >
      <title>{label}</title>
      {renderGraphic()}
    </svg>
  );
};
