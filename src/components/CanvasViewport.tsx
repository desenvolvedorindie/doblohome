import React, { useEffect, useRef } from 'react';
import { useSolar } from '../context/SolarContext';
import { SceneManager } from '../three/SceneManager';

export const CanvasViewport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setSceneManager } = useSolar();

  useEffect(() => {
    if (!containerRef.current) return;

    const manager = new SceneManager(containerRef.current);
    setSceneManager(manager);

    return () => {
      manager.dispose();
      setSceneManager(null);
    };
  }, []);

  return <div id="canvas-container" ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />;
};

