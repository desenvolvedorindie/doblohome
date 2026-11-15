import React, { useRef, useEffect } from 'react';
import { useSolar } from '../../context/SolarContext';
import { ViewMode } from '../../types';

const WORKSPACES: Array<{ id: ViewMode; label: string; title: string }> = [
  {
    id: 'internal_boxes',
    label: '1. Módulos',
    title: 'Planejamento do Grid Interno, Módulos Camper e Teto/Forro',
  },
  {
    id: 'assembled',
    label: '2. Doblò + Estrutura',
    title: 'Visualização 3D Completa da Fiat Doblò e Rack Solar Retrátil',
  },
  {
    id: 'bars_lineup',
    label: '3. Peças & Corte',
    title: 'Bancada 3D de Peças e Otimizador de Plano de Corte 2D',
  },
  {
    id: 'electrical_planar',
    label: '4. Elétrica 2D',
    title: 'Esquemático Elétrico Planar 2D (DC/AC, Fusíveis, Cabos)',
  },
  {
    id: 'hydraulic_planar',
    label: '5. Hidráulica 2D',
    title: 'Esquemático Hidráulico Planar 2D (Água Fria, Quente, Cinza)',
  },
];

export const WorkspaceSwitcher: React.FC = () => {
  const { viewMode, setViewMode } = useSolar();
  const barRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCenter = () => {
      if (!tabsRef.current || !barRef.current) return;
      const parentRect = barRef.current.getBoundingClientRect();
      const windowCenter = window.innerWidth / 2;
      const parentCenter = parentRect.left + parentRect.width / 2;
      const offset = windowCenter - parentCenter;
      tabsRef.current.style.transform = `translateX(${offset}px)`;
    };

    updateCenter();
    window.addEventListener('resize', updateCenter);
    const observer = new ResizeObserver(updateCenter);
    if (barRef.current) observer.observe(barRef.current);
    observer.observe(document.body);

    return () => {
      window.removeEventListener('resize', updateCenter);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={barRef} className="ide-workspace-switcher">
      <div ref={tabsRef} className="ide-workspace-pill-group">
        {WORKSPACES.map((ws) => {
          const isActive = viewMode === ws.id;
          return (
            <button
              key={ws.id}
              type="button"
              onClick={() => setViewMode(ws.id)}
              title={ws.title}
              className={`ide-workspace-pill-btn ${isActive ? 'active' : ''}`}
            >
              {ws.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
