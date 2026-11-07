import React from 'react';
import { useSolar } from '../context/SolarContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useSolar();

  if (!toastMessage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '64px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(16, 185, 129, 0.92)',
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '6px',
        fontWeight: 600,
        fontSize: '13px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        zIndex: 10000,
        pointerEvents: 'none',
        transition: 'all 0.3s ease'
      }}
    >
      {toastMessage}
    </div>
  );
};

