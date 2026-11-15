import React, { useEffect, useRef } from 'react';
import { useSolar } from '../context/SolarContext';
import { SceneManager } from '../three/SceneManager';
import { InternalRulerHUD } from './planner/InternalRulerHUD';

export const CanvasViewport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    setSceneManager,
    isolatedBoxId,
    setIsolatedBoxId,
    internalBoxes
  } = useSolar();

  useEffect(() => {
    if (!containerRef.current) return;

    const manager = new SceneManager(containerRef.current);
    setSceneManager(manager);

    return () => {
      manager.dispose();
      setSceneManager(null);
    };
  }, []);

  const isolatedBox = isolatedBoxId ? internalBoxes.find((b) => b.id === isolatedBoxId) : null;

  return (
    <>
      <div
        id="canvas-container"
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          overflow: 'hidden'
        }}
      />

      {isolatedBox && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <button
            onClick={() => setIsolatedBoxId(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1.5px solid #38bdf8',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.45), 0 2px 6px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.15s ease'
            }}
            title="Voltar para visualizar e editar todos os demais baús (ou pressione ESC)"
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>←</span> Voltar (Editar demais baús)
          </button>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#f8fafc',
              fontSize: '12px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>🎯 Visualização Isolada:</span>
            <span>{isolatedBox.name}</span>
            <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '6px' }}>
              (demais transparentes)
            </span>
          </div>
        </div>
      )}

      <InternalRulerHUD />
    </>
  );
};
