import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pencil, Eraser, Square, Circle, Minus, MoveRight,
  Type, StickyNote, MousePointer2, Move, Triangle,
  Star, Image as ImageIcon,
} from 'lucide-react';
import { useTool } from '../contexts/ToolContext';

/* ─────────────────────────────────────────────────────
   Colour palette
───────────────────────────────────────────────────── */
const PALETTE = [
  // Row 1 – neutrals
  ['#ffffff', '#f1f5f9', '#94a3b8', '#475569', '#1e293b', '#000000'],
  // Row 2 – warm
  ['#fef9c3', '#fde68a', '#fbbf24', '#f59e0b', '#ef4444', '#dc2626'],
  // Row 3 – cool
  ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#6366f1', '#7c3aed'],
  // Row 4 – vivid
  ['#d1fae5', '#6ee7b7', '#34d399', '#10b981', '#ec4899', '#db2777'],
];
const FLAT_PALETTE = PALETTE.flat();

/* ─────────────────────────────────────────────────────
   Tool groups
───────────────────────────────────────────────────── */
const TOOL_GROUPS = [
  {
    label: 'Select',
    tools: [
      { id: 'select', icon: MousePointer2, label: 'Select',  key: 'V' },
      { id: 'pan',    icon: Move,          label: 'Pan',     key: 'Space' },
    ],
  },
  {
    label: 'Draw',
    tools: [
      { id: 'pen',    icon: Pencil,     label: 'Pen',      key: 'P' },
      { id: 'eraser', icon: Eraser,     label: 'Eraser',   key: 'E' },
    ],
  },
  {
    label: 'Shape',
    tools: [
      { id: 'rect',   icon: Square,    label: 'Rectangle', key: 'R' },
      { id: 'circle', icon: Circle,    label: 'Ellipse',   key: 'C' },
      { id: 'line',   icon: Minus,     label: 'Line',      key: 'L' },
      { id: 'arrow',  icon: MoveRight, label: 'Arrow',     key: 'A' },
    ],
  },
  {
    label: 'Content',
    tools: [
      { id: 'text',   icon: Type,      label: 'Text',      key: 'T' },
      { id: 'sticky', icon: StickyNote,label: 'Sticky',    key: 'S' },
    ],
  },
];

const KEY_MAP = {};
TOOL_GROUPS.forEach(g => g.tools.forEach(t => { KEY_MAP[t.key.toLowerCase()] = t.id; }));

/* ─────────────────────────────────────────────────────
   Stroke widths
───────────────────────────────────────────────────── */
const STROKE_SIZES = [1, 2, 4, 8, 14];

export default function Toolbar() {
  const { activeTool, setActiveTool, strokeColor, setStrokeColor, strokeWidth, setStrokeWidth } = useTool();

  const [showColors, setShowColors] = useState(false);
  const paletteRef = useRef(null);

  /* keyboard shortcuts */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const mapped = KEY_MAP[e.key.toLowerCase()];
      if (mapped) setActiveTool(mapped);
      if (e.code === 'Space') { e.preventDefault(); setActiveTool('pan'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTool]);

  /* close color popup on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) setShowColors(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="toolbar" role="toolbar" aria-label="Drawing tools">

      {TOOL_GROUPS.map((group, gi) => (
        <div key={group.label} className="toolbar-group">
          {gi > 0 && <div className="toolbar-sep" />}
          <div className="toolbar-group-label">{group.label}</div>
          {group.tools.map(({ id, icon: Icon, label, key }) => (
            <button
              key={id}
              className={`tool-btn${activeTool === id ? ' active' : ''}`}
              onClick={() => setActiveTool(id)}
              title={`${label} (${key})`}
              aria-pressed={activeTool === id}
            >
              <Icon size={16} strokeWidth={activeTool === id ? 2.4 : 1.8} />
              <span className="tip">
                {label}
                <kbd>{key}</kbd>
              </span>
            </button>
          ))}
        </div>
      ))}

      {/* ── Divider ── */}
      <div className="toolbar-sep" style={{ marginTop: 4 }} />

      {/* ── Color ── */}
      <div ref={paletteRef} style={{ position: 'relative' }}>
        <div className="toolbar-group-label">Color</div>
        <button
          className="tool-btn"
          onClick={() => setShowColors(s => !s)}
          title="Stroke color"
          aria-label="Choose color"
          style={{ padding: '5px' }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: strokeColor,
            border: '2px solid rgba(255,255,255,0.35)',
            boxShadow: showColors ? '0 0 0 2px var(--accent)' : '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'box-shadow 0.15s',
            flexShrink: 0,
          }} />
        </button>

        {showColors && (
          <div className="color-popup" style={{ left: 'calc(100% + 12px)', top: 0 }}>
            <div className="cp-label">Stroke Color</div>
            {PALETTE.map((row, ri) => (
              <div key={ri} className="cp-grid">
                {row.map(c => (
                  <div
                    key={c}
                    className={`cp-swatch${strokeColor === c ? ' sel' : ''}`}
                    style={{
                      background: c,
                      border: c === '#ffffff' ? '1px solid var(--border-default)' : 'none',
                    }}
                    onClick={() => { setStrokeColor(c); setShowColors(false); }}
                    title={c}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Stroke width ── */}
      <div className="toolbar-sep" />
      <div className="toolbar-group-label">Width</div>
      {STROKE_SIZES.map(size => (
        <button
          key={size}
          className={`tool-btn${strokeWidth === size ? ' active' : ''}`}
          onClick={() => setStrokeWidth(size)}
          title={`${size}px`}
          style={{ paddingTop: 7, paddingBottom: 7 }}
        >
          <div style={{
            width: 20, height: size, borderRadius: size / 2,
            background: strokeColor,
            maxHeight: 14, minHeight: 1,
            transition: 'all 0.1s',
          }} />
        </button>
      ))}
    </div>
  );
}