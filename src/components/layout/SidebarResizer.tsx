import React, { useRef, useEffect, useState } from 'react';

interface SidebarResizerProps {
  side: 'left' | 'right';
  width: number;
  setWidth: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

export const SidebarResizer: React.FC<SidebarResizerProps> = ({
  side,
  width,
  setWidth,
  minWidth = 240,
  maxWidth = 860,
}) => {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const [isHoveredOrActive, setIsHoveredOrActive] = useState(false);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    setIsHoveredOrActive(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth =
        side === 'left'
          ? startWidth.current + delta
          : startWidth.current - delta;
      setWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setIsHoveredOrActive(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [side, minWidth, maxWidth, setWidth]);

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHoveredOrActive(true)}
      onMouseLeave={() => {
        if (!isDragging.current) setIsHoveredOrActive(false);
      }}
      title="Arraste para redimensionar o painel"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '6px',
        zIndex: 50,
        cursor: 'col-resize',
        right: side === 'left' ? '-3px' : undefined,
        left: side === 'right' ? '-3px' : undefined,
        background: isHoveredOrActive ? 'rgba(99, 102, 241, 0.55)' : 'transparent',
        transition: 'background 0.15s ease',
      }}
    />
  );
};
