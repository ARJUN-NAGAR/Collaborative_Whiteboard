import { Eye, EyeOff, Lock, Unlock, Square, Circle, Minus, MoveRight, Type, StickyNote, Pencil } from 'lucide-react';

const TYPE_ICONS = {
  rect:      Square,
  rectangle: Square,
  circle:    Circle,
  ellipse:   Circle,
  line:      Minus,
  arrow:     MoveRight,
  text:      Type,
  sticky:    StickyNote,
  pen:       Pencil,
  freehand:  Pencil,
};

const TYPE_COLORS = {
  rect:      '#6366f1',
  rectangle: '#6366f1',
  circle:    '#06b6d4',
  ellipse:   '#06b6d4',
  line:      '#94a3b8',
  arrow:     '#f59e0b',
  text:      '#10b981',
  sticky:    '#f59e0b',
  pen:       '#ec4899',
  freehand:  '#ec4899',
};

function getLabel(el) {
  if (el.text || el.content) {
    const t = (el.text || el.content || '').trim();
    return t.length > 22 ? t.slice(0, 22) + '…' : t || el.type;
  }
  return el.type?.charAt(0).toUpperCase() + el.type?.slice(1) || 'Element';
}

export default function LayersPanel({
  elements = [],
  selectedIds = new Set(),
  onSelect,
  onToggleHidden,
  onToggleLocked,
}) {
  // Reverse zIndex order so top elements appear first
  const sorted = [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  if (sorted.length === 0) {
    return (
      <div className="empty-state">
        No elements yet.<br />Start drawing on the canvas.
      </div>
    );
  }

  return (
    <div className="layers-list">
      {sorted.map((el, idx) => {
        const Icon  = TYPE_ICONS[el.type] || Square;
        const color = TYPE_COLORS[el.type] || 'var(--accent)';
        const isSelected = selectedIds.has(el.id);
        const isHidden   = el.hidden;
        const isLocked   = el.locked;

        return (
          <div
            key={el.id}
            className={`layer-row${isSelected ? ' active' : ''}${isHidden ? ' layer-row--hidden' : ''}`}
            onClick={() => onSelect?.(el.id)}
            style={{ opacity: isHidden ? 0.4 : 1 }}
            title={`${el.type} — zIndex ${el.zIndex || 0}`}
          >
            {/* Type icon */}
            <div
              className="layer-icon"
              style={{
                background: `${color}18`,
                color,
              }}
            >
              <Icon size={13} />
            </div>

            {/* Label + meta */}
            <div className="layer-copy">
              <div className="layer-title">{getLabel(el)}</div>
              <div className="layer-meta">{el.type} · z{el.zIndex || 0}</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              <button
                className="layer-btn"
                title={isHidden ? 'Show layer' : 'Hide layer'}
                onClick={(e) => { e.stopPropagation(); onToggleHidden?.(el); }}
              >
                {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <button
                className="layer-btn"
                title={isLocked ? 'Unlock layer' : 'Lock layer'}
                onClick={(e) => { e.stopPropagation(); onToggleLocked?.(el); }}
              >
                {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}