import React from 'react';
import { SheetStandard, MaterialGroup } from './types';
import { API_URL } from '../../sync/config';

interface CuttingToolbarProps {
  sheetStandard: SheetStandard;
  onSheetStandardChange: (std: SheetStandard) => void;
  customSheetW: number;
  customSheetH: number;
  onReoptimize: () => void;
  onPrintPlan?: () => void;
  materialGroups: MaterialGroup[];
  activeGroupKey: string;
  onSelectGroupKey: (key: string) => void;
}

export const CuttingToolbar: React.FC<CuttingToolbarProps> = ({
  sheetStandard,
  onSheetStandardChange,
  customSheetW,
  customSheetH,
  onReoptimize,
  onPrintPlan,
  materialGroups,
  activeGroupKey,
  onSelectGroupKey
}) => {
  return (
    <>
      {/* Barra de Título & Tipo de Chapa */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>⚡</span>
            <span>PLANO DE CORTE CNC</span>
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(245, 158, 11, 0.18)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24'
            }}
          >
            Corte Cloud Nesting
          </span>
        </div>

        {/* Seletor de Chapa e Botão Otimizar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>Chapa:</span>
          <select
            value={sheetStandard}
            onChange={(e) => onSheetStandardChange(e.target.value as SheetStandard)}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '10.5px',
              fontWeight: 700
            }}
          >
            <option value="plywood_2440">Compensado 2440 × 1220 mm</option>
            <option value="mdf_2750">MDF 2750 × 1830 mm</option>
            <option value="foam_1900">Bloco Espuma 1900 × 1400 mm (D33)</option>
            <option value="foam_2000">Bloco Espuma 2000 × 1400 mm (D33 Grande)</option>
            <option value="custom">Personalizado ({customSheetW}×{customSheetH})</option>
          </select>

          <button
            onClick={onReoptimize}
            className="btn-compact primary"
            title="Recalcular plano de corte automático ótimo"
            style={{
              padding: '4px 9px',
              fontSize: '10.5px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: '1px solid #10b981',
              color: '#ffffff',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>⚡ Otimizar</span>
          </button>

          {onPrintPlan && (
            <button
              onClick={onPrintPlan}
              className="btn-compact"
              title="Visualizar e Imprimir Chapas em PDF no Navegador"
              style={{
                padding: '4px 9px',
                fontSize: '10.5px',
                fontWeight: 800,
                background: 'rgba(2, 132, 199, 0.25)',
                border: '1px solid #0284c7',
                color: '#38bdf8',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>🖨️ Imprimir</span>
            </button>
          )}

          <a
            href={`${API_URL}/cutting/pdf`}
            download="plano_de_corte_doblo_solar.pdf"
            className="btn-compact"
            title="Baixar PDF Técnico Completo (14 Páginas: Marcenaria, Espuma D33, Perfis do Rack, PVC e Toldo)"
            style={{
              padding: '4px 9px',
              fontSize: '10.5px',
              fontWeight: 800,
              background: 'rgba(245, 158, 11, 0.25)',
              border: '1px solid #f59e0b',
              color: '#fbbf24',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>📄 PDF Completo</span>
          </a>
        </div>
      </div>

      {/* Abas / Grupos de Materiais de Madeira — Empilhados um abaixo do outro */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginBottom: '10px'
        }}
      >
        {materialGroups.map((g) => {
          const isSelected = g.key === activeGroupKey;
          const isFoam = Boolean(g.isUpholstery || g.woodMaterial.includes('Espuma'));
          const activeBg = isFoam
            ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.35), rgba(14, 165, 233, 0.2))'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))';
          const activeBorder = isFoam ? '#38bdf8' : '#f59e0b';
          const activeText = isFoam ? '#7dd3fc' : '#fef08a';

          return (
            <button
              key={g.key}
              onClick={() => onSelectGroupKey(g.key)}
              type="button"
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '6px',
                border: isSelected ? `1px solid ${activeBorder}` : '1px solid rgba(148, 163, 184, 0.25)',
                background: isSelected ? activeBg : 'rgba(15, 23, 42, 0.65)',
                color: isSelected ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px' }}>{isFoam ? '🛏️' : '🪵'}</span>
                <span style={{ color: isSelected ? activeText : '#f8fafc', fontWeight: 700 }}>
                  {g.woodMaterial}
                </span>
                <span
                  style={{
                    background: isSelected
                      ? isFoam ? '#0284c7' : '#f59e0b'
                      : 'rgba(148, 163, 184, 0.2)',
                    color: isSelected ? '#ffffff' : '#cbd5e1',
                    borderRadius: '4px',
                    padding: '1px 6px',
                    fontSize: '10px',
                    fontWeight: 800
                  }}
                >
                  {g.thicknessMm}mm
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: isSelected ? '#fbbf24' : '#94a3b8'
                  }}
                >
                  {g.totalPieces} {g.totalPieces === 1 ? 'peça' : 'peças'}
                </span>
                {isSelected && (
                  <span
                    style={{
                      fontSize: '9.5px',
                      color: '#f59e0b',
                      fontWeight: 800,
                      background: 'rgba(245, 158, 11, 0.2)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    ✓ Ativo
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};
