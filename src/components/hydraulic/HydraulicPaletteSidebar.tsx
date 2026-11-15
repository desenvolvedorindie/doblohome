import React, { useState } from 'react';
import {
  HYDRAULIC_VALVES_FITTINGS_CATALOG,
  HYDRAULIC_WATER_POINTS_CATALOG,
  HydraulicCatalogTemplate
} from '../../types/hydraulicPlanar';
import {
  buildCustomHydraulicTemplate,
  buildHydraulicSystemTemplates
} from '../../utils/hydraulicCatalog';
import { useSolar } from '../../context/SolarContext';

interface HydraulicPaletteSidebarProps {
  onAddTemplate: (template: HydraulicCatalogTemplate) => void;
  placedCatalogIds: Set<string>;
  customTemplates: HydraulicCatalogTemplate[];
  onCreateCustomTemplate: (tpl: HydraulicCatalogTemplate) => void;
  onRemoveCustomTemplate: (catalogId: string) => void;
}

export const HydraulicPaletteSidebar: React.FC<HydraulicPaletteSidebarProps> = ({
  onAddTemplate,
  placedCatalogIds,
  customTemplates,
  onCreateCustomTemplate,
  onRemoveCustomTemplate
}) => {
  const { waterTank, appliances, activePortaPottiPreset } = useSolar();
  const [search, setSearch] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('💧');
  const [customFlow, setCustomFlow] = useState('6');
  const [customCap, setCustomCap] = useState('0');
  const [customDiam, setCustomDiam] = useState('12');
  const [customIsDrain, setCustomIsDrain] = useState(false);

  const systemTemplates = buildHydraulicSystemTemplates(
    waterTank,
    appliances,
    activePortaPottiPreset
  );

  const q = search.trim().toLowerCase();
  const filterList = (list: HydraulicCatalogTemplate[]) =>
    q
      ? list.filter(
          (t) =>
            t.label.toLowerCase().includes(q) ||
            t.subtitle.toLowerCase().includes(q)
        )
      : list;

  const filteredSystem = filterList(systemTemplates);
  const filteredPoints = filterList(HYDRAULIC_WATER_POINTS_CATALOG);
  const heatingChillerIds = new Set([
    'vf_heat_exchanger',
    'vf_mixing_valve',
    'vf_pressure_relief'
  ]);
  const heatingChillerOrder = ['vf_heat_exchanger', 'vf_mixing_valve', 'vf_pressure_relief'];
  const filteredHeating = filterList(
    HYDRAULIC_VALVES_FITTINGS_CATALOG.filter((t) => heatingChillerIds.has(t.catalogId)).sort(
      (a, b) => heatingChillerOrder.indexOf(a.catalogId) - heatingChillerOrder.indexOf(b.catalogId)
    )
  );
  const filteredValves = filterList(
    HYDRAULIC_VALVES_FITTINGS_CATALOG.filter((t) => !heatingChillerIds.has(t.catalogId))
  );
  const filteredCustom = filterList(customTemplates);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    tpl: HydraulicCatalogTemplate
  ) => {
    e.dataTransfer.setData('application/hydraulic-template', JSON.stringify(tpl));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const tpl = buildCustomHydraulicTemplate({
      name: customName,
      icon: customIcon || '💧',
      flowLpm: parseFloat(customFlow) || 0,
      capacityLiters: parseFloat(customCap) || 0,
      diameterMm: parseInt(customDiam) || 12,
      isDrain: customIsDrain
    });
    onCreateCustomTemplate(tpl);
    onAddTemplate(tpl);
    setCustomName('');
    setShowCustomForm(false);
  };

  const renderPaletteCard = (
    tpl: HydraulicCatalogTemplate,
    accentColor: string,
    removable?: boolean
  ) => {
    const isPlaced = placedCatalogIds.has(tpl.catalogId);
    return (
      <div
        key={tpl.catalogId}
        draggable
        onDragStart={(e) => handleDragStart(e, tpl)}
        onClick={() => onAddTemplate(tpl)}
        title="Arraste para o diagrama ou clique para inserir"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '7px 9px',
          borderRadius: '8px',
          background: 'rgba(15, 23, 42, 0.72)',
          border: `1px solid ${isPlaced ? accentColor : 'rgba(148, 163, 184, 0.2)'}`,
          cursor: 'grab',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '15px', lineHeight: 1 }}>{tpl.icon}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#f1f5f9',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {tpl.label}
            </div>
            <div
              style={{
                fontSize: '9.5px',
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {tpl.subtitle}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isPlaced && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                color: accentColor,
                background: 'rgba(255,255,255,0.06)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}
            >
              ✓
            </span>
          )}
          {removable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveCustomTemplate(tpl.catalogId);
              }}
              title="Remover modelo customizado"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '2px'
              }}
            >
              ✕
            </button>
          )}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: accentColor,
              padding: '0 2px'
            }}
          >
            +
          </span>
        </div>
      </div>
    );
  };

  return (
    <aside
      className="glass-panel"
      style={{
        width: '285px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '12px',
        gap: '10px',
        background: 'rgba(10, 15, 26, 0.92)',
        border: '1px solid rgba(56, 189, 248, 0.3)'
      }}
    >
      <div>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.4px' }}>
          💧 CATÁLOGO HIDRÁULICO
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
          Arraste para o diagrama ou clique para inserir
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎 Filtrar chiller, tanques, válvulas, T..."
          style={{
            marginTop: '8px',
            width: '100%',
            padding: '6px 9px',
            borderRadius: '7px',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#f8fafc',
            fontSize: '11px',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '2px' }}>
        {/* 1. Sistema Doblò (Tanques & Bomba) */}
        {filteredSystem.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🚐 Sistema Doblò (Tanques & Bomba)
            </div>
            {filteredSystem.map((tpl) => renderPaletteCard(tpl, '#38bdf8'))}
          </section>
        )}

        {/* 2. Pontos de Água & Esgoto */}
        {filteredPoints.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🚰 Pontos de Água & Esgoto
            </div>
            {filteredPoints.map((tpl) => renderPaletteCard(tpl, '#34d399'))}
          </section>
        )}

        {/* 3. Aquecimento & Chiller de Placas */}
        {filteredHeating.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ♨️ Aquecimento & Chiller de Placas
            </div>
            {filteredHeating.map((tpl) => renderPaletteCard(tpl, '#f97316'))}
          </section>
        )}

        {/* 4. Válvulas, Conexões T & Registros */}
        {filteredValves.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🔧 Válvulas, Conexões T & Registros
            </div>
            {filteredValves.map((tpl) => renderPaletteCard(tpl, '#fb923c'))}
          </section>
        )}

        {/* 4. Customizados */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🧩 Customizados ({customTemplates.length})
            </span>
            <button
              type="button"
              onClick={() => setShowCustomForm((prev) => !prev)}
              style={{
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(192, 132, 252, 0.45)',
                color: '#e9d5ff',
                fontSize: '9.5px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {showCustomForm ? 'Cancelar' : '+ Criar'}
            </button>
          </div>

          {showCustomForm && (
            <form
              onSubmit={handleCreateCustom}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(30, 41, 59, 0.75)',
                border: '1px solid rgba(192, 132, 252, 0.35)'
              }}
            >
              <div style={{ display: 'flex', gap: '5px' }}>
                <input
                  type="text"
                  value={customIcon}
                  onChange={(e) => setCustomIcon(e.target.value)}
                  maxLength={4}
                  style={{
                    width: '36px',
                    textAlign: 'center',
                    padding: '4px',
                    borderRadius: '5px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nome (ex: Boiler 12V)"
                  required
                  style={{
                    flex: 1,
                    padding: '4px 7px',
                    borderRadius: '5px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                <label style={{ fontSize: '9px', color: '#cbd5e1' }}>
                  Vazão (L/m)
                  <input
                    type="number"
                    step="0.5"
                    value={customFlow}
                    onChange={(e) => setCustomFlow(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '2px',
                      padding: '4px',
                      borderRadius: '5px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      color: '#fff',
                      fontSize: '10.5px'
                    }}
                  />
                </label>
                <label style={{ fontSize: '9px', color: '#cbd5e1' }}>
                  Cap. (L)
                  <input
                    type="number"
                    step="1"
                    value={customCap}
                    onChange={(e) => setCustomCap(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '2px',
                      padding: '4px',
                      borderRadius: '5px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      color: '#fff',
                      fontSize: '10.5px'
                    }}
                  />
                </label>
                <label style={{ fontSize: '9px', color: '#cbd5e1' }}>
                  Ø (mm)
                  <input
                    type="number"
                    step="1"
                    value={customDiam}
                    onChange={(e) => setCustomDiam(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '2px',
                      padding: '4px',
                      borderRadius: '5px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      color: '#fff',
                      fontSize: '10.5px'
                    }}
                  />
                </label>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={customIsDrain}
                  onChange={(e) => {
                    setCustomIsDrain(e.target.checked);
                    setCustomDiam(e.target.checked ? '25' : '12');
                  }}
                />
                Linha de Esgoto / Água Cinza
              </label>
              <button
                type="submit"
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                + Adicionar ao Catálogo & Diagrama
              </button>
            </form>
          )}

          {filteredCustom.map((tpl) => renderPaletteCard(tpl, '#c084fc', true))}
        </section>
      </div>
    </aside>
  );
};
