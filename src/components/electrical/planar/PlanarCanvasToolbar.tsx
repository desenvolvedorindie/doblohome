import React from 'react';
import type { Node } from '@xyflow/react';
import {
  ElectricalEdgeStyle,
  ElectricalNodeData
} from '../../../types/electricalPlanar';
import { ElectricalBomSummary } from '../../../utils/electricalCalculations';

interface PlanarCanvasToolbarProps {
  nodesCount: number;
  edgesCount: number;
  bomSummary: ElectricalBomSummary;
  edgeStyle: ElectricalEdgeStyle;
  iconScale: number;
  confirmClear: boolean;
  onEdgeStyleChange: (style: ElectricalEdgeStyle) => void;
  onIconScaleChange: (scale: number) => void;
  onFitView: () => void;
  onClearCanvas: () => void;
}

export const PlanarCanvasToolbar: React.FC<PlanarCanvasToolbarProps> = ({
  nodesCount,
  edgesCount,
  bomSummary,
  edgeStyle,
  iconScale,
  confirmClear,
  onEdgeStyleChange,
  onIconScaleChange,
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
        <span style={{ fontWeight: 800, color: '#38bdf8' }}>⚡ Esquemático Planar</span>
        <span style={{ color: '#94a3b8' }}>
          {nodesCount} nós · {edgesCount} cabos ·{' '}
          <strong style={{ color: '#f1f5f9' }}>{bomSummary.totalCableMeters}m</strong>
        </span>
        {bomSummary.overloadedEdgesCount > 0 && (
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
            ⚠️ {bomSummary.overloadedEdgesCount} alerta(s)
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

        <div
          style={{
            width: '1px',
            height: '16px',
            background: 'rgba(148, 163, 184, 0.25)',
            margin: '0 2px'
          }}
        />

        <label
          title="Ajustar tamanho dos ícones e ilustrações de conectores (clique na porcentagem para resetar)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '10px',
            color: '#cbd5e1',
            padding: '0 4px',
            userSelect: 'none'
          }}
        >
          <span>🔎 Ícones</span>
          <input
            type="range"
            min="0.8"
            max="2.5"
            step="0.1"
            value={iconScale}
            onChange={(e) => onIconScaleChange(parseFloat(e.target.value) || 1)}
            style={{
              width: '72px',
              accentColor: '#38bdf8',
              cursor: 'pointer'
            }}
          />
          <button
            type="button"
            onClick={() => onIconScaleChange(1)}
            title="Clique para voltar ao tamanho padrão (100%)"
            style={{
              background: 'rgba(56, 189, 248, 0.14)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              borderRadius: '4px',
              padding: '1px 4px',
              fontSize: '9.5px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              minWidth: '38px',
              cursor: 'pointer'
            }}
          >
            {Math.round(iconScale * 100)}%
          </button>
        </label>

        <div
          style={{
            width: '1px',
            height: '16px',
            background: 'rgba(148, 163, 184, 0.25)',
            margin: '0 2px'
          }}
        />

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
          title="Limpar todo o diagrama elétrico"
        >
          {confirmClear ? '⚠️ Confirmar Limpar?' : '🧹 Limpar'}
        </button>
      </div>
    </div>
  );
};

export const PlanarEmptyStateOverlay: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 15,
      pointerEvents: 'none',
      textAlign: 'center',
      maxWidth: '400px',
      padding: '20px',
      borderRadius: '14px',
      background: 'rgba(15, 23, 42, 0.72)',
      border: '1px dashed rgba(56, 189, 248, 0.35)'
    }}
  >
    <div style={{ fontSize: '30px', marginBottom: '8px' }}>⚡</div>
    <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '6px' }}>
      Planejamento Elétrico Planar (2D)
    </div>
    <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.55 }}>
      Arraste componentes da paleta à esquerda (Bateria, Caixa de Disjuntor, Caixa de Fusíveis, Barramentos, DC-DC, Usina e suas cargas do Consumo) e conecte os pinos para dimensionar cabos e proteções automaticamente.
    </div>
  </div>
);

export function getPlanarMiniMapNodeColor(node: Node): string {
  const cat = (node.data as ElectricalNodeData)?.category;
  if (cat === 'system_fixed') return '#38bdf8';
  if (cat === 'consumption_load') return '#f59e0b';
  if (cat === 'distribution_protection') return '#10b981';
  return '#c084fc';
}
