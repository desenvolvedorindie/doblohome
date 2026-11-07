import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const BomModal: React.FC = () => {
  const { activeModal, closeModal, structureMaterial, usinaCharger } = useSolar();

  if (activeModal !== 'bom') return null;

  return (
    <div className="modal-overlay open" onClick={closeModal}>
      <div
        className="modal-window glass-panel"
        style={{ maxWidth: '860px', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">📦 Lista de Materiais e Cortes (BOM)</div>
          <button className="modal-close-btn" onClick={closeModal}>
            &times;
          </button>
        </div>

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

