import React, { useState, useMemo } from 'react';
import { useSolar } from '../../context/SolarContext';
import { calculateWeightBalance, WeightCategory } from '../../utils/weightCalculator';
import { SearchIcon, ScaleIcon } from '../layout/IdeIcons';

export const WeightsView: React.FC = () => {
  const {
    structureMaterial,
    metalonThickness40,
    metalonThickness30,
    stackLevels,
    energyStats,
    activePanelPreset,
    cargoBox,
    activeCargoBoxPreset,
    waterTank,
    awning,
    internalGrid,
    internalBoxes,
    activeBatteryPreset,
    activeMpptPreset,
    activeB2bPreset,
    activeFridgePreset,
    activePortaPottiPreset,
    activeStovePreset,
  } = useSolar();

  const [isWaterFull, setIsWaterFull] = useState<boolean>(true);
  const [isPortaPottiFull, setIsPortaPottiFull] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<WeightCategory | 'all'>('all');
  const [search, setSearch] = useState<string>('');

  const summary = useMemo(() => {
    return calculateWeightBalance({
      structureMaterial,
      metalonThickness40,
      metalonThickness30,
      stackLevels,
      panelCount: energyStats.panelCount || 4,
      activePanelPreset,
      cargoBox,
      activeCargoBoxPreset,
      waterTank,
      awning,
      internalGrid,
      internalBoxes,
      activeBatteryPreset,
      activeMpptPreset,
      activeB2bPreset,
      activeFridgePreset,
      activePortaPottiPreset,
      activeStovePreset,
      isWaterFull,
      isPortaPottiFull,
    });
  }, [
    structureMaterial,
    metalonThickness40,
    metalonThickness30,
    stackLevels,
    energyStats.panelCount,
    activePanelPreset,
    cargoBox,
    activeCargoBoxPreset,
    waterTank,
    awning,
    internalGrid,
    internalBoxes,
    activeBatteryPreset,
    activeMpptPreset,
    activeB2bPreset,
    activeFridgePreset,
    activePortaPottiPreset,
    activeStovePreset,
    isWaterFull,
    isPortaPottiFull,
  ]);

  const filteredItems = useMemo(() => {
    return summary.items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.specification.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [summary.items, selectedCategory, search]);

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {
      all: summary.activeTotalKg,
      roof: summary.roofTotalKg,
      furniture: summary.furnitureTotalKg,
      electrical: summary.electricalTotalKg,
      appliances: summary.appliancesTotalKg,
      water: summary.waterTotalKg,
    };
    return map;
  }, [summary]);

  const getStatusColor = (pct: number) => {
    if (pct > 100) return '#ef4444';
    if (pct > 80) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="weights-view-container">
      {/* ── Toolbar Superior ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid #1f2937',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <ScaleIcon size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Balanço de Peso & Distribuição de Cargas
            </h1>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '2px 0 0' }}>
              Estimativa do peso de todos os elementos e sistemas instalados na Fiat Doblò.
            </p>
          </div>
        </div>

        {/* Toggles operacionais */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {waterTank.enabled && (
            <button
              type="button"
              className="welcome-btn welcome-btn-secondary"
              style={{
                height: '34px',
                padding: '0 12px',
                fontSize: '12.5px',
                background: isWaterFull ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                borderColor: isWaterFull ? '#38bdf8' : '#334155',
                color: isWaterFull ? '#38bdf8' : '#cbd5e1',
              }}
              onClick={() => setIsWaterFull(!isWaterFull)}
              title="Alternar entre peso seco e peso com tanque de água cheio"
            >
              <span>💧</span>
              <span>Água: {isWaterFull ? 'Tanque Cheio' : 'Tanque Vazio'}</span>
            </button>
          )}

          <button
            type="button"
            className="welcome-btn welcome-btn-secondary"
            style={{
              height: '34px',
              padding: '0 12px',
              fontSize: '12.5px',
              background: isPortaPottiFull ? 'rgba(245, 158, 11, 0.15)' : '#1e293b',
              borderColor: isPortaPottiFull ? '#f59e0b' : '#334155',
              color: isPortaPottiFull ? '#fbbf24' : '#cbd5e1',
            }}
            onClick={() => setIsPortaPottiFull(!isPortaPottiFull)}
            title="Alternar estado de carga do reservatório do sanitário"
          >
            <span>🚽</span>
            <span>Porta Potti: {isPortaPottiFull ? 'Cheio' : 'Vazio'}</span>
          </button>

          <button
            type="button"
            className="welcome-btn welcome-btn-primary"
            style={{ height: '34px', padding: '0 14px', fontSize: '12.5px', minWidth: 'auto' }}
            onClick={() => window.print()}
          >
            <span>📄</span>
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* ── Cards de Indicadores de Engenharia ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Capacidade da Fiat Doblò */}
        <div
          style={{
            background: '#111827',
            border: `1px solid ${summary.isVehicleOverloaded ? 'rgba(239, 68, 68, 0.5)' : '#1f2937'}`,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Carga Útil da Doblò
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: summary.isVehicleOverloaded ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: summary.isVehicleOverloaded ? '#f87171' : '#34d399',
                border: `1px solid ${summary.isVehicleOverloaded ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              }}
            >
              {summary.isVehicleOverloaded ? 'Sobrecarga' : 'Dentro do Limite'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>
              {summary.activeTotalKg} kg
            </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              / {summary.dobloPayloadLimitKg} kg máx útil
            </span>
          </div>

          {/* Barra de progresso */}
          <div style={{ width: '100%', height: '8px', background: '#1f2937', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, summary.payloadUsagePct)}%`,
                background: getStatusColor(summary.payloadUsagePct),
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8' }}>
            <span>{summary.payloadUsagePct}% utilizado</span>
            <span>Sobra: <strong style={{ color: summary.remainingPayloadKg > 0 ? '#38bdf8' : '#f87171' }}>{summary.remainingPayloadKg} kg</strong></span>
          </div>
        </div>

        {/* Card 2: Carga no Teto (Rack & Overland) */}
        <div
          style={{
            background: '#111827',
            border: `1px solid ${summary.isRoofOverloaded ? 'rgba(239, 68, 68, 0.5)' : '#1f2937'}`,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Carga no Teto da Van
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: summary.isRoofOverloaded ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                color: summary.isRoofOverloaded ? '#f87171' : '#38bdf8',
                border: `1px solid ${summary.isRoofOverloaded ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
              }}
            >
              {summary.isRoofOverloaded ? 'Acima de 100 kg' : 'Gabarito Ok'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: summary.isRoofOverloaded ? '#f87171' : '#f8fafc' }}>
              {summary.roofTotalKg} kg
            </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              (Limite Dinâmico: 100 kg)
            </span>
          </div>

          {/* Barra de progresso */}
          <div style={{ width: '100%', height: '8px', background: '#1f2937', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, summary.roofDynamicUsagePct)}%`,
                background: getStatusColor(summary.roofDynamicUsagePct),
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8' }}>
            <span>{summary.roofDynamicUsagePct}% do teto</span>
            <span>Estático no camping: <strong>{summary.roofStaticLimitKg} kg</strong></span>
          </div>
        </div>

        {/* Card 3: Distribuição de Massa (CG) */}
        <div
          style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Centro de Gravidade & Massa
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa' }}>
              Estabilidade
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>No Assoalho / Interior</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>
                {summary.floorSharePct}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>No Teto / Rack</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: summary.roofSharePct > 30 ? '#f59e0b' : '#34d399' }}>
                {summary.roofSharePct}%
              </div>
            </div>
          </div>

          {/* Barra bipartida */}
          <div style={{ width: '100%', height: '8px', display: 'flex', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${summary.floorSharePct}%`, background: '#38bdf8' }} title="Assoalho" />
            <div style={{ width: `${summary.roofSharePct}%`, background: '#f59e0b' }} title="Teto" />
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
            {summary.roofSharePct > 25
              ? '⚠️ Recomenda-se manter o peso do teto abaixo de 25% do total para maior estabilidade em ventos laterais.'
              : '✅ Excelente distribuição: a maior parte da massa está concentrada no piso do veículo.'}
          </div>
        </div>
      </div>

      {/* ── Filtros por Categoria & Busca ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Todos os Itens', count: summary.items.length },
            { id: 'roof', label: 'Teto & Estrutura', count: summary.items.filter((i) => i.category === 'roof').length },
            { id: 'furniture', label: 'Móveis & Módulos', count: summary.items.filter((i) => i.category === 'furniture').length },
            { id: 'electrical', label: 'Sistema Elétrico', count: summary.items.filter((i) => i.category === 'electrical').length },
            { id: 'appliances', label: 'Eletrodomésticos', count: summary.items.filter((i) => i.category === 'appliances').length },
            { id: 'water', label: 'Água & Hidráulica', count: summary.items.filter((i) => i.category === 'water').length },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`welcome-btn ${isActive ? 'welcome-btn-primary' : 'welcome-btn-secondary'}`}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  fontSize: '12px',
                  minWidth: 'auto',
                  borderRadius: '6px',
                }}
                onClick={() => setSelectedCategory(cat.id as any)}
              >
                <span>{cat.label}</span>
                <span
                  style={{
                    padding: '1px 5px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#334155',
                    fontSize: '10.5px',
                  }}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Busca */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <input
            type="text"
            className="welcome-search-input"
            style={{ width: '100%', paddingLeft: '28px', height: '32px' }}
            placeholder="Filtrar por nome ou local..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ position: 'absolute', left: '8px', top: '8px', color: '#64748b' }}>
            <SearchIcon size={14} />
          </div>
        </div>
      </div>

      {/* ── Tabela Detalhada de Elementos ── */}
      <div className="weights-table-card">
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid #1f2937',
                  color: '#94a3b8',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                }}
              >
                <th style={{ padding: '12px 16px' }}>Elemento / Equipamento</th>
                <th style={{ padding: '12px 16px' }}>Categoria</th>
                <th style={{ padding: '12px 16px' }}>Localização</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Qtd</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Peso Unit.</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Peso Total</th>
                <th style={{ padding: '12px 16px', width: '120px' }}>% Impacto</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Nenhum elemento encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const sharePct = summary.activeTotalKg > 0 ? (item.totalWeightKg / summary.activeTotalKg) * 100 : 0;
                  return (
                    <tr
                      key={item.id}
                      className="weights-table-row"
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{item.icon || '📦'}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{item.specification}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#1e293b',
                            color: '#94a3b8',
                            border: '1px solid #334155',
                          }}
                        >
                          {item.categoryLabel}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{item.location}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8' }}>
                        {item.unitWeightKg} kg
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                        {item.totalWeightKg} kg
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ flex: 1, height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, sharePct * 2)}%`,
                                background: sharePct > 15 ? '#f59e0b' : '#38bdf8',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '10.5px', color: '#64748b', width: '32px', textAlign: 'right' }}>
                            {sharePct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr
                style={{
                  borderTop: '2px solid #334155',
                  fontWeight: 700,
                }}
              >
                <td colSpan={5} style={{ padding: '14px 16px', textAlign: 'right', color: '#cbd5e1' }}>
                  Subtotal dos Itens Listados ({filteredItems.length} itens):
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '15px', color: '#38bdf8' }}>
                  {filteredItems.reduce((acc, curr) => acc + curr.totalWeightKg, 0).toFixed(1)} kg
                </td>
                <td style={{ padding: '14px 16px' }} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
