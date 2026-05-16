import React from 'react';
import { Undo2, Redo2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useWhiteboard } from '../contexts/WhiteboardContext';
import { useCollaboration } from '../contexts/CollaborationContext';

export default function BottomToolbar() {
  const { canUndo, canRedo, undo, redo, zoom, setZoom, setPanOffset } = useWhiteboard();
  const { publishElementsSync } = useCollaboration();

  const handleUndo = () => {
    const next = undo();
    if (next) publishElementsSync(next);
  };

  const handleRedo = () => {
    const next = redo();
    if (next) publishElementsSync(next);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.1));
  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="bottom-toolbar" style={{
      position: 'absolute', bottom: 16, left: 16,
      display: 'flex', gap: '12px', alignItems: 'center',
      background: 'var(--glass)', border: '1px solid var(--glass-border)',
      borderRadius: 'var(--r-md)', padding: '6px 12px',
      backdropFilter: 'blur(16px)', boxShadow: 'var(--shadow-md)',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button className="tool-btn" onClick={handleUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Undo2 size={16} />
        </button>
        <button className="tool-btn" onClick={handleRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <Redo2 size={16} />
        </button>
      </div>
      
      <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />
      
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button className="tool-btn" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, width: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="tool-btn" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <button className="tool-btn" onClick={handleResetZoom} title="Reset Zoom/Pan">
          <Maximize size={14} />
        </button>
      </div>
    </div>
  );
}
