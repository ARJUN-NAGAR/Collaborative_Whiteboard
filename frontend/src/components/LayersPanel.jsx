import { Eye, EyeOff, Lock, MousePointer2, StickyNote, Type, Unlock } from 'lucide-react';

const TYPE_LABELS = {
  pen: 'Freehand stroke',
  rect: 'Rectangle',
  circle: 'Circle',
  line: 'Line',
  arrow: 'Arrow',
  text: 'Text',
  sticky: 'Sticky note',
};

function LayerIcon({ type }) {
  if (type === 'text') return <Type size={14} />;
  if (type === 'sticky') return <StickyNote size={14} />;
  return <MousePointer2 size={14} />;
}

export default function LayersPanel({
  elements,
  selectedIds,
  onSelect,
  onToggleHidden,
  onToggleLocked,
}) {
  const sorted = [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  if (!sorted.length) {
    return <div className="empty-state">Layers appear here as you add shapes, notes, and text.</div>;
  }

  return (
    <div className="layers-list">
      {sorted.map((element) => {
        const label = element.text?.trim()
          ? element.text.trim().slice(0, 36)
          : TYPE_LABELS[element.type] || element.type || 'Element';
        const active = selectedIds.has(element.id);

        return (
          <div
            key={element.id}
            className={`layer-row ${active ? 'active' : ''}`}
            onClick={() => onSelect(element.id)}
          >
            <div className="layer-icon"><LayerIcon type={element.type} /></div>
            <div className="layer-copy">
              <div className="layer-title">{label}</div>
              <div className="layer-meta">z {element.zIndex || 0}</div>
            </div>
            <button
              className="layer-btn"
              onClick={(event) => {
                event.stopPropagation();
                onToggleHidden(element);
              }}
              title={element.hidden ? 'Show layer' : 'Hide layer'}
            >
              {element.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              className="layer-btn"
              onClick={(event) => {
                event.stopPropagation();
                onToggleLocked(element);
              }}
              title={element.locked ? 'Unlock layer' : 'Lock layer'}
            >
              {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
