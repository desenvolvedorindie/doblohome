import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { METALON_COLOR_PRESETS, getMetalonGauge } from '../../types';

export const SidebarStructureSection: React.FC = () => {
  const {
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
  } = useSolar();

  const [showCustomThicknessSizes, setShowCustomThicknessSizes] = useState<boolean>(false);

  return (
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

  );
};
