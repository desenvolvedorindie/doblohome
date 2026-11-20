import React, { useState } from 'react';
import {
  ElectricalCatalogTemplate,
  INFRASTRUCTURE_CATALOG
} from '../../types/electricalPlanar';
import {
  buildApplianceTemplate,
  buildCustomTemplate,
  buildSystemFixedTemplates
} from '../../utils/electricalCatalog';
import { useSolar } from '../../context/SolarContext';
import { ConnectorIllustration } from './schematic/ConnectorIllustration';
import { useElectricalIconScale } from './planar/ElectricalIconScaleContext';

interface ElectricalPaletteSidebarProps {
  onAddTemplate: (template: ElectricalCatalogTemplate) => void;
  placedCatalogIds: Set<string>;
  customTemplates: ElectricalCatalogTemplate[];
  onCreateCustomTemplate: (tpl: ElectricalCatalogTemplate) => void;
  onRemoveCustomTemplate: (catalogId: string) => void;
}

export const ElectricalPaletteSidebar: React.FC<ElectricalPaletteSidebarProps> = ({
  onAddTemplate,
  placedCatalogIds,
  customTemplates,
  onCreateCustomTemplate,
  onRemoveCustomTemplate
}) => {
  const {
    energyStats,
    b2bCharger,
    usinaCharger,
    appliances,
    openModal,
    activeBatteryPreset,
    activeMpptPreset,
    activeB2bPreset
  } = useSolar();
  const iconScale = useElectricalIconScale();
  const [search, setSearch] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('🧩');
  const [customVoltage, setCustomVoltage] = useState('12.8');
  const [customWatts, setCustomWatts] = useState('60');
  const [customIsAc, setCustomIsAc] = useState(false);

  const systemTemplates = buildSystemFixedTemplates(
    energyStats,
    b2bCharger,
    usinaCharger,
    activeBatteryPreset,
    activeMpptPreset,
    activeB2bPreset
  );
  const loadTemplates = appliances.map((app) => buildApplianceTemplate(app));

  const q = search.trim().toLowerCase();
  const filterList = (list: ElectricalCatalogTemplate[]) =>
    q
      ? list.filter(
          (t) =>
            t.label.toLowerCase().includes(q) ||
            t.subtitle.toLowerCase().includes(q)
        )
      : list;

  const filteredSystem = filterList(systemTemplates);
  const filteredLoads = filterList(loadTemplates);
  const filteredInfra = filterList(INFRASTRUCTURE_CATALOG);
  const filteredCustom = filterList(customTemplates);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    tpl: ElectricalCatalogTemplate
  ) => {
    e.dataTransfer.setData('application/electrical-template', JSON.stringify(tpl));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const tpl = buildCustomTemplate({
      name: customName,
      icon: customIcon || '🧩',
      voltage: parseFloat(customVoltage) || 12.8,
      watts: parseFloat(customWatts) || 0,
      isAc: customIsAc
    });
    onCreateCustomTemplate(tpl);
    onAddTemplate(tpl);
    setCustomName('');
    setShowCustomForm(false);
  };

  const renderPaletteCard = (
    tpl: ElectricalCatalogTemplate,
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
          {tpl.kind === 'connector' && tpl.connectorType ? (
            <ConnectorIllustration type={tpl.connectorType} size={24} />
          ) : (
            <span style={{ fontSize: `${Math.round(15 * iconScale)}px`, lineHeight: 1 }}>
              {tpl.icon}
            </span>
          )}
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
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '10px 12px',
        gap: '10px',
        background: 'transparent',
      }}
    >
      <div>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.4px' }}>
          ⚡ CATÁLOGO ELÉTRICO
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
          Arraste para o diagrama ou clique para inserir
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎 Filtrar equipamentos, fusíveis..."
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
        {/* 1. Fixos do Sistema */}
        {filteredSystem.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🚐 Sistema Doblò (Fixos)
            </div>
            {filteredSystem.map((tpl) => renderPaletteCard(tpl, '#38bdf8'))}
          </section>
        )}

        {/* 2. Cargas do Editor de Consumo */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🔌 Consumo ({appliances.length})
            </span>
            <button
              type="button"
              onClick={() => openModal('loads')}
              style={{
                background: 'rgba(245, 158, 11, 0.16)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                fontSize: '9.5px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ⚙️ Gerenciar
            </button>
          </div>
          {filteredLoads.length === 0 ? (
            <div style={{ fontSize: '10px', color: '#64748b', padding: '4px 2px' }}>
              Nenhuma carga encontrada.
            </div>
          ) : (
            filteredLoads.map((tpl) => renderPaletteCard(tpl, '#fbbf24'))
          )}
        </section>

        {/* 3. Infraestrutura & Proteção */}
        {filteredInfra.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🧰 Infraestrutura & Proteção
            </div>
            {filteredInfra.map((tpl) => renderPaletteCard(tpl, '#34d399'))}
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
                  placeholder="Nome (ex: Aquecedor Diesel)"
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                <label style={{ fontSize: '9.5px', color: '#cbd5e1' }}>
                  Tensão (V)
                  <input
                    type="number"
                    step="0.1"
                    value={customVoltage}
                    onChange={(e) => setCustomVoltage(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '2px',
                      padding: '4px 6px',
                      borderRadius: '5px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                </label>
                <label style={{ fontSize: '9.5px', color: '#cbd5e1' }}>
                  Potência (W)
                  <input
                    type="number"
                    step="1"
                    value={customWatts}
                    onChange={(e) => setCustomWatts(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '2px',
                      padding: '4px 6px',
                      borderRadius: '5px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                </label>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={customIsAc}
                  onChange={(e) => {
                    setCustomIsAc(e.target.checked);
                    setCustomVoltage(e.target.checked ? '220' : '12.8');
                  }}
                />
                Equipamento AC (Fase + Neutro)
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
