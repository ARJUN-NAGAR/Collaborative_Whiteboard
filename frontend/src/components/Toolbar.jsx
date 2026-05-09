import { useState, useRef, useEffect } from 'react';
import {
  Pencil, Eraser, Square, Circle, Minus, MoveRight,
  Type, StickyNote, Trash2, Hand, MousePointer2, Move,
  LayoutTemplate, Undo2, Redo2, BringToFront, SendToBack
} from 'lucide-react';

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

export default function Toolbar({
  tool, setTool,
  color, setColor,
  strokeWidth, setStrokeWidth,
  onClear,
  sendHandRaise, sessionId, user,
  onOpenTemplates,
  canUndo, canRedo, onUndo, onRedo,
}) {
  const [showColors, setShowColors] = useState(false);
  const paletteRef = useRef(null);

  useEffect(() => {
    const keys = { v:'select', ' ':'pan', p:'pen', e:'eraser', r:'rect', c:'circle', l:'line', a:'arrow', t:'text', s:'sticky' };
    const handler = (ev) => {
      if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
      const t = keys[ev.key.toLowerCase()];
      if (t) setTool(t);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setTool]);

  useEffect(() => {
    const handler = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) setShowColors(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRaiseHand = () => {
    if (!sendHandRaise || !sessionId || !user) return;
    sendHandRaise({ sessionId, userId: user.id, data: { userName: user.name } });
  };

  return (
    <div className="toolbar">
      {/* Undo / Redo */}
      <button
        className="tool-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        style={{ opacity: canUndo ? 1 : 0.35 }}
      >
        <Undo2 size={17} />
        <span className="tooltip">Undo (Ctrl+Z)</span>
      </button>
      <button
        className="tool-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        style={{ opacity: canRedo ? 1 : 0.35 }}
      >
        <Redo2 size={17} />
        <span className="tooltip">Redo (Ctrl+Y)</span>
      </button>

      <div className="toolbar-divider" />

      {/* Drawing tools */}
      {TOOLS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          className={`tool-btn ${tool === id ? 'active' : ''}`}
          onClick={() => setTool(id)}
          title={label}
        >
          <Icon size={18} />
          <span className="tooltip">{label}</span>
        </button>
      ))}

      <div className="toolbar-divider" />

      {/* Color picker */}
      <div ref={paletteRef} style={{ position: 'relative' }}>
        <button
          className="color-picker-btn"
          style={{ background: color }}
          onClick={() => setShowColors(s => !s)}
          title="Color"
        />
        {showColors && (
          <div className="color-palette">
            {COLORS.map(c => (
              <div
                key={c}
                className={`color-swatch ${color === c ? 'selected' : ''}`}
                style={{ background: c, border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.2)' : undefined }}
                onClick={() => { setColor(c); setShowColors(false); }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              style={{ gridColumn: 'span 7', width: '100%', height: 28, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}
              title="Custom color"
            />
          </div>
        )}
      </div>

      {/* Stroke width */}
      <div className="stroke-slider-wrap">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="2" fill="currentColor" opacity="0.5" />
        </svg>
        <input
          type="range"
          className="stroke-slider"
          min="1" max="24"
          value={strokeWidth}
          onChange={e => setStrokeWidth(+e.target.value)}
          title={`Stroke: ${strokeWidth}px`}
        />
        <svg width="14" height="14" viewBox="0 0 14 14">
          <circle cx="7" cy="7" r="4" fill="currentColor" />
        </svg>
      </div>

      <div className="toolbar-divider" />

      {/* Raise Hand */}
      <button className="tool-btn" onClick={handleRaiseHand} title="Raise Hand">
        <Hand size={17} />
        <span className="tooltip">Raise Hand</span>
      </button>

      {/* Templates */}
      <button className="tool-btn" onClick={onOpenTemplates} title="Templates">
        <LayoutTemplate size={17} />
        <span className="tooltip">Templates</span>
      </button>

      {/* Clear */}
      <button className="tool-btn" onClick={onClear} title="Clear Board">
        <Trash2 size={17} />
        <span className="tooltip">Clear Board</span>
      </button>
    </div>
  );
}