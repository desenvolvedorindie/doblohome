import React, { useEffect, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { useSolar } from '../../../context/SolarContext';
import { dbGet, dbSet } from '../../../data/db';
import {
  HydraulicCatalogTemplate,
  HydraulicEdgeData,
  HydraulicEdgeStyle,
  HydraulicNodeData
} from '../../../types/hydraulicPlanar';
import { buildHydraulicSystemTemplates } from '../../../utils/hydraulicCatalog';
import { recalculateHydraulicEdges } from '../../../utils/hydraulicCalculations';

const STORAGE_KEY_HYDRAULIC_DIAGRAM = 'doblo_hydraulic_planar_v1';
const STORAGE_KEY_HYDRAULIC_CUSTOM = 'doblo_hydraulic_custom_templates_v1';

interface SavedHydraulicDiagramState {
  nodes: Node<HydraulicNodeData>[];
  edges: Edge<HydraulicEdgeData>[];
  edgeStyle?: HydraulicEdgeStyle;
}

interface UseHydraulicPlanarPersistenceParams {
  nodes: Node<HydraulicNodeData>[];
  setNodes: React.Dispatch<React.SetStateAction<Node<HydraulicNodeData>[]>>;
  edges: Edge<HydraulicEdgeData>[];
  setEdges: React.Dispatch<React.SetStateAction<Edge<HydraulicEdgeData>[]>>;
  edgeStyle: HydraulicEdgeStyle;
  setEdgeStyle: React.Dispatch<React.SetStateAction<HydraulicEdgeStyle>>;
  customTemplates: HydraulicCatalogTemplate[];
  setCustomTemplates: React.Dispatch<React.SetStateAction<HydraulicCatalogTemplate[]>>;
}

export function useHydraulicPlanarPersistence({
  nodes,
  setNodes,
  edges,
  setEdges,
  edgeStyle,
  setEdgeStyle,
  customTemplates,
  setCustomTemplates
}: UseHydraulicPlanarPersistenceParams) {
  const {
    waterTank,
    appliances,
    activePortaPottiPreset
  } = useSolar();

  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega diagrama hidráulico salvo no IndexedDB
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await dbGet<SavedHydraulicDiagramState>(STORAGE_KEY_HYDRAULIC_DIAGRAM);
        if (mounted && saved && Array.isArray(saved.nodes) && Array.isArray(saved.edges)) {
          const style = saved.edgeStyle || 'smoothstep';
          setEdgeStyle(style);
          const styledEdges = saved.edges.map((e) => ({
            ...e,
            type: 'hydraulicPipe',
            data: { ...(e.data as HydraulicEdgeData), edgeStyle: style }
          }));
          const recalc = recalculateHydraulicEdges(saved.nodes, styledEdges);
          setNodes(saved.nodes);
          setEdges(recalc);
        }

        const savedCustom = await dbGet<HydraulicCatalogTemplate[]>(STORAGE_KEY_HYDRAULIC_CUSTOM);
        if (mounted && Array.isArray(savedCustom)) {
          setCustomTemplates(savedCustom);
        }
      } catch (err) {
        console.warn('Erro ao carregar diagrama hidráulico:', err);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setNodes, setEdges, setEdgeStyle, setCustomTemplates]);

  // Salva automaticamente no IndexedDB
  useEffect(() => {
    if (!isLoaded) return;
    dbSet(STORAGE_KEY_HYDRAULIC_DIAGRAM, { nodes, edges, edgeStyle });
  }, [nodes, edges, edgeStyle, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    dbSet(STORAGE_KEY_HYDRAULIC_CUSTOM, customTemplates);
  }, [customTemplates, isLoaded]);

  // Sincronização reativa com Caixa d'Água em U, Bomba e Porta Potti do sistema
  useEffect(() => {
    if (!isLoaded) return;
    setNodes((prevNodes) => {
      if (prevNodes.length === 0) return prevNodes;
      const sysTemplates = buildHydraulicSystemTemplates(
        waterTank,
        appliances,
        activePortaPottiPreset
      );
      const sysMap = new Map(sysTemplates.map((t) => [t.catalogId, t]));

      let changed = false;
      const nextNodes = prevNodes.map((node) => {
        const d = node.data;
        if (d.category === 'system_fixed' && sysMap.has(d.catalogId)) {
          const tpl = sysMap.get(d.catalogId)!;
          if (
            d.label !== tpl.label ||
            d.subtitle !== tpl.subtitle ||
            d.capacityLiters !== tpl.capacityLiters
          ) {
            changed = true;
            return {
              ...node,
              data: {
                ...d,
                label: tpl.label,
                subtitle: tpl.subtitle,
                capacityLiters: tpl.capacityLiters
              }
            };
          }
        }
        return node;
      });

      if (!changed) return prevNodes;
      setEdges((prevEdges) => recalculateHydraulicEdges(nextNodes, prevEdges));
      return nextNodes;
    });
  }, [waterTank, appliances, activePortaPottiPreset, isLoaded, setNodes, setEdges]);

  // Atalho Ctrl+A / Cmd+A para selecionar todos os nós e conexões do canvas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        setNodes((prev) => prev.map((n) => ({ ...n, selected: true })));
        setEdges((prev) => prev.map((ed) => ({ ...ed, selected: true })));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setNodes, setEdges]);
}
