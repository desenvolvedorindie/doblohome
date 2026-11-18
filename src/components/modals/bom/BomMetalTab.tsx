import React from 'react';
import { getFoldingBracketForHeight, getUpperCabinetClosure } from '../../../types';

interface BomMetalTabProps {
  structureMaterial: string;
  steelProfileUnit: string;
  weldedJointsReport: any;
  barStats: any;
  internalBoxes: any[];
  internalGrid: any;
}

export const BomMetalTab: React.FC<BomMetalTabProps> = ({
  structureMaterial,
  steelProfileUnit,
  weldedJointsReport,
  barStats,
  internalBoxes,
  internalGrid
}) => {
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px', marginTop: '10px' }}>
      <div
        style={{
          marginBottom: '8px',
          padding: '8px 12px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(37, 99, 235, 0.12))',
          borderLeft: '4px solid #38bdf8',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '0.5px',
          color: '#38bdf8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>🔩 FERRAGENS & ESTRUTURA METÁLICA DO RACK (PERFIS, TRILHOS & ACESSÓRIOS)</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#cbd5e1' }}>
          Material: {structureMaterial === 'aluminum' ? 'Alumínio Estrutural T-Slot do Rack' : structureMaterial === 'aluminum_tube' ? 'Alumínio Tubular do Rack' : 'Aço do Rack Soldado'}
        </span>
      </div>

      {/* ─── PAINEL DE PRECIFICAÇÃO POR JUNTA / NÓ (A MÉTRICA DAS QUINAS) ─── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📐</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.3px' }}>
                1. Quantitativo de Juntas/Nós (A métrica das "Quinas")
              </h4>
              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                Mapeamento estrutural de nós de solda e etapas de serralheria automotiva
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '6px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total de Nós:</span>
            <strong style={{ fontSize: '13px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {weldedJointsReport.totalJoints} Quinas Estruturais
            </strong>
          </div>
        </div>

        {/* Texto explicativo fiel à solicitação do usuário */}
        <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.55, color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
          Esta é a abordagem mais precisa se o seu projeto tem muitos recortes e cantos. Cada <strong>"quina"</strong> (o encontro entre dois ou mais tubos) exige um ciclo completo de trabalho: <strong>corte em esquadria (45º ou boca de lobo)</strong>, <strong>esquadrejamento no esquadro magnético</strong>, <strong>ponteamento nas 4 faces</strong>, <strong>solda definitiva</strong> e, o mais demorado, o <strong>lixamento com disco flap</strong>.
        </p>

        {/* As 5 Etapas do Ciclo Completo da Quina */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '6px 8px', borderRadius: '5px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700 }}>ETAPA 1</div>
            <div style={{ fontSize: '10.5px', color: '#f8fafc', fontWeight: 600 }}>✂️ Corte em Esquadria</div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>45° ou boca de lobo</div>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '6px 8px', borderRadius: '5px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700 }}>ETAPA 2</div>
            <div style={{ fontSize: '10.5px', color: '#f8fafc', fontWeight: 600 }}>🧲 Esquadrejamento</div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>Esquadro magnético 90°</div>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '6px 8px', borderRadius: '5px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700 }}>ETAPA 3</div>
            <div style={{ fontSize: '10.5px', color: '#f8fafc', fontWeight: 600 }}>⚡ Ponteamento 4 Faces</div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>Trava anti-deformação</div>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '6px 8px', borderRadius: '5px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700 }}>ETAPA 4</div>
            <div style={{ fontSize: '10.5px', color: '#f8fafc', fontWeight: 600 }}>👨‍🏭 Solda Definitiva</div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>MIG/MAG penetração total</div>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.12)', padding: '6px 8px', borderRadius: '5px', border: '1px solid rgba(56, 189, 248, 0.35)' }}>
            <div style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: 700 }}>ETAPA 5 (DEMORADA)</div>
            <div style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 700 }}>🪚 Disco Flap</div>
            <div style={{ fontSize: '9px', color: '#7dd3fc' }}>Faceamento e plano liso</div>
          </div>
        </div>

        {/* Indicadores Numéricos de Juntas & Quantitativo Total */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', paddingTop: '4px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Total de Quinas / Nós:</span>
            <strong style={{ fontSize: '16px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {weldedJointsReport.totalJoints} quinas
            </strong>
            <div style={{ fontSize: '9.5px', color: '#cbd5e1', marginTop: '2px' }}>
              {weldedJointsReport.miterCorners45} quinas 45° · {weldedJointsReport.teeJoints} em T · {weldedJointsReport.mountBracketsJoints} sapatas
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Distribuição por Estrutura:</span>
            <div style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
              Rack: <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.breakdown.rackBase.total}</strong> · Bandejas: <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.breakdown.solarTrays.total}</strong> · Baú: <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.breakdown.cargoSubchassis.total}</strong>
            </div>
            <div style={{ fontSize: '9.5px', color: '#cbd5e1', marginTop: '2px' }}>
              {weldedJointsReport.breakdown.solarTrays.traysCount} bandejas móveis ({weldedJointsReport.breakdown.solarTrays.miter45} quinas 45° + {weldedJointsReport.breakdown.solarTrays.tee} em T)
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Consumíveis Estimados (Quantidade):</span>
            <div style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
              📦 ~{weldedJointsReport.consumables.cuttingDiscs4Half} cortes 4 ½" · ~{weldedJointsReport.consumables.flapDiscsGrinding + weldedJointsReport.consumables.flapDiscsFinishing} flaps
            </div>
            <div style={{ fontSize: '9.5px', color: '#cbd5e1', marginTop: '2px' }}>
              ⚡ ~{weldedJointsReport.consumables.migWireKg} kg arame MIG · 4 esquadros magnéticos
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Totalizadora Agrupada por Espessura dos Tubos */}
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
          color: 'var(--primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>📊 RESUMO TOTALIZADOR AGRUPADO POR ESPESSURA DOS TUBOS</span>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
          Separado por bitola comercial para compras e regulagem de solda
        </span>
      </div>
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
          {barStats.thicknessGroups.map((grp: any) => (
            <React.Fragment key={grp.groupTitle}>
              {/* Cabeçalho do Grupo de Espessura */}
              <tr style={{ background: 'rgba(30, 41, 59, 0.95)', borderTop: '2px solid rgba(56, 189, 248, 0.4)' }}>
                <td colSpan={6} style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div>
                      <strong style={{ color: '#38bdf8', fontSize: '11.5px' }}>{grp.groupTitle}</strong>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>{grp.groupSubtitle}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: '#cbd5e1' }}><strong>{grp.totalPieces}</strong> cortes</span>
                      <span style={{ color: '#34d399' }}><strong>{grp.totalMeters.toFixed(2)}</strong> m</span>
                      <span style={{ color: '#fbbf24' }}><strong>{grp.totalBars6m}</strong> barra(s) 6m</span>
                    </div>
                  </div>
                </td>
              </tr>

              {/* Linhas de Perfis deste Grupo */}
              {grp.profiles.map((p: any) => (
                <tr key={p.profileSpec}>
                  <td style={{ paddingLeft: '18px' }}>
                    <strong style={{ color: '#f8fafc' }}>{p.profileSpec}</strong>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>{p.pieces} un</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(p.totalMeters * 1000).toLocaleString('pt-BR')} mm</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399' }}>{p.totalMeters.toFixed(2)} m</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
                    {p.profileSpec.includes('T-Slot') || p.profileSpec.includes('Metalon') || p.profileSpec.includes('Tubo') ? `${p.bars6m} barra(s)` : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                    {p.profileSpec.includes('T-Slot') || p.profileSpec.includes('Metalon') || p.profileSpec.includes('Tubo') ? `${p.bars3m} barra(s)` : '—'}
                  </td>
                </tr>
              ))}

              {/* Linha de Subtotal da Espessura */}
              <tr style={{ background: 'rgba(15, 23, 42, 0.55)', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', fontSize: '10.5px' }}>
                <td style={{ paddingLeft: '18px', color: '#94a3b8', fontStyle: 'italic' }}>
                  Subtotal Espessura {grp.thicknessLabel} ({grp.gaugeLabel})
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>{grp.totalPieces} un</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>{Math.round(grp.totalMeters * 1000).toLocaleString('pt-BR')} mm</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399' }}>{grp.totalMeters.toFixed(2)} m</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>{grp.totalBars6m} barra(s)</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{grp.totalBars3m} barra(s)</td>
              </tr>
            </React.Fragment>
          ))}

          {/* TOTAL GERAL */}
          <tr style={{ background: 'rgba(16, 185, 129, 0.15)', fontWeight: 800, borderTop: '2px solid #10b981' }}>
            <td style={{ color: '#34d399' }}>TOTAL GERAL DE TODAS AS ESPESSURAS</td>
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

      {/* Tabela Completa de Cortes de Barras Agrupada por Espessura */}
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
          color: 'var(--primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>📏 LISTA DE CORTES DO RACK ({barStats.totalPieces} PEÇAS AGRUPADAS POR ESPESSURA)</span>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Separado por tubo e bitola</span>
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
          {barStats.cutThicknessGroups.map((section: any) => (
            <React.Fragment key={section.groupTitle}>
              <tr style={{ background: 'rgba(30, 41, 59, 0.90)', borderTop: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <td colSpan={6} style={{ padding: '6px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ color: '#38bdf8', fontSize: '11px' }}>{section.groupTitle}</strong>
                    <span style={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                      {section.totalPieces} peças · {section.totalMeters.toFixed(2)} m
                    </span>
                  </div>
                </td>
              </tr>

              {section.items.map((g: any, idx: number) => (
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
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Acessórios Mecânicos e Ferragens de Montagem */}
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
        ⚙️ FERRAGENS & ACESSÓRIOS MECÂNICOS
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
            <td><strong>Ponteiras Plásticas para Metalon 40×40 mm (CAPs c/ Aletas)</strong></td>
            <td>Polietileno PEAD preto de alta densidade · aba de acabamento 4 mm · encaixe 16 mm c/ 3 aletas flexíveis de pressão anti-recuo · compatível c/ tubo 40×40 mm</td>
            <td>{barStats?.metalonCaps ? barStats.metalonCaps.filter((c: any) => c.sizeSpec === '40x40').reduce((acc: number, c: any) => acc + c.qty, 0) : 4} un</td>
            <td>Vedação estanque contra água de chuva nas longarinas do rack base (e baú), proteção anti-corte e acabamento estético</td>
          </tr>
          <tr>
            <td><strong>Ponteiras Plásticas para Metalon 30×30 mm (CAPs c/ Aletas)</strong></td>
            <td>Polietileno PEAD preto · aba 3.5 mm · encaixe 16 mm c/ aletas flexíveis · compatível c/ tubo 30×30 mm</td>
            <td>{barStats?.metalonCaps?.find((c: any) => c.sizeSpec === '30x30')?.qty || 4} un</td>
            <td>Fechamento e proteção das extremidades abertas das travessas superiores e tubos 30×30</td>
          </tr>
          <tr>
            <td><strong>Sistema Deslizante: Perfil Alumínio + Parafusos Guia</strong></td>
            <td>Parafusos M8 Inox flangeados + arruelas/buchas deslizantes de Nylon/Teflon entre 2 perfis de alumínio (sem corrediças metálicas)</td>
            <td>4–8 parafusos guia M8 c/ porcas auto-travantes e arruelas deslizantes</td>
            <td>Deslizamento suave e livre de oxidação no rack de teto (elimina risco de emperramento por poeira/lama)</td>
          </tr>
          <tr>
            <td><strong>Cantoneiras T-Slot / Esquadros Metalon</strong></td>
            <td>AL fundido 2020/3030 ou cantoneira aço estampada</td>
            <td>~24 un</td>
            <td>Conexão de perfis estruturais em ângulo 90°</td>
          </tr>
          {internalBoxes.filter((b) => b.rearFoldShelf).map((b) => {
            const bracketSpec = getFoldingBracketForHeight(b.heightMm, b.rearShelfBracketInches, b.rearShelfDepthMm);
            return (
              <tr key={`shelf-bracket-${b.id}`}>
                <td><strong>Suporte Articulado Dobrável Inox c/ Trava {bracketSpec.inches}" ({bracketSpec.lengthMm} mm) (Par 2PCS)</strong></td>
                <td>Aço inoxidável escovado reforçado · canaletas estampadas em U · trava mecânica automática 90° c/ haste diagonal e gatilho de liberação rápida · carga até {bracketSpec.maxLoadKg} kg · compatível c/ altura de {b.heightMm} mm ({b.name})</td>
                <td>1 par</td>
                <td>Sustentação mecânica de alta resistência da mesa/prateleira rebatível traseira (substitui pistão a gás)</td>
              </tr>
            );
          })}
          {internalBoxes.some((b) => b.type === 'slide_tray' || b.drawerMode === 'slide_tray') && (
            <tr>
              <td><strong>Corrediças Telescópicas Reforçadas 45kg c/ Trava (Par)</strong></td>
              <td>Aço zincado pesado · trava de fechamento e abertura · extensão total</td>
              <td>{internalBoxes.filter((b) => b.type === 'slide_tray' || b.drawerMode === 'slide_tray').length} par(es)</td>
              <td>Deslizamento e trava segura da gaveta/bandeja corrediça inferior</td>
            </tr>
          )}
          {internalBoxes.some((b) => b.upperCabinet && getUpperCabinetClosure(b) === 'sliding_doors') && (
            <>
              <tr>
                <td><strong>Kit Trilho Duplo Alumínio Superior/Inferior p/ Portas de Correr</strong></td>
                <td>Perfil de alumínio anodizado duplo · canaletas com guia suave e batentes</td>
                <td>{internalBoxes.filter((b) => b.upperCabinet && getUpperCabinetClosure(b) === 'sliding_doors').length} kit(s)</td>
                <td>Guia e deslizamento horizontal das 2 folhas das portas de correr dos armários aéreos</td>
              </tr>
              <tr>
                <td><strong>Puxadores Concha Embutidos Náuticos (Par)</strong></td>
                <td>ABS cromado/metálico faceado · design embutido (livre de colisão no transpasse)</td>
                <td>{internalBoxes.filter((b) => b.upperCabinet && getUpperCabinetClosure(b) === 'sliding_doors').length} par(es)</td>
                <td>Puxadores concha embutidos para abertura das folhas corrediças do armário aéreo</td>
              </tr>
              <tr>
                <td><strong>Trava Náutica Trava-Porta de Correr</strong></td>
                <td>Aço cromado/ABS · trava de segurança contra abertura acidental em curvas e frenagens</td>
                <td>{internalBoxes.filter((b) => b.upperCabinet && getUpperCabinetClosure(b) === 'sliding_doors').length} un</td>
                <td>Trava náutica anti-abertura para as portas de correr do armário aéreo</td>
              </tr>
            </>
          )}
          {internalBoxes.some((b) => b.upperCabinet && getUpperCabinetClosure(b) === 'doors') && (
            <tr>
              <td><strong>Botão Trava Push-Lock Náutico Cromado</strong></td>
              <td>Liga de zinco e ABS · trava push-button anti-abertura em curvas e frenagens</td>
              <td>{internalBoxes.filter((b) => b.upperCabinet && getUpperCabinetClosure(b) === 'doors').length} un</td>
              <td>Fechamento e trava de segurança marítima das portas basculantes dos armários aéreos</td>
            </tr>
          )}
          {internalGrid.centralTable?.enabled && (
            <tr>
              <td><strong>Pedestal Tubular Central Náutico c/ Flange de Piso e Braçadeiras (Mesa Dinette)</strong></td>
              <td>Flange circular de piso Ø160mm fixada diretamente no assoalho · coluna tubular de aço preto acetinado Ø45mm · 2 braçadeiras de fixação rápida c/ manípulo lever · flange superior náutica de encaixe</td>
              <td>1 kit</td>
              <td>Coluna central de apoio da mesa dinette regulável em altura (35-85cm), rotação 360°, deslocável em X/Z e 100% removível do assoalho</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
