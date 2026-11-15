import React from 'react';
import { HydraulicEdgeStyle } from '../../../types/hydraulicPlanar';
import { calculateHydraulicBom } from '../../../utils/hydraulicCalculations';

type HydraulicBomResult = ReturnType<typeof calculateHydraulicBom>;

interface HydraulicCanvasToolbarProps {
  nodeCount: number;
  edgeCount: number;
  bomSummary: HydraulicBomResult;
  edgeStyle: HydraulicEdgeStyle;
  confirmClear: boolean;
  onEdgeStyleChange: (style: HydraulicEdgeStyle) => void;
  onFitView: () => void;
  onClearCanvas: () => void;
}

export const HydraulicCanvasToolbar: React.FC<HydraulicCanvasToolbarProps> = ({
  nodeCount,
  edgeCount,
  bomSummary,
  edgeStyle,
  confirmClear,
  onEdgeStyleChange,
  onFitView,
  onClearCanvas
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        pointerEvents: 'none'
      }}
    >
      <div
        className="glass-panel"
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 12px',
          borderRadius: '10px',
          fontSize: '11px',
          background: 'rgba(15, 23, 42, 0.88)'
        }}
      >
        <span style={{ fontWeight: 800, color: '#38bdf8' }}>💧 Esquemático Hidráulico</span>
        <span style={{ color: '#94a3b8' }}>
          {nodeCount} nós · {edgeCount} linhas · <strong style={{ color: '#f1f5f9' }}>{bomSummary.totalPipeMeters}m</strong>
        </span>
        {bomSummary.overloadedPipesCount > 0 && (
          <span
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              padding: '2px 7px',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '10px'
            }}
          >
            ⚠️ {bomSummary.overloadedPipesCount} alerta(s)
          </span>
        )}
      </div>

      <div
        className="glass-panel"
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 8px',
          borderRadius: '10px',
          background: 'rgba(15, 23, 42, 0.88)'
        }}
      >
        <button
          type="button"
          className={`btn-compact ${edgeStyle === 'smoothstep' ? 'active primary' : ''}`}
          onClick={() => onEdgeStyleChange('smoothstep')}
          style={{ fontSize: '10px', padding: '4px 8px' }}
          title="Linhas ortogonais com cantos suaves"
        >
          ↱ Ortogonal
        </button>
        <button
          type="button"
          className={`btn-compact ${edgeStyle === 'default' ? 'active primary' : ''}`}
          onClick={() => onEdgeStyleChange('default')}
          style={{ fontSize: '10px', padding: '4px 8px' }}
          title="Linhas curvas suaves"
        >
          〰️ Curva
        </button>
        <button
          type="button"
          className={`btn-compact ${edgeStyle === 'straight' ? 'active primary' : ''}`}
          onClick={() => onEdgeStyleChange('straight')}
          style={{ fontSize: '10px', padding: '4px 8px' }}
          title="Linhas retas diretas"
        >
          ╲ Reta
        </button>

        <div style={{ width: '1px', height: '16px', background: 'rgba(148, 163, 184, 0.25)', margin: '0 2px' }} />

        <button
          type="button"
          className="btn-compact"
          onClick={onFitView}
          style={{ fontSize: '10px', padding: '4px 8px' }}
          title="Enquadrar todos os componentes na tela"
        >
          ⌖ Enquadrar
        </button>
        <button
          type="button"
          className="btn-compact"
          onClick={onClearCanvas}
          style={{
            fontSize: '10px',
            padding: '4px 8px',
            color: confirmClear ? '#ffffff' : '#fca5a5',
            background: confirmClear ? '#dc2626' : undefined,
            borderColor: confirmClear ? '#ef4444' : 'rgba(239, 68, 68, 0.35)'
          }}
          title="Limpar todo o diagrama hidráulico"
        >
          {confirmClear ? '⚠️ Confirmar Limpar?' : '🧹 Limpar'}
        </button>
      </div>
    </div>
  );
};

export const HydraulicEmptyCanvasOverlay: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 15,
        pointerEvents: 'none',
        textAlign: 'center',
        maxWidth: '420px',
        padding: '20px',
        borderRadius: '14px',
        background: 'rgba(15, 23, 42, 0.72)',
        border: '1px dashed rgba(56, 189, 248, 0.35)'
      }}
    >
      <div style={{ fontSize: '30px', marginBottom: '8px' }}>💧</div>
      <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '6px' }}>
        Planejamento Hidráulico Planar (2D)
      </div>
      <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.55 }}>
        Arraste os reservatórios, bomba Seaflo, conexões T, válvulas de retenção, misturadora, trocador de calor, pia e ducha para montar o circuito de água fria, água quente e água cinza.
      </div>
    </div>
  );
};
