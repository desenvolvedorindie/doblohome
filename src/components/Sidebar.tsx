import React, { useState } from 'react';
import { useSolar } from '../context/SolarContext';
import { SlideDirection, PanelOrientation, METALON_COLOR_PRESETS, getMetalonGauge } from '../types';
import { InternalBoxesPlanner } from './InternalBoxesPlanner';
import { CuttingPlanSidePanel } from './cutting/CuttingPlanSidePanel';

export const Sidebar: React.FC = () => {
  const {
    stackLevels,
    setStackLevels,
    level1,
    setLevel1Panels,
    setLevel1Direction,
    setLevel1Orientation,
    level2,
    setLevel2Panels,
    setLevel2Direction,
    setLevel2Orientation,
    structureMaterial,
    setStructureMaterial,
    steelProfileUnit,
    setSteelProfileUnit,
    aluminumColor,
    setAluminumColor,
    metalonColor,
    setMetalonColor,
    metalonWallThickness,
    metalonThickness40,
    metalonThickness30,
    setMetalonWallThickness,
    setMetalonThickness40,
    setMetalonThickness30,
    offsetZ,
    setOffsetZ,
    offsetY,
    setOffsetY,
    cargoBox,
    setCargoBoxEnabled,
    setCargoBoxDimensions,
    setCargoBoxVerticalLift,
    setCargoBoxTelescopic,
    setCargoBoxHingeSide,
    openModal,
    panelPresets,
    activePanelPreset,
    selectPanelPreset,
    cargoBoxPresets,
    activeCargoBoxPreset,
    selectCargoBoxPreset,
    b2bCharger,
    setB2BEngineHours,
    usinaCharger,
    toggleUsinaAC,
    setUsinaModel,
    waterTank,
    setWaterTankEnabled,
    setWaterTankLength,
    setWaterTankRadius,
    awning,
    setAwning,
    toggleAwningOpen,
    viewMode,
    setViewMode,
    internalGrid,
    setInternalGrid,
    isOpenPreview,
    setIsOpenPreview,
    isVehicleVisible,
    toggleVehicle,
    vehicleOpacity,
    setVehicleOpacity
  } = useSolar();

  const [showCustomThicknessSizes, setShowCustomThicknessSizes] = useState<boolean>(false);

  const panelW = activePanelPreset.powerWatts;
  const panelCmW = Math.round(activePanelPreset.width * 100);
  const panelCmL = Math.round(activePanelPreset.length * 100);
  const totalPanelsCount = level1.panels + (stackLevels === 2 ? level2.panels : 0);
  const totalNominalWatts = totalPanelsCount * panelW;
  const mpptLimitWatts = 720;
  const mpptPeakLimitWatts = 864;
  const isSolarOverLimit = totalNominalWatts > mpptLimitWatts;
  const isSolarOverPeak = totalNominalWatts > mpptPeakLimitWatts;
  const mpptUsageNominalPct = Math.round((totalNominalWatts / mpptLimitWatts) * 100);
  const mpptOverNominalPct = Math.max(0, Math.round(((totalNominalWatts - mpptLimitWatts) / mpptLimitWatts) * 100));
  const mpptRemainingNominalPct = Math.max(0, Math.round(((mpptLimitWatts - totalNominalWatts) / mpptLimitWatts) * 100));
  const mpptRemainingWatts = Math.max(0, mpptLimitWatts - totalNominalWatts);
  const mpptOverPeakPct = Math.max(0, Math.round(((totalNominalWatts - mpptPeakLimitWatts) / mpptPeakLimitWatts) * 100));

  // Cálculo de volume de água nos 2 canos (1 de cada lado da estrutura base de 2200mm)
  const baseMaxLengthMm = 2200;
  const pipeRadiusMm = Math.round(waterTank.diameterMm / 2);
  const pipeDiameterMm = waterTank.diameterMm;
  const pipeRadiusDm = pipeRadiusMm / 100; // ex.: 100mm = 1.0 dm
  const pipeRadiusM = pipeRadiusMm / 1000;
  const frameInnerX = 0.70 - 0.04; // 0.66m
  const pipeOffsetX = frameInnerX - pipeRadiusM;
  const bendR = Math.max(0.06, pipeRadiusM * 1.35);
  const frontPipeSpanM = Math.max(0.20, (pipeOffsetX - bendR) * 2);
  const frontCircuitAddonM = frontPipeSpanM + Math.PI * bendR;
  const singlePipeLiters = +(Math.PI * pipeRadiusDm * pipeRadiusDm * (waterTank.lengthMm / 100)).toFixed(1);
  const frontCircuitLiters = +(Math.PI * pipeRadiusDm * pipeRadiusDm * (frontCircuitAddonM * 10)).toFixed(1);
  const totalWaterLiters = +(singlePipeLiters * 2 + frontCircuitLiters).toFixed(1);
  const litersPerMeterSingle = +(Math.PI * pipeRadiusDm * pipeRadiusDm * 10).toFixed(1);
  const litersPerMeterTotal = +(litersPerMeterSingle * 2).toFixed(1);
  const baseLengthOccupationPct = Math.round((waterTank.lengthMm / baseMaxLengthMm) * 100);

  if (viewMode === 'internal_boxes') {
    return (
      <aside className="sidebar-panel glass-panel" style={{ width: '600px', maxWidth: 'calc(100vw - 40px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📦</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.5px' }}>
                1. CAIXAS INTERNAS & GRID CAMPER
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                Sistema de Grid & Armazenadores Modulares da Doblò
              </div>
            </div>
          </div>
          <button
            onClick={() => setViewMode('assembled')}
            className="btn-compact primary"
            style={{ fontSize: '11px', padding: '6px 12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Ir para o Modo 2: Doblò Externa + Sistema Solar de Teto"
          >
            <span>Doblò Externa & Teto</span>
            <span>➔</span>
          </button>
        </div>

        <InternalBoxesPlanner />
      </aside>
    );
  }

  if (viewMode === 'bars_lineup') {
    return <CuttingPlanSidePanel />;
  }

  return (
    <aside className="sidebar-panel glass-panel">
      {/* 1. Configurador Paramétrico do Stack de Painéis Solares Flexíveis */}
      <div className="panel-section">
        <div className="section-label">
          <span>⚡ SISTEMA SOLAR FLEXÍVEL ({panelW}W)</span>
          <button
            className="btn-compact primary"
            onClick={() => openModal('panel-presets')}
            style={{ fontSize: '10px', padding: '3px 8px' }}
            title="Gerenciar presets de placas solares"
          >
            ☀️ Presets
          </button>
        </div>

        {/* Seletor Rápido de Presets de Placas */}
        <div style={{ marginBottom: '8px' }}>
          <select
            value={activePanelPreset.id}
            onChange={(e) => selectPanelPreset(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '6px',
              padding: '6px 8px',
              color: '#f8fafc',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {panelPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.powerWatts}W • {Math.round(p.width * 1000)}×{Math.round(p.length * 1000)}mm)
              </option>
            ))}
          </select>
        </div>

        {/* Ficha Técnica do Painel Flexível Selecionado */}
        <div className="panel-spec-badge">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{activePanelPreset.name}</strong>
            <span style={{ color: '#10b981', fontWeight: 800, fontSize: '11px' }}>
              {activePanelPreset.powerWatts}W / {activePanelPreset.weightKg}kg
            </span>
          </div>
          <div className="panel-spec-grid">
            <span>📐 {panelCmW} cm × {(activePanelPreset.length).toFixed(2)} m ({Math.round(activePanelPreset.thickness * 1000)}mm)</span>
            <span>⚡ Voc: {activePanelPreset.voc}V | Vmp: {activePanelPreset.vmp}V</span>
            <span>🔩 {activePanelPreset.cellType}</span>
            <span>⛓️ Eficiência: {activePanelPreset.efficiencyPercent}%</span>
          </div>
        </div>

        {/* Configuração 1: Quantidade de Níveis (Stack) */}
        <div className="config-group">
          <div className="config-group-header">
            <span>1. NÍVEIS EMPILHADOS (STACK)</span>
            <span className="tag" id="tag-stack-levels">
              {stackLevels === 1 ? '1 Nível' : '2 Níveis'}
            </span>
          </div>
          <div className="config-btn-grid">
            <button
              className={`cfg-btn ${stackLevels === 1 ? 'active' : ''}`}
              onClick={() => setStackLevels(1)}
            >
              <span>1 Nível (Fixo)</span>
              <small>Apenas Topo</small>
            </button>
            <button
              className={`cfg-btn ${stackLevels === 2 ? 'active' : ''}`}
              onClick={() => setStackLevels(2)}
            >
              <span>2 Níveis (Duplo)</span>
              <small>Topo + Gavetas</small>
            </button>
          </div>
        </div>

        {/* PRIMEIRO NO PAINEL: NÍVEL 1 (EM BAIXO / INFERIOR) */}
        <div
          className="level-config-card"
          id="card-level-1"
          style={{
            background: 'rgba(15, 23, 42, 0.45)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '8px',
            padding: '11px',
            marginBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ color: '#10b981', fontSize: '12px', letterSpacing: '0.5px' }}>
              🔻 NÍVEL 1 (EM BAIXO / INFERIOR)
            </strong>
            <span
              className="tag"
              id="tag-level1-summary"
              style={{ borderColor: '#10b981', color: '#10b981' }}
            >
              {level1.panels} Placa{level1.panels > 1 ? 's' : ''} • {level1.panels * panelW}W
            </span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
            Quantidade de Placas:
          </div>
          <div className="config-btn-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '8px' }}>
            {[1, 2, 3, 4].map(p => (
              <button
                key={p}
                className={`cfg-btn ${level1.panels === p ? 'active' : ''}`}
                onClick={() => setLevel1Panels(p)}
              >
                <span>{p}</span>
                <small>{p * panelW}W</small>
              </button>
            ))}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
            Direção de Abertura / Movimento:
          </div>
          <div className="config-btn-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '8px' }}>
            <button
              className={`cfg-btn ${level1.direction === 'longitudinal' ? 'active' : ''}`}
              onClick={() => setLevel1Direction('longitudinal')}
            >
              <span>🔄 Frente / Trás</span>
              <small>Bipartido simétrico</small>
            </button>
            <button
              className={`cfg-btn ${level1.direction === 'lateral' ? 'active' : ''}`}
              onClick={() => setLevel1Direction('lateral')}
            >
              <span>↔️ Lateral Duplo</span>
              <small>Asas para os lados</small>
            </button>
            <button
              className={`cfg-btn ${level1.direction === 'fixed' ? 'active' : ''}`}
              onClick={() => setLevel1Direction('fixed')}
            >
              <span>🔒 Fixo</span>
              <small>No centro do rack</small>
            </button>
            <button
              className={`cfg-btn ${level1.direction === 'rear_only' ? 'active' : ''}`}
              onClick={() => setLevel1Direction('rear_only')}
            >
              <span>⬇️ Apenas Trás</span>
              <small>Desliza para traseira</small>
            </button>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
            Direção / Orientação das Placas:
          </div>
          <div className="config-btn-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button
              className={`cfg-btn ${level1.orientation === 'longitudinal' ? 'active' : ''}`}
              onClick={() => setLevel1Orientation('longitudinal')}
            >
              <span>⬆️ Longitudinal</span>
              <small>No comprimento</small>
            </button>
            <button
              className={`cfg-btn ${level1.orientation === 'transverse' ? 'active' : ''}`}
              onClick={() => setLevel1Orientation('transverse')}
            >
              <span>➡️ Transversal</span>
              <small>Na largura</small>
            </button>
          </div>
        </div>

        {/* SEGUNDO NO PAINEL: NÍVEL 2 (EM CIMA / SUPERIOR) */}
        {stackLevels === 2 && (
          <div
            className="level-config-card"
            id="card-level-2"
            style={{
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '8px',
              padding: '11px',
              marginBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ color: 'var(--primary)', fontSize: '12px', letterSpacing: '0.5px' }}>
                🔺 NÍVEL 2 (EM CIMA / SUPERIOR)
              </strong>
              <span
                className="tag"
                id="tag-level2-summary"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                {level2.panels} Placa{level2.panels > 1 ? 's' : ''} • {level2.panels * panelW}W
              </span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Quantidade de Placas:
            </div>
            <div className="config-btn-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '8px' }}>
              {[1, 2, 3, 4].map(p => (
                <button
                  key={p}
                  className={`cfg-btn ${level2.panels === p ? 'active' : ''}`}
                  onClick={() => setLevel2Panels(p)}
                >
                  <span>{p}</span>
                  <small>{p * panelW}W</small>
                </button>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Direção de Abertura / Movimento:
            </div>
            <div className="config-btn-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '8px' }}>
              <button
                className={`cfg-btn ${level2.direction === 'fixed' ? 'active' : ''}`}
                onClick={() => setLevel2Direction('fixed')}
              >
                <span>🔒 Fixo no Topo</span>
                <small>No centro elevado</small>
              </button>
              <button
                className={`cfg-btn ${level2.direction === 'longitudinal' ? 'active' : ''}`}
                onClick={() => setLevel2Direction('longitudinal')}
              >
                <span>🔄 Frente / Trás</span>
                <small>Bipartido simétrico</small>
              </button>
              <button
                className={`cfg-btn ${level2.direction === 'lateral' ? 'active' : ''}`}
                onClick={() => setLevel2Direction('lateral')}
              >
                <span>↔️ Lateral Duplo</span>
                <small>Asas para os lados</small>
              </button>
              <button
                className={`cfg-btn ${level2.direction === 'rear_only' ? 'active' : ''}`}
                onClick={() => setLevel2Direction('rear_only')}
              >
                <span>⬇️ Apenas Trás</span>
                <small>Desliza para traseira</small>
              </button>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Direção / Orientação das Placas:
            </div>
            <div className="config-btn-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <button
                className={`cfg-btn ${level2.orientation === 'longitudinal' ? 'active' : ''}`}
                onClick={() => setLevel2Orientation('longitudinal')}
              >
                <span>⬆️ Longitudinal</span>
                <small>No comprimento</small>
              </button>
              <button
                className={`cfg-btn ${level2.orientation === 'transverse' ? 'active' : ''}`}
                onClick={() => setLevel2Orientation('transverse')}
              >
                <span>➡️ Transversal</span>
                <small>Na largura</small>
              </button>
            </div>
          </div>
        )}

        {/* Resumo de Potência Total Instalada vs Limite do Controlador/Inversor MPPT 60A */}
        <div
          id="sidebar-mppt-power-check"
          style={{
            background: isSolarOverLimit ? 'rgba(239, 68, 68, 0.16)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${isSolarOverLimit ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.35)'}`,
            borderRadius: '8px',
            padding: '9px 10px',
            fontSize: '11px',
            lineHeight: 1.4
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, color: isSolarOverLimit ? '#f87171' : '#34d399' }}>
              {isSolarOverLimit
                ? `🚨 Limite MPPT Excedido (+${mpptOverNominalPct}%)`
                : `✅ MPPT: ${mpptRemainingNominalPct}% livre (${mpptUsageNominalPct}% em uso)`}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: isSolarOverLimit ? '#fca5a5' : '#f8fafc',
                fontSize: '11px'
              }}
            >
              {totalNominalWatts}W / {mpptLimitWatts}W ({mpptUsageNominalPct}%)
            </span>
          </div>
          {isSolarOverLimit ? (
            <div style={{ color: '#fecaca', fontSize: '10.5px' }}>
              As <strong>{totalPanelsCount} placas de {panelW}W</strong> somam <strong>{totalNominalWatts}W</strong>, ficando{' '}
              <strong>+{mpptOverNominalPct}% acima</strong> (<strong>+{totalNominalWatts - mpptLimitWatts}W</strong>) da capacidade nominal do MPPT Kingbo 60A em 12V (720W nom. / 864W pico @ 14.4V).
              {isSolarOverPeak
                ? ` Ultrapassa também em +${mpptOverPeakPct}% (+${totalNominalWatts - mpptPeakLimitWatts}W) o teto absoluto de 864W — haverá corte de corrente (clipping em 60A) ou exigirá 2º MPPT!`
                : ` No teto de absorção (864W @ 14.4V), ainda restam ${Math.max(0, Math.round(((mpptPeakLimitWatts - totalNominalWatts) / mpptPeakLimitWatts) * 100))}% (${mpptPeakLimitWatts - totalNominalWatts}W) de margem.`}
            </div>
          ) : (
            <div style={{ color: '#a7f3d0', fontSize: '10.5px' }}>
              Em uso: <strong>{mpptUsageNominalPct}%</strong> ({totalNominalWatts}W) • Capacidade livre disponível:{' '}
              <strong>{mpptRemainingNominalPct}% ({mpptRemainingWatts}W)</strong> do total nominal de {mpptLimitWatts}W.
            </div>
          )}
        </div>
      </div>

      {/* 2. Material da Estrutura (Toggle Alumínio Tubular vs T-Slot vs Ferro Soldado) */}
      <div className="panel-section">
        <div className="section-label">
          <span>⚙️ MATERIAL DA ESTRUTURA</span>
          <span
            id="structure-weight-badge"
            style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          >
            {structureMaterial === 'aluminum_tube' ? '12.0 kg (Metalon Alumínio)' : structureMaterial === 'aluminum' ? '18.5 kg (Alumínio T-Slot)' : '42.0 kg (Ferro)'}
          </span>
        </div>
        <div className="material-toggle-container">
          <button
            className={`mat-toggle-btn ${structureMaterial === 'aluminum_tube' ? 'active' : ''}`}
            id="btn-mat-aluminum-tube"
            onClick={() => setStructureMaterial('aluminum_tube')}
          >
            <span>🔲 Alumínio Tubular Retangular (Metalon Alumínio)</span>
            <small>Ultraleve (~12.0 kg / -30kg vs Aço), perfil tubular oco {metalonThickness40.toFixed(1)}mm / {metalonThickness30.toFixed(1)}mm</small>
          </button>

          <button
            className={`mat-toggle-btn ${structureMaterial === 'aluminum' ? 'active' : ''}`}
            id="btn-mat-aluminum"
            onClick={() => setStructureMaterial('aluminum')}
          >
            <span>🔘 Alumínio Extrusão (T-Slot 40x40)</span>
            <small>Leve (~18.5 kg), 100% anti-corrosão, ranhuras T e porcas T-Nut modulares</small>
          </button>

          {/* Seletor de Acabamento / Cor do Alumínio (Aplica a T-Slot e Metalon Alumínio) */}
          {(structureMaterial === 'aluminum' || structureMaterial === 'aluminum_tube') && (
            <div id="aluminum-color-subbar" style={{ display: 'flex', gap: '6px', padding: '2px 4px 4px 4px' }}>
              <button
                className={`btn-compact ${aluminumColor === 'silver' ? 'active' : ''}`}
                id="btn-color-silver"
                onClick={() => setAluminumColor('silver')}
                style={{ flex: 1, fontSize: '11px', padding: '5px 8px', borderRadius: '4px' }}
              >
                ⚪ Alumínio Natural (Prata)
              </button>
              <button
                className={`btn-compact ${aluminumColor === 'black' ? 'active' : ''}`}
                id="btn-color-black"
                onClick={() => setAluminumColor('black')}
                style={{ flex: 1, fontSize: '11px', padding: '5px 8px', borderRadius: '4px' }}
              >
                ⚫ Anodizado Preto
              </button>
            </div>
          )}

          <button
            className={`mat-toggle-btn ${structureMaterial === 'steel' ? 'active' : ''}`}
            id="btn-mat-steel"
            onClick={() => setStructureMaterial('steel')}
          >
            <span>⚙️ Ferro Soldado {steelProfileUnit === 'inch' ? '(Metalon 1 ¼" / 1 ½")' : '(Metalon 30x30 / 40x40 mm)'}</span>
            <small>Mais pesado (~42.0 kg / +30kg no teto vs Alumínio Tubular), solda fixa</small>
          </button>

          {/* Seletor de Unidade e Cor do Perfil de Ferro (Metalon) */}
          {structureMaterial === 'steel' && (
            <div id="steel-unit-subbar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 4px 4px 4px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '3px', fontWeight: 600 }}>
                  Unidade de Medida dos Perfis:
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`btn-compact ${steelProfileUnit === 'mm' ? 'active' : ''}`}
                    id="btn-steel-unit-mm"
                    onClick={() => setSteelProfileUnit('mm')}
                    style={{ flex: 1, fontSize: '11px', padding: '5px 8px', borderRadius: '4px' }}
                  >
                    📏 Milímetros (mm)
                  </button>
                  <button
                    type="button"
                    className={`btn-compact ${steelProfileUnit === 'inch' ? 'active' : ''}`}
                    id="btn-steel-unit-inch"
                    onClick={() => setSteelProfileUnit('inch')}
                    style={{ flex: 1, fontSize: '11px', padding: '5px 8px', borderRadius: '4px' }}
                  >
                    📐 Polegadas (")
                  </button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  🎨 Cor / Pintura do Metalon:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {METALON_COLOR_PRESETS.map((preset) => {
                    const isSelected = (metalonColor || '#333b47').toLowerCase() === preset.color.toLowerCase();
                    return (
                      <button
                        key={preset.color}
                        type="button"
                        className={`btn-compact ${isSelected ? 'active' : ''}`}
                        onClick={() => setMetalonColor(preset.color)}
                        style={{
                          fontSize: '10px',
                          padding: '6px 2px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title={preset.name}
                      >
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: preset.color,
                            border: '1.5px solid rgba(255, 255, 255, 0.4)',
                            display: 'inline-block'
                          }}
                        />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Seletor de Espessura de Parede do Tubo Metalon (Alumínio ou Ferro) */}
          {(structureMaterial === 'aluminum_tube' || structureMaterial === 'steel') && (
            <div
              id="metalon-thickness-subbar"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '8px 6px',
                background: 'rgba(15, 23, 42, 0.55)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                marginTop: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700 }}>
                  📐 Espessura da Parede do Tubo:
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#38bdf8',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {metalonWallThickness.toFixed(1)} mm {structureMaterial === 'steel' ? `(${getMetalonGauge(metalonWallThickness)})` : ''}
                </span>
              </div>

              {/* Botões Rápidos de Bitola Comercial */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {[1.2, 1.5, 2.0, 3.0].map((t) => {
                  const isAct = Math.abs(metalonWallThickness - t) < 0.05 && (!showCustomThicknessSizes || Math.abs(metalonThickness40 - t) < 0.05);
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`btn-compact ${isAct ? 'active' : ''}`}
                      onClick={() => setMetalonWallThickness(t)}
                      style={{
                        fontSize: '10px',
                        padding: '4px 2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1px'
                      }}
                      title={`${t.toFixed(1)} mm (${getMetalonGauge(t)})`}
                    >
                      <span style={{ fontWeight: 800 }}>{t.toFixed(1)} mm</span>
                      <small style={{ fontSize: '8px', opacity: 0.8 }}>
                        {t === 1.2 ? '#18 Leve' : t === 1.5 ? '#16 Padrão' : t === 2.0 ? '#14 Reforço' : '#1/8" Pesado'}
                      </small>
                    </button>
                  );
                })}
              </div>

              {/* Slider de Ajuste Contínuo + Campo Numérico */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="0.8"
                  max="4.0"
                  step="0.1"
                  value={metalonWallThickness}
                  onChange={(e) => setMetalonWallThickness(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  title="Ajuste fino da espessura da parede do tubo"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <input
                    type="number"
                    min="0.5"
                    max="6.0"
                    step="0.1"
                    value={metalonWallThickness}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 0.5 && val <= 6.0) {
                        setMetalonWallThickness(val);
                      }
                    }}
                    style={{
                      width: '46px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '4px',
                      padding: '3px 4px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontWeight: 700,
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>mm</span>
                </div>
              </div>

              {/* Botão de Expansão para Configurar 40x40 e 30x30 separadamente */}
              <button
                type="button"
                className="btn-compact"
                onClick={() => setShowCustomThicknessSizes(!showCustomThicknessSizes)}
                style={{
                  fontSize: '9.5px',
                  padding: '3px 6px',
                  background: showCustomThicknessSizes ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  border: '1px dashed rgba(56, 189, 248, 0.35)',
                  borderRadius: '4px',
                  color: '#94a3b8',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>⚙️ Ajustar 40x40 e 30x30 separadamente</span>
                <span>{showCustomThicknessSizes ? '▲ Fechar' : '▼ Expandir'}</span>
              </button>

              {showCustomThicknessSizes && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '6px 8px',
                    background: 'rgba(2, 6, 23, 0.5)',
                    borderRadius: '4px',
                    borderLeft: '2px solid var(--primary)'
                  }}
                >
                  {/* Espessura 40x40 (Rack Base e Subchassi) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', marginBottom: '2px' }}>
                      <span style={{ color: '#cbd5e1' }}>Base & Torres (40x40):</span>
                      <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                        {metalonThickness40.toFixed(1)} mm
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="range"
                        min="0.8"
                        max="4.0"
                        step="0.1"
                        value={metalonThickness40}
                        onChange={(e) => setMetalonThickness40(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--primary)', height: '4px' }}
                      />
                      <input
                        type="number"
                        min="0.5"
                        max="6.0"
                        step="0.1"
                        value={metalonThickness40}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0.5 && val <= 6.0) setMetalonThickness40(val);
                        }}
                        style={{
                          width: '40px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '3px',
                          padding: '1px 3px',
                          color: '#fff',
                          fontSize: '10px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  {/* Espessura 30x30 (Bandejas e Pilares) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', marginBottom: '2px' }}>
                      <span style={{ color: '#cbd5e1' }}>Bandejas & Pilares (30x30):</span>
                      <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                        {metalonThickness30.toFixed(1)} mm
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="range"
                        min="0.8"
                        max="4.0"
                        step="0.1"
                        value={metalonThickness30}
                        onChange={(e) => setMetalonThickness30(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--primary)', height: '4px' }}
                      />
                      <input
                        type="number"
                        min="0.5"
                        max="6.0"
                        step="0.1"
                        value={metalonThickness30}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0.5 && val <= 6.0) setMetalonThickness30(val);
                        }}
                        style={{
                          width: '40px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '3px',
                          padding: '1px 3px',
                          color: '#fff',
                          fontSize: '10px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 7. Posição do Rack no Teto (Alinhamento Longitudinal + Altura) */}
      <div className="panel-section">
        <div className="section-label">
          <span>📍 POSIÇÃO DO RACK NO TETO</span>
        </div>

        {/* Slider Z: Frente ↔ Traseira */}
        <div className="rack-pos-row">
          <span className="rack-pos-lbl">↔ Frente/Trás</span>
          <span id="rack-offset-val" className="rack-pos-val">
            {offsetZ >= 0 ? '+' : ''}{offsetZ.toFixed(2)} m
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            fontSize: '9px',
            color: 'var(--text-muted)',
            marginBottom: '3px'
          }}
        >
          <span>⬅ Tras.</span>
          <span style={{ flex: 1 }}></span>
          <span>Diant. ➡</span>
        </div>
        <input
          type="range"
          id="rack-offset-slider"
          className="custom-slider"
          min="-1.50"
          max="1.50"
          step="0.05"
          value={offsetZ}
          onChange={(e) => setOffsetZ(parseFloat(e.target.value))}
        />

        {/* Slider Y: Baixo ↔ Cima */}
        <div className="rack-pos-row" style={{ marginTop: '10px' }}>
          <span className="rack-pos-lbl">↕ Altura</span>
          <span id="rack-height-val" className="rack-pos-val">
            {offsetY >= 0 ? '+' : ''}{offsetY.toFixed(2)} m
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            fontSize: '9px',
            color: 'var(--text-muted)',
            marginBottom: '3px'
          }}
        >
          <span>⬇ Baixo</span>
          <span style={{ flex: 1 }}></span>
          <span>Cima ⬆</span>
        </div>
        <input
          type="range"
          id="rack-height-slider"
          className="custom-slider"
          min="-0.30"
          max="0.50"
          step="0.02"
          value={offsetY}
          onChange={(e) => setOffsetY(parseFloat(e.target.value))}
        />
      </div>

      {/* 8. Posição dos Armazenadores & Caixas Internas dentro da Doblò */}
      <div className="panel-section" style={{ borderLeft: '3px solid #f59e0b' }}>
        <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#f59e0b' }}>📦 POSIÇÃO DAS CAIXAS NA DOBLÒ</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn-compact"
              onClick={() => setIsOpenPreview(!isOpenPreview)}
              style={{
                fontSize: '10px',
                padding: '3px 7px',
                color: isOpenPreview ? '#34d399' : '#94a3b8',
                borderColor: isOpenPreview ? 'rgba(52, 211, 153, 0.5)' : 'rgba(148, 163, 184, 0.3)'
              }}
              title="Simula abertura de gavetões deslizantes e tampas de baús"
            >
              {isOpenPreview ? '🔓 Abertos' : '🔒 Fechados'}
            </button>
            <button
              className="btn-compact"
              onClick={() => setViewMode('internal_boxes')}
              style={{ fontSize: '10px', padding: '3px 7px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.45)' }}
              title="Abrir o Editor de Grid 2D Completo (Modo 1)"
            >
              ✏️ Modo Grid ➔
            </button>
          </div>
        </div>

        {/* Sliders de Posição Tridimensional do Conjunto */}
        {/* Slider Z: Frente ↔ Traseira */}
        <div className="rack-pos-row">
          <span className="rack-pos-lbl">↔ Frente / Trás (Z)</span>
          <span className="rack-pos-val" style={{ color: '#f59e0b' }}>
            {(internalGrid.offsetZ || 0) >= 0 ? '+' : ''}{(internalGrid.offsetZ || 0).toFixed(2)} m ({Math.round((internalGrid.offsetZ || 0) * 100)} cm)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '3px' }}>
          <span>⬅ Traseira / Porta-Malas</span>
          <span style={{ flex: 1 }}></span>
          <span>Bancos Dianteiros ➡</span>
        </div>
        <input
          type="range"
          className="custom-slider"
          min="-0.80"
          max="0.80"
          step="0.01"
          value={internalGrid.offsetZ || 0}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setInternalGrid(prev => ({ ...prev, offsetZ: val }));
          }}
        />

        {/* Slider Y: Altura do Assoalho / Estrado */}
        <div className="rack-pos-row" style={{ marginTop: '10px' }}>
          <span className="rack-pos-lbl">↕ Altura do Estrado (Y)</span>
          <span className="rack-pos-val" style={{ color: '#f59e0b' }}>
            {(internalGrid.offsetY || 0) >= 0 ? '+' : ''}{(internalGrid.offsetY || 0).toFixed(2)} m ({Math.round((internalGrid.offsetY || 0) * 100)} cm)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '3px' }}>
          <span>⬇ Rebaixar Piso</span>
          <span style={{ flex: 1 }}></span>
          <span>Elevar Estrado ⬆</span>
        </div>
        <input
          type="range"
          className="custom-slider"
          min="-0.20"
          max="0.40"
          step="0.01"
          value={internalGrid.offsetY || 0}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setInternalGrid(prev => ({ ...prev, offsetY: val }));
          }}
        />

        {/* Slider X: Alinhamento Lateral */}
        <div className="rack-pos-row" style={{ marginTop: '10px' }}>
          <span className="rack-pos-lbl">⬅ Lateralidade Esq / Dir (X)</span>
          <span className="rack-pos-val" style={{ color: '#f59e0b' }}>
            {(internalGrid.offsetX || 0) >= 0 ? '+' : ''}{(internalGrid.offsetX || 0).toFixed(2)} m ({Math.round((internalGrid.offsetX || 0) * 100)} cm)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '3px' }}>
          <span>Passageiro (-X)</span>
          <span style={{ flex: 1 }}></span>
          <span>Motorista (+X)</span>
        </div>
        <input
          type="range"
          className="custom-slider"
          min="-0.30"
          max="0.30"
          step="0.01"
          value={internalGrid.offsetX || 0}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setInternalGrid(prev => ({ ...prev, offsetX: val }));
          }}
        />

        {/* Botão Reset de Posição */}
        {((internalGrid.offsetZ || 0) !== 0 || (internalGrid.offsetY || 0) !== 0 || (internalGrid.offsetX || 0) !== 0) && (
          <div style={{ textAlign: 'right', marginTop: '6px' }}>
            <button
              className="btn-compact"
              onClick={() => setInternalGrid(prev => ({ ...prev, offsetX: 0, offsetY: 0, offsetZ: 0 }))}
              style={{ fontSize: '9.5px', padding: '2px 8px', color: '#94a3b8' }}
            >
              ↺ Resetar Posição Original
            </button>
          </div>
        )}

        {/* Visualização da Lataria do Veículo */}
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700 }}>
              👁️ Visibilidade da Doblò:
            </span>
            <span style={{ fontSize: '9.5px', color: '#cbd5e1' }}>
              {isVehicleVisible ? (vehicleOpacity < 0.99 ? 'Translúcida (30%)' : 'Opaca (100%)') : 'Oculta'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            <button
              className={`btn-compact ${isVehicleVisible && vehicleOpacity >= 0.99 ? 'active' : ''}`}
              onClick={() => {
                setVehicleOpacity(1.0);
                if (!isVehicleVisible) toggleVehicle();
              }}
              style={{ fontSize: '10px', padding: '4px' }}
            >
              🚐 Opaca
            </button>
            <button
              className={`btn-compact ${isVehicleVisible && vehicleOpacity < 0.99 ? 'active' : ''}`}
              onClick={() => {
                setVehicleOpacity(0.30);
                if (!isVehicleVisible) toggleVehicle();
              }}
              style={{ fontSize: '10px', padding: '4px' }}
            >
              👻 Raio-X
            </button>
            <button
              className={`btn-compact ${!isVehicleVisible ? 'active' : ''}`}
              onClick={() => {
                if (isVehicleVisible) toggleVehicle();
              }}
              style={{ fontSize: '10px', padding: '4px' }}
            >
              👁️ Ocultar
            </button>
          </div>
        </div>
      </div>

      {/* 9. Baú de Teto Motobul Off Road & Subchassi */}
      <div className="panel-section">
        <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
          <span>🧰 BAÚ DE TETO / BAGAGEIRO</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn-compact"
              onClick={() => openModal('cargo-presets')}
              style={{ fontSize: '10px', padding: '3px 7px', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.45)' }}
              title="Gerenciar e cadastrar presets de baú de teto"
            >
              📦 Presets
            </button>
            <button
              className={`btn-compact ${cargoBox.enabled ? 'primary active' : ''}`}
              onClick={() => setCargoBoxEnabled(!cargoBox.enabled)}
              style={{ fontSize: '10px', padding: '3px 7px' }}
            >
              {cargoBox.enabled ? '✅ Ativado' : '❌ Desativado'}
            </button>
          </div>
        </div>

        {cargoBox.enabled && (
          <>
            {/* Seletor Rápido de Presets de Baú */}
            <div style={{ marginBottom: '6px' }}>
              <select
                value={activeCargoBoxPreset.id}
                onChange={(e) => selectCargoBoxPreset(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: '#f8fafc',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {cargoBoxPresets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.length}×{b.width}×{b.height}mm)
                  </option>
                ))}
              </select>
            </div>

            {/* Ficha Técnica Rápida */}
            <div className="panel-spec-badge" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#fbbf24' }}>{activeCargoBoxPreset.name}</strong>
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '11px' }}>
                  {activeCargoBoxPreset.weightKg} kg / {activeCargoBoxPreset.maxLoadKg} kg útil
                </span>
              </div>
              <div className="panel-spec-grid">
                <span>📐 Medidas: {cargoBox.length} × {cargoBox.width} × {cargoBox.height} mm</span>
                <span>🛡️ {activeCargoBoxPreset.volumeLiters} Litros</span>
                <span>⛓️ Dobradiças e torres inox</span>
                <span>💨 Amortecedores a gás (65°)</span>
              </div>
            </div>

            {/* Lado da Articulação / Dobradiça */}
            <div className="config-group" style={{ marginTop: '8px' }}>
              <div className="config-group-header">
                <span>LADO DA DOBRADIÇA (BASCULAMENTO):</span>
              </div>
              <div className="config-btn-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <button
                  className={`cfg-btn ${cargoBox.hingeSide === 'driver' ? 'active' : ''}`}
                  onClick={() => setCargoBoxHingeSide('driver')}
                >
                  <span>🚗 Motorista</span>
                  <small>Abre para Calçada (Recomendado)</small>
                </button>
                <button
                  className={`cfg-btn ${cargoBox.hingeSide === 'passenger' ? 'active' : ''}`}
                  onClick={() => setCargoBoxHingeSide('passenger')}
                >
                  <span>🚶 Passageiro</span>
                  <small>Abre para Rua</small>
                </button>
              </div>
            </div>

            {/* Dimensões Paramétricas do Baú */}
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Comprimento:</span>
                  <strong style={{ color: 'var(--primary)' }}>{cargoBox.length} mm</strong>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="1200"
                  max="2000"
                  step="50"
                  value={cargoBox.length}
                  onChange={(e) => setCargoBoxDimensions(parseFloat(e.target.value), cargoBox.width, cargoBox.height)}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Largura:</span>
                  <strong style={{ color: 'var(--primary)' }}>{cargoBox.width} mm</strong>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="800"
                  max="1200"
                  step="25"
                  value={cargoBox.width}
                  onChange={(e) => setCargoBoxDimensions(cargoBox.length, parseFloat(e.target.value), cargoBox.height)}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Altura do Baú:</span>
                  <strong style={{ color: 'var(--primary)' }}>{cargoBox.height} mm</strong>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="200"
                  max="600"
                  step="10"
                  value={cargoBox.height}
                  onChange={(e) => setCargoBoxDimensions(cargoBox.length, cargoBox.width, parseFloat(e.target.value))}
                />
              </div>

              {/* Checkbox Torres Telescópicas vs Fixas */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '6px 8px',
                borderRadius: '6px',
                marginBottom: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#f8fafc',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={cargoBox.isTelescopic !== false}
                    onChange={(e) => setCargoBoxTelescopic(e.target.checked)}
                    style={{ accentColor: '#38bdf8', width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  <span>Torres Telescópicas de Elevação</span>
                </label>
                <span style={{
                  fontSize: '9.5px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: cargoBox.isTelescopic !== false ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                  color: cargoBox.isTelescopic !== false ? '#38bdf8' : '#94a3b8',
                  fontWeight: 700
                }}>
                  {cargoBox.isTelescopic !== false ? '↕ Telescópica' : '🔒 Fixa'}
                </span>
              </div>

              {cargoBox.isTelescopic !== false ? (
                (() => {
                  const maxLiftMm = Math.max(60, Math.floor(((cargoBox.height || 330) - 100) / 10) * 10);
                  const curLiftMm = Math.min(maxLiftMm, cargoBox.verticalLiftMm || 0);
                  return (
                    <div
                      style={{
                        background: 'rgba(14, 165, 233, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '6px',
                        padding: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                        <span>↕ Abertura Vertical (Torres Telescópicas):</span>
                        <strong>+{curLiftMm} / {maxLiftMm} mm</strong>
                      </div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Curso real da barra 30×30 ({cargoBox.height + 20}mm c/ 90mm engaste mín. na base 40×40) • Vão livre: {cargoBox.height + curLiftMm + 8} mm
                      </div>
                      <input
                        type="range"
                        className="custom-slider"
                        min="0"
                        max={maxLiftMm}
                        step="10"
                        value={curLiftMm}
                        onChange={(e) => setCargoBoxVerticalLift(parseFloat(e.target.value))}
                      />
                    </div>
                  );
                })()
              ) : (
                <div style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  borderLeft: '3px solid #38bdf8'
                }}>
                  🔒 <strong>Torres Fixas Selecionadas:</strong> Perfil monobloco fixo no limite mínimo de altura (vão livre rente de 8mm sobre a tampa do baú). Economiza peso e garante a menor altura do conjunto.
                </div>
              )}
            </div>

            <button
              className="btn-link-action"
              onClick={() => openModal('bom')}
              style={{ marginTop: '6px', fontSize: '11px', color: '#fbbf24' }}
            >
              📊 Ver Força dos Pistões e Ferragens no BOM &rarr;
            </button>
          </>
        )}
      </div>

      {/* 8B. Caixa d'Água em U (2 Joelhos 90° + Canos PVC 100% Internos à Estrutura) */}
      <div className="panel-section">
        <div className="section-label">
          <span>💧 CAIXA D'ÁGUA EM U (2× Joelhos 90° · Ø{pipeDiameterMm}mm)</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 800,
              color: waterTank.enabled ? '#38bdf8' : 'var(--text-muted)'
            }}
          >
            {waterTank.enabled ? `${totalWaterLiters.toFixed(1)} L` : 'Desativada'}
          </span>
        </div>

        {/* Checkbox principal para incluir/remover a caixa d'água em U */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '9px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            background: waterTank.enabled ? 'rgba(14, 165, 233, 0.14)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${waterTank.enabled ? 'rgba(56, 189, 248, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
            marginBottom: waterTank.enabled ? '10px' : '0',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="checkbox"
            checked={waterTank.enabled}
            onChange={(e) => setWaterTankEnabled(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              accentColor: '#0ea5e9',
              cursor: 'pointer',
              flexShrink: 0
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: waterTank.enabled ? '#f8fafc' : '#94a3b8' }}>
              Caixa d'Água em U (100% Dentro do Ferro · Ø{pipeDiameterMm}mm)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              2 canos laterais + 1 frontal + 2 joelhos de 90° em volta do baú • 100% embutida no subchassi
            </span>
          </div>
        </label>

        {waterTank.enabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 1. Seleção do Raio Fixo do Cano */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Raio do Cano:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
                  Raio {pipeRadiusMm} mm (Ø{pipeDiameterMm} mm)
                </span>
              </div>

              {/* Botões de Raio Fixo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
                {[50, 75, 100, 125, 150].map((rMm) => (
                  <button
                    key={rMm}
                    type="button"
                    className={`btn-compact ${pipeRadiusMm === rMm ? 'active' : ''}`}
                    onClick={() => setWaterTankRadius(rMm)}
                    style={{
                      fontSize: '10px',
                      padding: '6px 2px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title={`Raio ${rMm}mm (Diâmetro Ø${rMm * 2}mm)`}
                  >
                    <strong>R{rMm}</strong>
                    <span style={{ fontSize: '8.5px', opacity: 0.8 }}>Ø{rMm * 2}mm</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Controle de Comprimento dos Canos (até o limite de 2200mm da base) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Comprimento dos Canos:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min={400}
                    max={baseMaxLengthMm}
                    step={50}
                    value={waterTank.lengthMm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!Number.isNaN(val)) setWaterTankLength(val);
                    }}
                    style={{
                      width: '68px',
                      padding: '2px 5px',
                      fontSize: '11px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: '#38bdf8',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      borderRadius: '4px',
                      textAlign: 'right'
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    / {baseMaxLengthMm} mm
                  </span>
                </div>
              </div>

              <input
                type="range"
                className="custom-slider"
                min="400"
                max={baseMaxLengthMm}
                step="50"
                value={waterTank.lengthMm}
                onChange={(e) => setWaterTankLength(parseFloat(e.target.value))}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                <span>Mín: 400 mm (0.40m)</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                  {(waterTank.lengthMm / 1000).toFixed(2)} m ({baseLengthOccupationPct}% da base)
                </span>
                <span>Máx Base: {baseMaxLengthMm} mm (2.20m)</span>
              </div>

              {/* Atalhos rápidos de medida */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '6px' }}>
                {[1000, 1500, 1800, 2200].map((presetMm) => (
                  <button
                    key={presetMm}
                    type="button"
                    className={`btn-compact ${waterTank.lengthMm === presetMm ? 'active' : ''}`}
                    onClick={() => setWaterTankLength(presetMm)}
                    style={{ fontSize: '10px', padding: '4px 2px' }}
                  >
                    {presetMm === 2200 ? '2200 (Máx)' : `${presetMm}mm`}
                  </button>
                ))}
              </div>
            </div>

            {/* Card de Cálculo Automático de Capacidade de Água */}
            <div
              style={{
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                padding: '9px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#bae6fd', fontWeight: 700 }}>
                  💧 Capacidade Total de Água (Circuito em U):
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#38bdf8'
                  }}
                >
                  {totalWaterLiters.toFixed(1)} Litros
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '10px'
                }}
              >
                <div style={{ color: '#94a3b8' }}>
                  2× Laterais (Ø{pipeDiameterMm}):{' '}
                  <strong style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                    {(singlePipeLiters * 2).toFixed(1)} L
                  </strong>
                </div>
                <div style={{ color: '#94a3b8', textAlign: 'right' }}>
                  Peso da água cheio:{' '}
                  <strong style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                    ~{totalWaterLiters.toFixed(1)} kg
                  </strong>
                </div>
                <div style={{ color: '#94a3b8' }}>
                  Frontal + 2 Joelhos 90°:{' '}
                  <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    +{frontCircuitLiters.toFixed(1)} L
                  </strong>
                </div>
                <div style={{ color: '#94a3b8', textAlign: 'right' }}>
                  Montagem:{' '}
                  <strong style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    100% interna ao ferro
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 10. Toldo Retrátil Overland (Traseiro ou Asa de Morcego 270°) */}
      <div className="panel-section">
        <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⛺ TOLDO RETRÁTIL OVERLAND</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: awning.enabled ? '#38bdf8' : 'var(--text-muted)'
            }}
          >
            {awning.enabled ? (awning.type === 'batwing_270' ? 'Asa 270°' : 'Traseiro') : 'Desativado'}
          </span>
        </div>

        {/* Toggle Ativar / Desativar Toldo */}
        <label
          className="checkbox-custom"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '7px 9px',
            borderRadius: '6px',
            background: awning.enabled ? 'rgba(14, 165, 233, 0.14)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${awning.enabled ? 'rgba(56, 189, 248, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
            marginBottom: awning.enabled ? '10px' : '0',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="checkbox"
            checked={awning.enabled}
            onChange={(e) => setAwning({ enabled: e.target.checked })}
            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: awning.enabled ? '#f8fafc' : '#94a3b8' }}>
              ⛺ Ativar Toldo Retrátil no Rack
            </span>
            <small style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Case em alumínio fixado na longarina com lona impermeável ripstop
            </small>
          </div>
        </label>

        {awning.enabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '4px' }}>
            {/* Seletor de Modelo */}
            <div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
                Modelo do Toldo Overland:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                <button
                  type="button"
                  className={`btn-compact ${awning.type === 'rear' ? 'active' : ''}`}
                  onClick={() => setAwning({ type: 'rear' })}
                  style={{
                    fontSize: '11px',
                    padding: '7px 4px',
                    fontWeight: 700
                  }}
                >
                  🚗 Traseiro Reto
                </button>
                <button
                  type="button"
                  className={`btn-compact ${awning.type === 'batwing_270' ? 'active accent-amber' : ''}`}
                  onClick={() => setAwning({ type: 'batwing_270' })}
                  style={{
                    fontSize: '11px',
                    padding: '7px 4px',
                    fontWeight: 700
                  }}
                >
                  🦇 Asa Morcego 270°
                </button>
              </div>
            </div>

            {/* Lado de Fixação se for Asa de Morcego */}
            {awning.type === 'batwing_270' && (
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                  <span>Montagem do Estojo no Rack:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                    {awning.side === 'passenger' ? 'Passageiro (Direita)' : 'Motorista (Esquerda)'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  <button
                    type="button"
                    className={`btn-compact ${awning.side === 'passenger' ? 'active' : ''}`}
                    onClick={() => setAwning({ side: 'passenger' })}
                    style={{ fontSize: '10px', padding: '5px 4px' }}
                  >
                    Direita (Passageiro)
                  </button>
                  <button
                    type="button"
                    className={`btn-compact ${awning.side === 'driver' ? 'active' : ''}`}
                    onClick={() => setAwning({ side: 'driver' })}
                    style={{ fontSize: '10px', padding: '5px 4px' }}
                  >
                    Esquerda (Motorista)
                  </button>
                </div>
              </div>
            )}

            {/* Botão de Ação: Abrir / Recolher */}
            <button
              type="button"
              className={`btn-compact primary ${awning.isOpen ? 'active' : ''}`}
              onClick={toggleAwningOpen}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontWeight: 800,
                fontSize: '11.5px',
                background: awning.isOpen
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.4))'
                  : 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.3))',
                borderColor: awning.isOpen ? '#10b981' : '#38bdf8',
                color: awning.isOpen ? '#34d399' : '#38bdf8',
                boxShadow: awning.isOpen ? '0 0 10px rgba(16, 185, 129, 0.3)' : undefined
              }}
            >
              {awning.isOpen ? '⛺ Recolher Toldo no Estojo' : '⛺ Desdobrar Lona (Abrir Toldo)'}
            </button>

            {/* Cor da Lona Ripstop */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px', fontSize: '10px', color: '#94a3b8' }}>
              <span>🎨 Cor da Lona Impermeável:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { label: 'Safari', color: '#c2b280' },
                  { label: 'Grafite', color: '#374151' },
                  { label: 'Oliva', color: '#4b5320' },
                  { label: 'Preto', color: '#18181b' }
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setAwning({ fabricColor: c.color })}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: c.color,
                      border: awning.fabricColor === c.color ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.3)',
                      boxShadow: awning.fabricColor === c.color ? '0 0 6px rgba(56, 189, 248, 0.7)' : undefined,
                      cursor: 'pointer'
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Card com Especificações do Toldo */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '10px',
                color: '#cbd5e1',
                lineHeight: 1.45
              }}
            >
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '2px' }}>
                {awning.type === 'batwing_270' ? '🦇 Asa de Morcego 270° Overland' : '🚗 Toldo Reto Traseiro'}
              </div>
              <div>
                {awning.type === 'batwing_270'
                  ? 'Cobertura total de 270° contornando lateral e traseira da Doblò (~10 m² de sombra).'
                  : 'Projeção reta traseira de 2,00m cobrindo a tampa aberta do porta-malas (~2,8 m² de sombra).'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 9. Sistema de Recarga Veicular DC-DC B2B1230 */}
      <div className="panel-section">
        <div className="section-label">
          <span>🔋 ALTERNADOR DOBLÒ & CARREGADOR B2B1230</span>
        </div>

        <div
          style={{
            background: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.12)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.35)' : 'rgba(56, 189, 248, 0.2)'}`,
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '11px', color: b2bCharger.isEngineRunning ? '#4ade80' : '#38bdf8' }}>
              B2B1230 (12V 30A · 390W)
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: b2bCharger.isEngineRunning ? '#4ade80' : '#94a3b8',
                background: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                padding: '2px 6px',
                borderRadius: '8px'
              }}
            >
              {b2bCharger.isEngineRunning ? 'RODANDO (+30A)' : 'DESLIGADO'}
            </span>
          </div>

          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
            Recarrega a bateria de serviço Kingbo 560Ah através do alternador do motor da van com curva de carga de 4 estágios.
          </p>

          {/* Configuração de tempo de rodagem diária */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(56, 189, 248, 0.18)',
              borderRadius: '6px',
              padding: '6px 8px',
              marginBottom: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>⏱️ Rodagem diária:</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: b2bCharger.engineHoursPerDay > 0 ? '#4ade80' : '#94a3b8' }}>
                {b2bCharger.engineHoursPerDay.toFixed(1)} h/dia
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="8"
              step="0.25"
              value={b2bCharger.engineHoursPerDay}
              onChange={(e) => setB2BEngineHours(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', height: '4px', cursor: 'pointer', margin: '2px 0 6px 0' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>
              <span>
                {b2bCharger.engineHoursPerDay > 0
                  ? `+${Math.round(b2bCharger.engineHoursPerDay * 30)} Ah/dia injetados`
                  : '0 Ah (sem rodar)'}
              </span>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                {b2bCharger.engineHoursPerDay > 0
                  ? `+${Math.round(b2bCharger.engineHoursPerDay * 390)} Wh/dia`
                  : '0 Wh'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
              Controle de ignição no topo ⬆️
            </span>
            <button
              className="btn-compact primary"
              onClick={() => openModal('b2b')}
              style={{ fontSize: '10px', padding: '4px 10px' }}
            >
              📱 App / Specs B2B
            </button>
          </div>
        </div>
      </div>

      {/* 10. Fonte & Carregador Usina Smart Connect (Rede AC / Camping) */}
      <div className="panel-section">
        <div className="section-label">
          <span>🔌 FONTE & CARREGADOR USINA SMART CONNECT</span>
        </div>

        <div
          style={{
            background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.12)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.2)'}`,
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '11px', color: usinaCharger.isConnectedAC ? '#f87171' : '#fca5a5' }}>
              Usina {usinaCharger.modelRating}A ({Math.round(usinaCharger.chargingAmps * usinaCharger.voltageOut)}W)
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: usinaCharger.isConnectedAC ? '#f87171' : '#94a3b8',
                background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                padding: '2px 6px',
                borderRadius: '8px'
              }}
            >
              {usinaCharger.isConnectedAC ? `SHORE POWER (+${usinaCharger.chargingAmps}A)` : 'OFF-GRID'}
            </span>
          </div>

          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
            Recarga pesada Bivolt 110V/220V em tomadas de camping, garagem ou gerador externo para a bateria 560Ah.
          </p>

          {/* Seleção do Modelo Usina: 70A, 120A, 150A, 200A */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Modelo Usina Smart Connect:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {([70, 120, 150, 200] as const).map((rating) => (
                <button
                  key={rating}
                  className={`btn-compact ${usinaCharger.modelRating === rating ? 'active accent-red' : ''}`}
                  onClick={() => setUsinaModel(rating)}
                  style={{
                    fontSize: '9.5px',
                    padding: '4px 0',
                    textAlign: 'center'
                  }}
                  title={`Modelo Usina ${rating}A 12V Bivolt (${Math.round(rating * 14.4)}W)`}
                >
                  {rating}A
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn-compact ${usinaCharger.isConnectedAC ? 'active' : ''}`}
              onClick={toggleUsinaAC}
              style={{
                flex: 1,
                fontSize: '10px',
                background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)',
                borderColor: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)',
                color: usinaCharger.isConnectedAC ? '#fca5a5' : '#86efac'
              }}
            >
              {usinaCharger.isConnectedAC ? '🔌 Desconectar' : '⚡ Conectar Tomada'}
            </button>
            <button
              className="btn-compact primary"
              onClick={() => openModal('usina')}
              style={{ fontSize: '10px', padding: '4px 8px' }}
            >
              📊 Specs / Ajuste
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

