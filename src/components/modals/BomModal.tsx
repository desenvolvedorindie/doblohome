import React, { useMemo } from 'react';
import { useSolar } from '../../context/SolarContext';

interface BarCutGroup {
  key: string;
  label: string;
  profileSpec: string;
  lengthMm: number;
  lengthM: number;
  qty: number;
  totalLengthM: number;
}

interface ProfileSummary {
  profileSpec: string;
  pieces: number;
  totalMeters: number;
  bars6m: number;
  bars3m: number;
}

export const BomModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    structureMaterial,
    steelProfileUnit,
    usinaCharger,
    sceneManager,
    stackLevels,
    level1,
    level2,
    cargoBox,
    activePanelPreset,
    setViewMode,
    waterTank
  } = useSolar();

  const pipeRadiusMm = Math.round(waterTank.diameterMm / 2);
  const pipeRadiusDm = pipeRadiusMm / 100;
  const singlePipeLiters = +(Math.PI * pipeRadiusDm * pipeRadiusDm * (waterTank.lengthMm / 100)).toFixed(1);
  const totalWaterLiters = +(singlePipeLiters * 2).toFixed(1);

  const barStats = useMemo(() => {
    const groupsMap = new Map<string, BarCutGroup>();
    const profileMap = new Map<string, ProfileSummary>();
    let totalPieces = 0;
    let totalMeters = 0;

    if (sceneManager && sceneManager.solarSystem) {
      const cargoDisabled = !sceneManager.solarSystem.cargoBoxConfig?.enabled;
      const cargoGroup = sceneManager.solarSystem.cargoBoxSystem?.group;

      sceneManager.solarSystem.group.traverse((obj: any) => {
        if (!obj.isMesh || !obj.userData || !obj.userData.isBar) return;

        if (cargoDisabled && cargoGroup) {
          let p = obj.parent;
          while (p) {
            if (p === cargoGroup) return;
            p = p.parent;
          }
        }

        const lengthM = Number(obj.userData.barLength) || 0;
        const lengthMm = Math.round(lengthM * 1000);
        const rawLabel = String(obj.userData.barLabel || 'Barra Estrutural')
          .replace(/\s*\(#\d+\)/g, '')
          .trim();
        const profileSpec = String(obj.userData.profileSpec || 'Perfil Estrutural');

        totalPieces += 1;
        totalMeters += lengthM;

        const key = `${profileSpec}__${rawLabel}__${lengthMm}`;
        const existing = groupsMap.get(key);
        if (existing) {
          existing.qty += 1;
          existing.totalLengthM += lengthM;
        } else {
          groupsMap.set(key, {
            key,
            label: rawLabel,
            profileSpec,
            lengthMm,
            lengthM,
            qty: 1,
            totalLengthM: lengthM
          });
        }

        const pSum = profileMap.get(profileSpec);
        if (pSum) {
          pSum.pieces += 1;
          pSum.totalMeters += lengthM;
        } else {
          profileMap.set(profileSpec, {
            profileSpec,
            pieces: 1,
            totalMeters: lengthM,
            bars6m: 0,
            bars3m: 0
          });
        }
      });
    }

    const cutGroups = Array.from(groupsMap.values()).sort((a, b) => {
      if (b.lengthMm !== a.lengthMm) return b.lengthMm - a.lengthMm;
      return a.label.localeCompare(b.label);
    });

    const profileSummaries = Array.from(profileMap.values())
      .map((p) => ({
        ...p,
        // Considera 5% de perda de serra/corte para estimativa de barras comerciais de 6m e 3m
        bars6m: Math.max(1, Math.ceil((p.totalMeters * 1.05) / 6.0)),
        bars3m: Math.max(1, Math.ceil((p.totalMeters * 1.05) / 3.0))
      }))
      .sort((a, b) => b.totalMeters - a.totalMeters);

    const totalBars6m = profileSummaries
      .filter((p) => p.profileSpec.includes('T-Slot') || p.profileSpec.includes('Metalon'))
      .reduce((acc, p) => acc + p.bars6m, 0);

    return {
      totalPieces,
      totalMeters,
      totalBars6m,
      cutGroups,
      profileSummaries
    };
}, [sceneManager, activeModal, structureMaterial, steelProfileUnit, stackLevels, level1, level2, cargoBox, activePanelPreset]);

if (activeModal !== 'bom') return null;

return (
  <div className="modal-overlay open" onClick={closeModal}>
    <div
      className="modal-window glass-panel"
      style={{ maxWidth: '920px', maxHeight: '90vh', overflowY: 'auto' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <div className="modal-title">📦 Lista de Materiais, Plano de Corte e Totalizador de Barras</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-compact primary"
            onClick={() => {
              closeModal();
              setViewMode('bars_lineup');
            }}
            style={{
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 800,
              background: 'rgba(16, 185, 129, 0.2)',
              borderColor: '#10b981',
              color: '#34d399'
            }}
          >
            📏 Ver Barras Lado a Lado no 3D
          </button>
          <button className="modal-close-btn" onClick={closeModal}>
            &times;
          </button>
        </div>
      </div>

      {/* ─── TOTALIZADOR GERAL DE BARRAS (DINÂMICO DA CENA 3D) ─── */}
      <div
        style={{
          marginBottom: '6px',
          padding: '7px 10px',
          background: 'rgba(16, 185, 129, 0.14)',
          borderLeft: '3px solid #10b981',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.5px',
          color: '#34d399',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>📊 TOTALIZADOR GERAL DE BARRAS (CONFIGURAÇÃO ATUAL EM TEMPO REAL)</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
          Material: {structureMaterial === 'aluminum' ? 'Alumínio Estrutural T-Slot' : 'Aço Metalon Soldado'}
        </span>
      </div>

      {/* Cards de Totais */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginBottom: '14px'
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '8px',
            padding: '10px 12px'
          }}
        >
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            Total de Barras (Peças)
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {barStats.totalPieces} <span style={{ fontSize: '12px', fontWeight: 600 }}>un</span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Todas as barras e trilhos</div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '8px',
            padding: '10px 12px'
          }}
        >
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            Metragem Linear Total
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {barStats.totalMeters.toFixed(2)} <span style={{ fontSize: '12px', fontWeight: 600 }}>m</span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            {Math.round(barStats.totalMeters * 1000).toLocaleString('pt-BR')} mm acumulados
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '8px',
            padding: '10px 12px'
          }}
        >
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            Barras Comerciais (6m)
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {barStats.totalBars6m} <span style={{ fontSize: '12px', fontWeight: 600 }}>barras 6m</span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Perfis 40×40 + 30×30 (+5% corte)</div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: '8px',
            padding: '10px 12px'
          }}
        >
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            Medidas Diferentes
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {barStats.cutGroups.length} <span style={{ fontSize: '12px', fontWeight: 600 }}>cortes</span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Agrupados por função/medida</div>
        </div>
      </div>

      {/* Tabela Totalizadora por Tipo de Perfil */}
      <table className="bom-table" style={{ marginBottom: '16px' }}>
        <thead>
          <tr>
            <th>Especificação do Perfil / Material</th>
            <th>Qtd. Peças</th>
            <th>Total Linear (mm)</th>
            <th>Total Linear (m)</th>
            <th>Equiv. Barras 6m</th>
            <th>Equiv. Barras 3m</th>
          </tr>
        </thead>
        <tbody>
          {barStats.profileSummaries.map((p) => (
            <tr key={p.profileSpec}>
              <td>
                <strong style={{ color: '#f8fafc' }}>{p.profileSpec}</strong>
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>{p.pieces} un</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(p.totalMeters * 1000).toLocaleString('pt-BR')} mm</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399' }}>{p.totalMeters.toFixed(2)} m</td>
              <td style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
                {p.profileSpec.includes('T-Slot') || p.profileSpec.includes('Metalon') ? `${p.bars6m} barra(s)` : '—'}
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                {p.profileSpec.includes('T-Slot') || p.profileSpec.includes('Metalon') ? `${p.bars3m} barra(s)` : '—'}
              </td>
            </tr>
          ))}
          <tr style={{ background: 'rgba(16, 185, 129, 0.12)', fontWeight: 800 }}>
            <td style={{ color: '#34d399' }}>TOTAL GERAL DE BARRAS</td>
            <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{barStats.totalPieces} un</td>
            <td style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
              {Math.round(barStats.totalMeters * 1000).toLocaleString('pt-BR')} mm
            </td>
            <td style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>{barStats.totalMeters.toFixed(2)} m</td>
            <td style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>{barStats.totalBars6m} barra(s) 6m</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {/* Tabela Completa de Cortes Ordenada da Maior para a Menor Barra */}
      <div
        style={{
          marginBottom: '6px',
          padding: '7px 10px',
          background: 'rgba(56, 189, 248, 0.12)',
          borderLeft: '3px solid var(--primary)',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: 'var(--primary)'
        }}
      >
        📏 PLANO DE CORTE DETALHADO — ORDENADO DA MAIOR PARA A MENOR BARRA ({barStats.totalPieces} PEÇAS)
      </div>
      <table className="bom-table" style={{ marginBottom: '18px' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Peça / Função na Estrutura</th>
            <th>Perfil</th>
            <th>Medida Unit.</th>
            <th>Qtd</th>
            <th>Subtotal Linear</th>
          </tr>
        </thead>
        <tbody>
          {barStats.cutGroups.map((g, idx) => (
            <tr key={g.key}>
              <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>{idx + 1}</td>
              <td>
                <strong>{g.label}</strong>
              </td>
              <td style={{ fontSize: '11px', color: '#94a3b8' }}>{g.profileSpec}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                {structureMaterial === 'steel' && steelProfileUnit === 'inch' ? (
                  <>
                    {(g.lengthM * 39.3701).toFixed(1)}" <span style={{ color: '#64748b', fontWeight: 400 }}>({g.lengthMm.toLocaleString('pt-BR')} mm)</span>
                  </>
                ) : (
                  <>
                    {g.lengthMm.toLocaleString('pt-BR')} mm <span style={{ color: '#64748b', fontWeight: 400 }}>({(g.lengthM * 100).toFixed(1)} cm)</span>
                  </>
                )}
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{g.qty} un</td>
              <td style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 700 }}>
                {g.totalLengthM.toFixed(2)} m
              </td>
            </tr>
          ))}
          <tr style={{ background: 'rgba(56, 189, 248, 0.12)', fontWeight: 800 }}>
            <td colSpan={4} style={{ textAlign: 'right', color: '#38bdf8' }}>
              SOMA TOTAL DE TODAS AS BARRAS:
            </td>
            <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{barStats.totalPieces} un</td>
            <td style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>{barStats.totalMeters.toFixed(2)} m</td>
          </tr>
        </tbody>
      </table>

      {/* SEÇÃO 1: Painéis e Componentes */}
      <div
        style={{
          marginBottom: '6px',
          padding: '7px 10px',
          background: 'rgba(14,165,233,0.12)',
          borderLeft: '3px solid var(--primary)',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: 'var(--primary)'
        }}
      >
        ☀️ PAINÉIS E COMPONENTES ELÉTRICOS
      </div>
      <table className="bom-table" style={{ marginBottom: '16px' }}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Descrição / Medida</th>
            <th>Qtd</th>
            <th>Finalidade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Painel Solar Flexível 100W</strong></td>
            <td>60 cm × 1.00 m · 3 mm esp. · 1,6 kg · Voc 22,28 V</td>
            <td>2–8 un</td>
            <td>Geração fotovoltaica monocristalina no stack</td>
          </tr>
          <tr>
            <td><strong>Bateria LiFePO4 Kingbo 560Ah</strong></td>
            <td>KINGBO MB12560 · 12,8 V · 560 Ah · 7,168 kWh · JK BMS 4.3"</td>
            <td>1 un</td>
            <td>Armazenamento de energia de altíssima autonomia</td>
          </tr>
          <tr>
            <td><strong>Controlador MPPT Kingbo 60A</strong></td>
            <td>230Vdc entrada FV · 12–96V bat · RS485+WiFi · 202×215×100 mm · 1,95 kg</td>
            <td>1 un</td>
            <td>Regulação e rastreamento MPPT dos painéis para a bateria LiFePO4</td>
          </tr>
          <tr>
            <td><strong>Carregador DC-DC B2B1230</strong></td>
            <td>12V 30A (390W) · Alternador Doblò → LiFePO4 · Bluetooth 5.0 integrado · Pino D+</td>
            <td>1 un</td>
            <td>Carga rápida da bateria pelo alternador do carro em viagens e dias nublados</td>
          </tr>
          <tr>
            <td><strong>Cabos de Força B2B 16mm²</strong></td>
            <td>Cabo automotivo flexível 16 mm² (vermelho/preto) + Fusíveis 50A</td>
            <td>8 m</td>
            <td>Ligação do alternador/bateria de partida ao B2B1230 e bateria LiFePO4</td>
          </tr>
          <tr>
            <td><strong>Fonte Carregador Usina {usinaCharger.modelRating}A</strong></td>
            <td>Smart Connect Bivolt 100–250V · Saída 12,5V–14,4V · {usinaCharger.modelRating}A ({Math.round(usinaCharger.modelRating * 14.4)}W) · Linha 70A/120A/150A/200A</td>
            <td>1 un</td>
            <td>Recarga rápida da bateria Kingbo LiFePO4 em camping/rede externa ({usinaCharger.modelRating}A nominais)</td>
          </tr>
          <tr>
            <td><strong>Cabos de Força Usina ({usinaCharger.modelRating >= 200 ? '50mm²' : usinaCharger.modelRating >= 150 ? '35mm²' : usinaCharger.modelRating >= 120 ? '25mm²' : '16mm²'})</strong></td>
            <td>Cabo flexível cobre alta condução + Terminal olhal estanhado reforçado</td>
            <td>3 m</td>
            <td>Conexão dos bornes da Usina {usinaCharger.modelRating}A à barra de distribuição da bateria LiFePO4</td>
          </tr>
          <tr>
            <td><strong>Entrada Shore Power Externa</strong></td>
            <td>Tomada industrial externa 20A 250V + Plugue fêmea com tampa naval</td>
            <td>1 un</td>
            <td>Ponto de conexão externa na lataria da Doblò para conexão em tomadas de camping</td>
          </tr>
          <tr>
            <td><strong>Cabo Solar Fotovoltaico</strong></td>
            <td>6 mm² flexível · dupla capa UV · MC4</td>
            <td>15 m</td>
            <td>Conexão placas → controlador MPPT</td>
          </tr>
          <tr>
            <td><strong>Fixadores de Ilhoses (Olhais)</strong></td>
            <td>Presilhas AL + Parafusos Allen M6 inox + arruelas</td>
            <td>6 un/painel</td>
            <td>Fixação nos olhais metálicos do laminado flexível</td>
          </tr>
          {waterTank.enabled && (
            <>
              <tr style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
                <td><strong style={{ color: '#38bdf8' }}>💧 Tubos PVC R={pipeRadiusMm}mm / Ø{waterTank.diameterMm}mm (Caixa d'Água Lateral)</strong></td>
                <td>
                  Cano PVC Série R / Esgoto Reforçado Raio <strong>{pipeRadiusMm}mm</strong> (Ø{waterTank.diameterMm}mm) × <strong>{waterTank.lengthMm} mm</strong> ({(waterTank.lengthMm / 1000).toFixed(2)} m cada) ·{' '}
                  <strong>{singlePipeLiters.toFixed(1)} L/cano ({totalWaterLiters.toFixed(1)} L total)</strong>
                </td>
                <td>2 un</td>
                <td>Reservatório de água lateral (1 do lado motorista + 1 do lado passageiro, máx. base 2200 mm)</td>
              </tr>
              <tr style={{ background: 'rgba(14, 165, 233, 0.06)' }}>
                <td><strong>Tampões (Caps) PVC Ø{waterTank.diameterMm}mm + Anel Vedação</strong></td>
                <td>Cap PVC Ø{waterTank.diameterMm}mm (Raio {pipeRadiusMm}mm) com anel de borracha + adesivo PVC + bocal sup. 50mm + registro esfera 1/2"</td>
                <td>4 caps + 2 kits</td>
                <td>Vedação das 4 pontas dos canos de Ø{waterTank.diameterMm}mm, abastecimento superior e torneira traseira</td>
              </tr>
              <tr style={{ background: 'rgba(14, 165, 233, 0.06)' }}>
                <td><strong>Abraçadeiras Tipo U / Cinta Inox Ø{waterTank.diameterMm}mm</strong></td>
                <td>Cinta de aço inox 304 com borracha EPDM + parafusos M8 para perfil estrutural 40×40</td>
                <td>{waterTank.lengthMm >= 1600 ? '6 un' : '4 un'}</td>
                <td>Fixação lateral dos 2 tubos cheios (~{totalWaterLiters.toFixed(0)} kg de água) nas longarinas da base</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {/* SEÇÃO 2: Lista de Barras de Alumínio / Metalon */}
      <div
        style={{
          marginBottom: '6px',
          padding: '7px 10px',
          background: 'rgba(14,165,233,0.12)',
          borderLeft: '3px solid var(--primary)',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: 'var(--primary)'
        }}
      >
        🔩 LISTA DE BARRAS — PERFIL {structureMaterial === 'aluminum' ? 'ALUMÍNIO T-SLOT 40×40' : 'METALON 40×40'} (RACK BASE)
      </div>
      <table className="bom-table" style={{ marginBottom: '16px' }}>
        <thead>
          <tr>
            <th>Peça</th>
            <th>Comprimento</th>
            <th>Qtd</th>
            <th>Finalidade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Longarina Lateral do Rack</strong></td>
            <td>2.200 mm</td>
            <td>2 un</td>
            <td>Longarinas principais ao longo do teto (220 cm)</td>
          </tr>
          <tr>
            <td><strong>Travessa Transversal Base</strong></td>
            <td>1.320 mm</td>
            <td>4 un</td>
            <td>Travessas frontal, traseira e meio do rack base</td>
          </tr>
          <tr>
            <td><strong>Longarina Central de Apoio</strong></td>
            <td>~460 mm</td>
            <td>6 un</td>
            <td>Leito interno das gavetas (3 vãos × 2 lados)</td>
          </tr>
        </tbody>
      </table>

      <div
        style={{
          marginBottom: '6px',
          padding: '7px 10px',
          background: 'rgba(14,165,233,0.12)',
          borderLeft: '3px solid var(--primary)',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: 'var(--primary)'
        }}
      >
        🔩 LISTA DE BARRAS — PERFIL {structureMaterial === 'aluminum' ? 'T-SLOT 30×30' : 'METALON 30×30'} (BANDEJAS E PILARES)
      </div>
      <table className="bom-table" style={{ marginBottom: '16px' }}>
        <thead>
          <tr>
            <th>Peça</th>
            <th>Comprimento</th>
            <th>Qtd</th>
            <th>Finalidade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Longarina Lateral da Bandeja N1</strong></td>
            <td>~1.100 mm</td>
            <td>2 un</td>
            <td>Longarinas do quadro do Nível 1 (inferior)</td>
          </tr>
          <tr>
            <td><strong>Travessa Front./Tras. Bandeja N1</strong></td>
            <td>~1.250 mm</td>
            <td>2 un</td>
            <td>Travessas do quadro do Nível 1</td>
          </tr>
          <tr>
            <td><strong>Longarina Lateral da Bandeja N2</strong></td>
            <td>~1.100 mm</td>
            <td>2 un</td>
            <td>Longarinas do quadro do Nível 2 (superior fixo)</td>
          </tr>
          <tr>
            <td><strong>Travessa Front./Tras. Bandeja N2</strong></td>
            <td>~1.250 mm</td>
            <td>2 un</td>
            <td>Travessas do quadro do Nível 2</td>
          </tr>
          <tr>
            <td><strong>Pilar de Sustentação Vertical</strong></td>
            <td>~130 mm</td>
            <td>4 un</td>
            <td>Pilares que elevam o Nível 2 sobre o Nível 1</td>
          </tr>
          <tr>
            <td><strong>Braço de Topo (Desvio do Pilar)</strong></td>
            <td>~20 a 50 mm</td>
            <td>4 un</td>
            <td>Braços horizontais de união entre pilares e longarinas de topo</td>
          </tr>
          <tr>
            <td><strong>Longarina Superior Contínua</strong></td>
            <td>~1.270 mm</td>
            <td>2 un</td>
            <td>Longarinas topo que unem os pilares (E/D)</td>
          </tr>
          <tr>
            <td><strong>Travessa Transversal Superior</strong></td>
            <td>~1.280 mm</td>
            <td>2 un</td>
            <td>Travessas de topo (dianteira e traseira)</td>
          </tr>
        </tbody>
      </table>

      {/* SEÇÃO 3: Acessórios Mecânicos */}
      <div
        style={{
          marginBottom: '6px',
          padding: '7px 10px',
          background: 'rgba(14,165,233,0.12)',
          borderLeft: '3px solid var(--primary)',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          color: 'var(--primary)'
        }}
      >
        ⚙️ ACESSÓRIOS MECÂNICOS
      </div>
      <table className="bom-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Descrição / Medida</th>
            <th>Qtd</th>
            <th>Finalidade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Trilho Telescópico Heavy Duty</strong></td>
            <td>Corrediça aço zincado/inox · curso 900 mm · 80–120 kg</td>
            <td>2–4 pares</td>
            <td>Guias para expansão suave das gavetas</td>
          </tr>
          <tr>
            <td><strong>Esteira Porta-Cabos (Lagarta)</strong></td>
            <td>Nylon articulado 15×30 mm · R38 · ~1 m cada</td>
            <td>2 un</td>
            <td>Proteção dos fios contra fricção e vento</td>
          </tr>
          <tr>
            <td><strong>Defletor Aerodinâmico</strong></td>
            <td>Acrílico fumê 4 mm ou chapa AL · 1.360 × 160 mm</td>
            <td>1 un</td>
            <td>Corta-vento frontal — reduz ruído de arrasto</td>
          </tr>
          <tr>
            <td><strong>Travas Mecânicas</strong></td>
            <td>Pinos de engate rápido / fecho de pressão inox</td>
            <td>2–4 un</td>
            <td>Segurança obrigatória para circulação em rodovia</td>
          </tr>
          <tr>
            <td><strong>Cantoneiras T-Slot (Brackets)</strong></td>
            <td>AL fundido 2020/3030 · parafuso M5 Allen inox</td>
            <td>~24 un</td>
            <td>Conexão de perfis em ângulo 90°</td>
          </tr>
          <tr>
            <td><strong>Porcas de Encaixe T (T-nuts)</strong></td>
            <td>M5 / M6 para ranhura T-slot 40 e 30</td>
            <td>~60 un</td>
            <td>Fixação de componentes nas ranhuras dos perfis</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);
};

