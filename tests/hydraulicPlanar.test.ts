import { describe, it, expect } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import {
  HYDRAULIC_VALVES_FITTINGS_CATALOG,
  HYDRAULIC_WATER_POINTS_CATALOG,
  HydraulicEdgeData,
  HydraulicNodeData
} from '../src/types/hydraulicPlanar';
import {
  calculateHydraulicBom,
  calculatePipeSpecs,
  recalculateHydraulicEdges
} from '../src/utils/hydraulicCalculations';
import {
  buildHydraulicSystemTemplates,
  hydraulicTemplateToNodeData
} from '../src/utils/hydraulicCatalog';

describe('Planejador Hidráulico Planar (2D)', () => {
  it('calcula diâmetro ideal, velocidade do fluido e alertas de restrição', () => {
    const okPipe = calculatePipeSpecs({
      flowLpm: 6,
      pressurePsi: 35,
      lengthMeters: 2.5,
      fluidType: 'cold'
    });
    expect(okPipe.suggestedDiameterMm).toBe(12);
    expect(okPipe.isOverloaded).toBe(false);

    // Tubo 8mm manual com 11.3 L/min deve acusar velocidade alta / restrição
    const restricted = calculatePipeSpecs({
      flowLpm: 11.3,
      pressurePsi: 45,
      lengthMeters: 2,
      fluidType: 'hot',
      isManualDiameter: true,
      manualDiameterMm: 8
    });
    expect(restricted.isOverloaded).toBe(true);
    expect(restricted.warning).toContain('8mm');

    // Esgoto / água cinza sugere Ø25mm (1") por padrão
    const drainPipe = calculatePipeSpecs({
      flowLpm: 6,
      pressurePsi: 0,
      lengthMeters: 1.5,
      fluidType: 'gray_drain'
    });
    expect(drainPipe.suggestedDiameterMm).toBe(25);
    expect(drainPipe.isOverloaded).toBe(false);
  });

  it('propaga vazão através de conexão T e válvula de retenção e consolida BOM hidráulico', () => {
    const sysTemplates = buildHydraulicSystemTemplates(
      { enabled: true, lengthMm: 2200, diameterMm: 200, connectionPosition: 'front' },
      [{ id: 'app_3', name: 'Bomba Seaflo 12V', watts: 60, hours: 0.75, qty: 1, enabled: true }]
    );

    const tankU = sysTemplates.find((t) => t.catalogId === 'sys_water_tank_u')!;
    const pump = sysTemplates.find((t) => t.catalogId === 'sys_seaflo_pump')!;
    const checkValve = HYDRAULIC_VALVES_FITTINGS_CATALOG.find((t) => t.catalogId === 'vf_check_valve')!;
    const tee = HYDRAULIC_VALVES_FITTINGS_CATALOG.find((t) => t.catalogId === 'vf_tee')!;
    const faucet = HYDRAULIC_WATER_POINTS_CATALOG.find((t) => t.catalogId === 'wp_sink_faucet')!;
    const shower = HYDRAULIC_WATER_POINTS_CATALOG.find((t) => t.catalogId === 'wp_shower')!;

    expect(tankU.capacityLiters).toBeGreaterThan(100);

    const nodes: Node<HydraulicNodeData>[] = [
      { id: 'n_tank', type: 'hydraulicSchematic', position: { x: 0, y: 0 }, data: hydraulicTemplateToNodeData(tankU) },
      { id: 'n_pump', type: 'hydraulicSchematic', position: { x: 250, y: 0 }, data: hydraulicTemplateToNodeData(pump) },
      { id: 'n_chk', type: 'hydraulicSchematic', position: { x: 500, y: 0 }, data: hydraulicTemplateToNodeData(checkValve) },
      { id: 'n_tee', type: 'hydraulicSchematic', position: { x: 750, y: 0 }, data: hydraulicTemplateToNodeData(tee) },
      { id: 'n_faucet', type: 'hydraulicSchematic', position: { x: 1000, y: -80 }, data: hydraulicTemplateToNodeData(faucet) },
      { id: 'n_shower', type: 'hydraulicSchematic', position: { x: 1000, y: 80 }, data: hydraulicTemplateToNodeData(shower) }
    ];

    const makePipe = (
      id: string,
      source: string,
      sourceHandle: string,
      target: string,
      targetHandle: string,
      fluidType: 'cold' | 'hot',
      lengthMeters: number
    ): Edge<HydraulicEdgeData> => ({
      id,
      source,
      target,
      sourceHandle,
      targetHandle,
      type: 'hydraulicPipe',
      data: {
        fluidType,
        color: fluidType === 'hot' ? '#dc2626' : '#2563eb',
        material: fluidType === 'hot' ? 'pex' : 'pu_pushfit',
        lengthMeters,
        flowLpm: 0,
        pressurePsi: 45,
        suggestedDiameterMm: 12,
        diameterMm: 12,
        velocityMs: 0,
        headLossPsi: 0,
        isOverloaded: false
      }
    });

    const edges: Edge<HydraulicEdgeData>[] = [
      makePipe('e_tank_pump', 'n_tank', 'out_supply', 'n_pump', 'in_suction', 'cold', 1.2),
      makePipe('e_pump_chk', 'n_pump', 'out_press', 'n_chk', 'in_p', 'hot', 0.8),
      makePipe('e_chk_tee', 'n_chk', 'out_p', 'n_tee', 'p_1', 'hot', 1.5),
      makePipe('e_tee_faucet', 'n_tee', 'p_2', 'n_faucet', 'in_water', 'hot', 2.0),
      makePipe('e_tee_shower', 'n_tee', 'p_3', 'n_shower', 'in_water', 'hot', 2.5)
    ];

    const recalc = recalculateHydraulicEdges(nodes, edges);
    const eTankPump = recalc.find((e) => e.id === 'e_tank_pump')!;
    const eChkTee = recalc.find((e) => e.id === 'e_chk_tee')!;

    // Vazão da bomba (11.3 L/min) propaga para sucção, válvula de retenção e T
    expect(eTankPump.data?.flowLpm).toBe(11.3);
    expect(eChkTee.data?.flowLpm).toBe(11.3);

    const bom = calculateHydraulicBom(nodes, recalc);
    expect(bom.totalPipeMeters).toBe(8.0);
    expect(bom.estimatedPushConnectors).toBe(10); // 5 trechos * 2 engates
    expect(bom.overloadedPipesCount).toBe(0);
  });
});
