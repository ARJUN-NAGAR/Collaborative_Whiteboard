import { useState, useRef, useEffect } from 'react';
import {
  Pencil, Eraser, Square, Circle, Minus, MoveRight,
  Type, StickyNote, MousePointer2, Move
} from 'lucide-react';
import { useTool } from '../contexts/ToolContext';

const COLORS = [
  '#ffffff','#f87171','#fb923c','#fbbf24','#34d399',
  '#60a5fa','#a78bfa','#f472b6','#000000','#1e293b',
  '#0891b2','#7c3aed','#dc2626','#16a34a','#ea580c'
];

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)' },
  { id: 'pan', icon: Move, label: 'Pan (Space)' },
  { id: 'pen', icon: Pencil, label: 'Pen (P)' },
  { id: 'eraser', icon: Eraser, label: 'Eraser (E)' },
  { id: 'rect', icon: Square, label: 'Rectangle (R)' },
  { id: 'circle', icon: Circle, label: 'Circle (C)' },
  { id: 'line', icon: Minus, label: 'Line (L)' },
  { id: 'arrow', icon: MoveRight, label: 'Arrow (A)' },
  { id: 'text', icon: Type, label: 'Text (T)' },
  { id: 'sticky', icon: StickyNote, label: 'Sticky Note (S)' },
];

export default function Toolbar() {
  const { activeTool, setActiveTool, strokeColor, setStrokeColor, strokeWidth, setStrokeWidth } = useTool();
  
  const [showColors, setShowColors] = useState(false);
  const paletteRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) setShowColors(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="toolbar">
      {/* Drawing tools */}
      {TOOLS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          className={`tool-btn ${activeTool === id ? 'active' : ''}`}
          onClick={() => setActiveTool(id)}
          title={label}
        >
          <Icon size={18} />
          <span className="tip">{label}</span>
        </button>
      ))}

      <div className="toolbar-divider" style={{ width: '24px', height: '1px', background: 'var(--border-subtle)', margin: '4px auto' }} />

      {/* Color picker */}
      <div ref={paletteRef} style={{ position: 'relative' }}>
        <button
          className="color-picker-btn"
          style={{ background: strokeColor, width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', margin: '4px auto', display: 'block' }}
          onClick={() => setShowColors(s => !s)}
          title="Color"
        />
        {showColors && (
          <div className="color-palette" style={{ position: 'absolute', left: '100%', top: 0, marginLeft: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: 10, borderRadius: 10, width: 160, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, zIndex: 300, boxShadow: 'var(--shadow-lg)' }}>
            {COLORS.map(c => (
              <div
                key={c}
                className={`color-swatch ${strokeColor === c ? 'selected' : ''}`}
                style={{ background: c, width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent', transform: strokeColor === c ? 'scale(1.1)' : 'none', boxShadow: strokeColor === c ? '0 0 0 2px var(--accent)' : 'none' }}
                onClick={() => { setStrokeColor(c); setShowColors(false); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stroke width */}
      <div className="stroke-slider-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <input
          type="range"
          min="1" max="24"
          value={strokeWidth}
          onChange={e => setStrokeWidth(+e.target.value)}
          title={`Stroke: ${strokeWidth}px`}
          style={{ width: 100, transform: 'rotate(-90deg)', margin: '40px 0' }}
        />
      </div>
    </div>
  );
}
