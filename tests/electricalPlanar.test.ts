import { describe, it, expect } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import {
  ElectricalEdgeData,
  ElectricalNodeData,
  INFRASTRUCTURE_CATALOG,
  buildFuseBoxPorts,
  buildBusbarPorts,
  getFuseColorSpec
} from '../src/types/electricalPlanar';
import {
  arePolaritiesCompatible,
  calculateWireSpecs,
  recalculateDiagramEdges,
  calculateElectricalBom,
  syncFuseBoxNodePorts,
  validateElectricalConnection
} from '../src/utils/electricalCalculations';
import {
  buildApplianceTemplate,
  buildSystemFixedTemplates,
  templateToNodeData
} from '../src/utils/electricalCatalog';

describe('Planejador Elétrico Planar (2D)', () => {
  it('calcula bitola sugerida, queda de tensão e alerta de sobrecarga corretamente', () => {
    const okCalc = calculateWireSpecs({
      currentAmps: 5,
      voltage: 12.8,
      lengthMeters: 2.5,
      polarity: 'pos'
    });
    expect(okCalc.suggestedGaugeMm2).toBe(1.5);
    expect(okCalc.isOverloaded).toBe(false);
    expect(okCalc.suggestedProtectionAmps).toBe(10);

    // Sobrecarga: cabo manual 1.5mm² com 30A
    const overloaded = calculateWireSpecs({
      currentAmps: 30,
      voltage: 12.8,
      lengthMeters: 2,
      polarity: 'pos',
      isManualGauge: true,
      manualGaugeMm2: 1.5
    });
    expect(overloaded.isOverloaded).toBe(true);
    expect(overloaded.overloadWarning).toContain('1.5mm²');

    // Sobrecarga por fusível menor que a carga
    const fuseOverloaded = calculateWireSpecs({
      currentAmps: 15,
      voltage: 12.8,
      lengthMeters: 1.5,
      polarity: 'pos',
      connectedFuseAmps: 10
    });
    expect(fuseOverloaded.isOverloaded).toBe(true);
    expect(fuseOverloaded.overloadWarning).toContain('fusível de 10A');
  });

  it('propaga correntes através da Caixa de Fusíveis, Barramento e Bateria e gera BOM completo', () => {
    const fuseBoxTpl = INFRASTRUCTURE_CATALOG.find((t) => t.catalogId === 'fuse_box_12')!;
    const busbarPosTpl = INFRASTRUCTURE_CATALOG.find((t) => t.catalogId === 'busbar_pos')!;
    const sysTemplates = buildSystemFixedTemplates(
      {
        nominalPowerW: 600,
        effectiveWatts: 500,
        dailyKWh: 2.5,
        panelCount: 6,
        efficiencyPercent: 83,
        systemVoltage: 24,
        mpptCurrentAmps: 40,
        voc: '44.56',
        level1Panels: 4,
        level2Panels: 2,
        stackLevels: 2
      },
      {
        enabled: true,
        isEngineRunning: false,
        engineHoursPerDay: 1,
        chargingAmps: 30,
        voltageIn: 14.2,
        voltageOut: 14.4,
        watts: 390,
        bluetoothConnected: true
      },
      {
        enabled: true,
        isConnectedAC: false,
        modelRating: 120,
        chargingAmps: 120,
        voltageOut: 14.4,
        watts: 1728,
        acVoltage: 220,
        smartConnectActive: true
      }
    );

    const batTpl = sysTemplates.find((t) => t.catalogId === 'sys_battery')!;
    const fridgeTpl = buildApplianceTemplate({
      id: 'app_1',
      name: 'Geladeira 12V',
      watts: 64,
      hours: 10,
      qty: 1,
      enabled: true
    });
    const pumpTpl = buildApplianceTemplate({
      id: 'app_3',
      name: 'Bomba Seaflo 12V',
      watts: 64,
      hours: 1,
      qty: 1,
      enabled: true
    });

    const nodes: Node<ElectricalNodeData>[] = [
      { id: 'n_bat', type: 'schematic', position: { x: 0, y: 0 }, data: templateToNodeData(batTpl) },
      { id: 'n_bus', type: 'schematic', position: { x: 200, y: 0 }, data: templateToNodeData(busbarPosTpl) },
      { id: 'n_fuse', type: 'schematic', position: { x: 400, y: 0 }, data: templateToNodeData(fuseBoxTpl) },
      { id: 'n_fridge', type: 'schematic', position: { x: 700, y: 0 }, data: templateToNodeData(fridgeTpl) },
      { id: 'n_pump', type: 'schematic', position: { x: 700, y: 120 }, data: templateToNodeData(pumpTpl) }
    ];

    const makeEdge = (
      id: string,
      source: string,
      sourceHandle: string,
      target: string,
      targetHandle: string,
      lengthMeters: number
    ): Edge<ElectricalEdgeData> => ({
      id,
      source,
      target,
      sourceHandle,
      targetHandle,
      type: 'wire',
      data: {
        polarity: 'pos',
        color: '#ef4444',
        lengthMeters,
        currentAmps: 0,
        voltage: 12.8,
        suggestedGaugeMm2: 2.5,
        gaugeMm2: 2.5,
        suggestedProtectionAmps: 10,
        voltageDropVolts: 0,
        voltageDropPercent: 0,
        isOverloaded: false
      }
    });

    const edges: Edge<ElectricalEdgeData>[] = [
      makeEdge('e_bat_bus', 'n_bat', 'bat_pos', 'n_bus', 'term_1', 1.0),
      makeEdge('e_bus_fuse', 'n_bus', 'term_4', 'n_fuse', 'in_pos', 1.5),
      makeEdge('e_fuse_fridge', 'n_fuse', 'fuse_1', 'n_fridge', 'in_pos', 3.0),
      makeEdge('e_fuse_pump', 'n_fuse', 'fuse_2', 'n_pump', 'in_pos', 2.5)
    ];

    const updated = recalculateDiagramEdges(nodes, edges);
    const syncedNodes = syncFuseBoxNodePorts(nodes, updated);

    // Sem itens ligados antes, vias começavam vazias; após conectar 5A em F1 e F2, ambas calculam fusível de 10A
    const syncedFuseBox = syncedNodes.find((n) => n.id === 'n_fuse')!;
    const f1 = syncedFuseBox.data.ports.find((p) => p.id === 'fuse_1')!;
    const f2 = syncedFuseBox.data.ports.find((p) => p.id === 'fuse_2')!;
    const f3 = syncedFuseBox.data.ports.find((p) => p.id === 'fuse_3')!;

    expect(f1.fuseAmps).toBe(10);
    expect(f1.label).toBe('F1 (10A)');
    expect(f2.fuseAmps).toBe(10);
    expect(f2.label).toBe('F2 (10A)');
    expect(f3.fuseAmps).toBeUndefined();
    expect(f3.label).toBe('F3');
    // Idempotência para não gerar loop no React
    expect(syncFuseBoxNodePorts(syncedNodes, updated)).toBe(syncedNodes);

    // Geladeira 64W @ 12.8V = 5.0A, Bomba 64W @ 12.8V = 5.0A -> total na entrada da caixa = 10.0A -> barramento -> bateria = 10.0A
    const eFridge = updated.find((e) => e.id === 'e_fuse_fridge')!;
    const eFuseIn = updated.find((e) => e.id === 'e_bus_fuse')!;
    const eBatBus = updated.find((e) => e.id === 'e_bat_bus')!;

    expect(eFridge.data?.currentAmps).toBe(5);
    expect(eFuseIn.data?.currentAmps).toBe(10);
    expect(eBatBus.data?.currentAmps).toBe(10);

    const bom = calculateElectricalBom(syncedNodes, updated);
    expect(bom.totalCableMeters).toBe(8);
    expect(bom.totalFuses).toBe(2);
    expect(bom.fuses).toEqual([
      { amps: 10, colorName: 'Vermelho', hex: '#dc2626', qty: 2 }
    ]);
    expect(bom.overloadedEdgesCount).toBe(0);
  });

  it('constrói vias da caixa de fusíveis, terminais do barramento e tabela de cores 5A-40A', () => {
    const ports = buildFuseBoxPorts(6);
    expect(ports.filter((p) => p.id.startsWith('fuse_')).length).toBe(6);
    expect(ports.filter((p) => p.id.startsWith('neg_')).length).toBe(6);

    const busPorts = buildBusbarPorts('neg', 10);
    expect(busPorts.length).toBe(10);
    expect(busPorts[0].polarity).toBe('neg');

    expect(getFuseColorSpec(5).colorName).toBe('Marrom');
    expect(getFuseColorSpec(15).colorName).toBe('Azul');
    expect(getFuseColorSpec(20).colorName).toBe('Amarelo');
    expect(getFuseColorSpec(40).colorName).toBe('Vermelho Escuro');
  });

  it('bloqueia conexões de polaridades incompatíveis (positivo com negativo, DC com AC, etc.)', () => {
    // Positivo <-> Negativo nunca pode conectar
    expect(arePolaritiesCompatible('pos', 'neg')).toBe(false);
    expect(arePolaritiesCompatible('neg', 'pos')).toBe(false);

    // Mesmas polaridades podem conectar
    expect(arePolaritiesCompatible('pos', 'pos')).toBe(true);
    expect(arePolaritiesCompatible('neg', 'neg')).toBe(true);
    expect(arePolaritiesCompatible('ac_phase', 'ac_phase')).toBe(true);
    expect(arePolaritiesCompatible('ac_neutral', 'ac_neutral')).toBe(true);
    expect(arePolaritiesCompatible('ac_ground', 'ac_ground')).toBe(true);
    expect(arePolaritiesCompatible('signal', 'signal')).toBe(true);

    // Sinal (+ Sensor V / D+) pode conectar no Positivo (+ DC), mas nunca no Negativo ou AC
    expect(arePolaritiesCompatible('pos', 'signal')).toBe(true);
    expect(arePolaritiesCompatible('signal', 'pos')).toBe(true);
    expect(arePolaritiesCompatible('neg', 'signal')).toBe(false);
    expect(arePolaritiesCompatible('ac_phase', 'signal')).toBe(false);

    // AC e DC ou fases diferentes não podem misturar
    expect(arePolaritiesCompatible('pos', 'ac_phase')).toBe(false);
    expect(arePolaritiesCompatible('neg', 'ac_neutral')).toBe(false);
    expect(arePolaritiesCompatible('ac_phase', 'ac_neutral')).toBe(false);
    expect(arePolaritiesCompatible('ac_phase', 'ac_ground')).toBe(false);
    expect(arePolaritiesCompatible('ac_neutral', 'ac_ground')).toBe(false);

    const busbarPosTpl = INFRASTRUCTURE_CATALOG.find((t) => t.catalogId === 'busbar_pos')!;
    const busbarNegTpl = INFRASTRUCTURE_CATALOG.find((t) => t.catalogId === 'busbar_neg')!;
    const shuntTpl = INFRASTRUCTURE_CATALOG.find((t) => t.catalogId === 'shunt_monitor')!;
    const inverterTpl = INFRASTRUCTURE_CATALOG.find((t) => t.catalogId === 'inverter_2500')!;

    const nodes: Node<ElectricalNodeData>[] = [
      { id: 'n_bus_pos', type: 'schematic', position: { x: 0, y: 0 }, data: templateToNodeData(busbarPosTpl) },
      { id: 'n_bus_neg', type: 'schematic', position: { x: 200, y: 0 }, data: templateToNodeData(busbarNegTpl) },
      { id: 'n_shunt', type: 'schematic', position: { x: 400, y: 0 }, data: templateToNodeData(shuntTpl) },
      { id: 'n_inv', type: 'schematic', position: { x: 600, y: 0 }, data: templateToNodeData(inverterTpl) }
    ];

    // Positivo no Negativo deve falhar
    const posToNeg = validateElectricalConnection(
      { source: 'n_bus_pos', sourceHandle: 'term_1', target: 'n_bus_neg', targetHandle: 'term_1' },
      nodes
    );
    expect(posToNeg.valid).toBe(false);
    expect(posToNeg.reason).toContain('incompatível');

    // Negativo no Positivo também deve falhar
    const negToPos = validateElectricalConnection(
      { source: 'n_bus_neg', sourceHandle: 'term_1', target: 'n_inv', targetHandle: 'dc_pos' },
      nodes
    );
    expect(negToPos.valid).toBe(false);

    // Positivo no Positivo é válido
    const posToPos = validateElectricalConnection(
      { source: 'n_bus_pos', sourceHandle: 'term_1', target: 'n_inv', targetHandle: 'dc_pos' },
      nodes
    );
    expect(posToPos.valid).toBe(true);
    expect(posToPos.resolvedPolarity).toBe('pos');

    // Negativo no Negativo é válido
    const negToNeg = validateElectricalConnection(
      { source: 'n_bus_neg', sourceHandle: 'term_1', target: 'n_shunt', targetHandle: 'bat_neg' },
      nodes
    );
    expect(negToNeg.valid).toBe(true);
    expect(negToNeg.resolvedPolarity).toBe('neg');

    // Positivo no + Sensor V (signal) do Shunt é válido e resolve como fio de sinal
    const posToSensor = validateElectricalConnection(
      { source: 'n_bus_pos', sourceHandle: 'term_2', target: 'n_shunt', targetHandle: 'sig_pos' },
      nodes
    );
    expect(posToSensor.valid).toBe(true);
    expect(posToSensor.resolvedPolarity).toBe('signal');

    // Auto-conexão no mesmo nó deve falhar
    const selfConn = validateElectricalConnection(
      { source: 'n_bus_pos', sourceHandle: 'term_1', target: 'n_bus_pos', targetHandle: 'term_2' },
      nodes
    );
    expect(selfConn.valid).toBe(false);
  });

  it('sugere tipos de conectores nas pontas, propaga corrente por nó conector e consolida conectores no BOM', () => {
    const busbarPosTpl = INFRASTRUCTURE_CATALOG.find((t) => t.catalogId === 'busbar_pos')!;
    const fuseBoxTpl = INFRASTRUCTURE_CATALOG.find((t) => t.catalogId === 'fuse_box_6')!;
    const quickConnTpl = INFRASTRUCTURE_CATALOG.find((t) => t.catalogId === 'connector_dc_quick')!;
    const fridgeTpl = buildApplianceTemplate({
      id: 'app_fridge',
      name: 'Geladeira 12V',
      watts: 64,
      hours: 10,
      qty: 1,
      enabled: true
    });

    const nodes: Node<ElectricalNodeData>[] = [
      { id: 'n_bus', type: 'schematic', position: { x: 0, y: 0 }, data: templateToNodeData(busbarPosTpl) },
      { id: 'n_conn', type: 'schematic', position: { x: 200, y: 0 }, data: templateToNodeData(quickConnTpl) },
      { id: 'n_fuse', type: 'schematic', position: { x: 400, y: 0 }, data: templateToNodeData(fuseBoxTpl) },
      { id: 'n_fridge', type: 'schematic', position: { x: 650, y: 0 }, data: templateToNodeData(fridgeTpl) }
    ];

    const makePosEdge = (
      id: string,
      source: string,
      sourceHandle: string,
      target: string,
      targetHandle: string,
      extra?: Partial<ElectricalEdgeData>
    ): Edge<ElectricalEdgeData> => ({
      id,
      source,
      target,
      sourceHandle,
      targetHandle,
      type: 'wire',
      data: {
        polarity: 'pos',
        color: '#ef4444',
        lengthMeters: 1.5,
        currentAmps: 0,
        voltage: 12.8,
        suggestedGaugeMm2: 2.5,
        gaugeMm2: 2.5,
        suggestedProtectionAmps: 10,
        voltageDropVolts: 0,
        voltageDropPercent: 0,
        isOverloaded: false,
        ...extra
      }
    });

    const edges: Edge<ElectricalEdgeData>[] = [
      makePosEdge('e1', 'n_bus', 'term_1', 'n_conn', 'in_pos'),
      makePosEdge('e2', 'n_conn', 'out_pos', 'n_fuse', 'in_pos'),
      makePosEdge('e3', 'n_fuse', 'fuse_1', 'n_fridge', 'in_pos', {
        targetConnector: 'wago',
        isManualTargetConnector: true
      })
    ];

    const updated = recalculateDiagramEdges(nodes, edges);
    const e1 = updated.find((e) => e.id === 'e1')!;
    const e2 = updated.find((e) => e.id === 'e2')!;
    const e3 = updated.find((e) => e.id === 'e3')!;

    // Corrente de 5A da geladeira deve propagar através da caixa de fusíveis e do conector inline
    expect(e3.data?.currentAmps).toBe(5);
    expect(e2.data?.currentAmps).toBe(5);
    expect(e1.data?.currentAmps).toBe(5);

    // Conectores sugeridos automaticamente nas pontas
    expect(e1.data?.sourceConnector).toBe('ring_m6');
    expect(e1.data?.targetConnector).toBe('anderson');
    expect(e2.data?.sourceConnector).toBe('anderson');
    expect(e2.data?.targetConnector).toBe('ring_m6');
    expect(e3.data?.sourceConnector).toBe('spade');
    // Override manual preservado
    expect(e3.data?.targetConnector).toBe('wago');

    const bom = calculateElectricalBom(nodes, updated);
    expect(bom.totalConnectors).toBe(6);
    expect(bom.connectors.find((c) => c.connectorType === 'ring_m6')?.qty).toBe(2);
    expect(bom.connectors.find((c) => c.connectorType === 'anderson')?.qty).toBe(2);
    expect(bom.connectors.find((c) => c.connectorType === 'spade')?.qty).toBe(1);
    expect(bom.connectors.find((c) => c.connectorType === 'wago')?.qty).toBe(1);
  });
});
