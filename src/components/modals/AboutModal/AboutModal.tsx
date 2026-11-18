import React, { useState, useEffect } from 'react';
import { XIcon } from '../../layout/IdeIcons';
import type { AboutModalProps } from './types';

export const AboutModal: React.FC<AboutModalProps> = ({ onClose, isOpen = true }) => {
  const [clickCount, setClickCount] = useState(0);
  const [showDevMessage, setShowDevMessage] = useState(false);
  const [devMode, setDevMode] = useState(() => {
    try {
      return localStorage.getItem('doblo_developer_mode') === 'true';
    } catch {
      return false;
    }
  });

  // Fecha no ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (showDevMessage) {
      const timer = setTimeout(() => setShowDevMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showDevMessage]);

  if (!isOpen) return null;

  const handleVersionClick = () => {
    if (devMode) return;

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 5) {
      setDevMode(true);
      setShowDevMessage(true);
      setClickCount(0);
      try {
        localStorage.setItem('doblo_developer_mode', 'true');
      } catch {
        // ignore
      }
    }
  };

  return (
    <div
      className="modal-overlay open"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="modal-window glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          width: '100%',
          maxWidth: '460px',
          overflow: 'hidden',
          padding: 0,
          color: '#e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid #334155',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#e2e8f0', fontWeight: 700 }}>
            <span>About</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Fechar"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.55 }}>
          {/* Logo + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Logo com ícone SVG estilizado van solar com glow */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(139, 92, 246, 0.25))',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.35))',
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#38bdf8' }}>
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 800,
                fontSize: '24px',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #0ea5e9 0%, #8b5cf6 50%, #FFA800 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              DoblóHome Studio
            </span>
          </div>

          {/* Description */}
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
            Design and optimize campervan builds and off-grid solar systems for Fiat Doblò. Interactive 3D layout, millimetric precision, solar yield simulation, electrical balancing, and automated cutting plans.
          </p>

          {/* Built with badges */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginRight: '4px' }}>
              Built with
            </span>

            {/* Three.js */}
            <a
              href="https://threejs.org/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <svg role="img" viewBox="0 0 24 24" width="13" height="13" fill="#ffffff">
                <path d="M12 2.5L2 19.5h20L12 2.5zm0 4.2l6.5 11.3H5.5L12 6.7z" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', fontFamily: '"Inter", sans-serif' }}>
                Three<span style={{ color: '#38bdf8' }}>.js</span>
              </span>
            </a>

            {/* React 19 */}
            <a
              href="https://react.dev/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid rgba(0, 216, 255, 0.3)',
                background: 'rgba(0, 216, 255, 0.08)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.background = 'rgba(0, 216, 255, 0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.background = 'rgba(0, 216, 255, 0.08)';
              }}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#00d8ff" strokeWidth="2">
                <circle cx="12" cy="12" r="2" fill="#00d8ff" />
                <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(0 12 12)" />
                <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" />
                <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#00d8ff', fontFamily: '"Inter", sans-serif' }}>
                React <span style={{ color: '#38bdf8' }}>19</span>
              </span>
            </a>

            {/* TypeScript */}
            <a
              href="https://www.typescriptlang.org/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid rgba(49, 120, 198, 0.35)',
                background: 'rgba(49, 120, 198, 0.1)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.background = 'rgba(49, 120, 198, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.background = 'rgba(49, 120, 198, 0.1)';
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#3178c6', fontFamily: 'monospace' }}>TS</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#60a5fa', fontFamily: '"Inter", sans-serif' }}>
                TypeScript
              </span>
            </a>

            {/* Yii 2 */}
            <a
              href="https://www.yiiframework.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid rgba(39, 125, 192, 0.35)',
                background: 'rgba(39, 125, 192, 0.1)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.background = 'rgba(39, 125, 192, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.background = 'rgba(39, 125, 192, 0.1)';
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8' }}>Yii2</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#22c55e', fontFamily: '"Inter", sans-serif' }}>
                Backend
              </span>
            </a>
          </div>

          {/* Version + dev mode easter egg */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
            <p
              onClick={handleVersionClick}
              style={{
                margin: 0,
                color: '#94a3b8',
                fontSize: '12px',
                cursor: 'pointer',
                userSelect: 'none',
                fontFamily: '"JetBrains Mono", monospace',
              }}
              title="Clique 5 vezes para modo desenvolvedor"
            >
              Version 1.0.0
            </p>
            {showDevMessage && (
              <span
                style={{
                  fontSize: '12px',
                  color: '#10b981',
                  fontWeight: 700,
                  animation: 'pulse 1.5s infinite',
                }}
              >
                Developer Mode Enabled!
              </span>
            )}
            {devMode && !showDevMessage && (
              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                DEV MODE
              </span>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#64748b' }}>
              Created by <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Welsiton Ferreira</span>
            </span>
            <a
              href="https://github.com/desenvolvedorindie"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#10b981',
                textDecoration: 'none',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '12px',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              @desenvolvedorindie
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
