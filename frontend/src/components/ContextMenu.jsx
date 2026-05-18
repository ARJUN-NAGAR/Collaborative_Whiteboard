import { useEffect, useRef } from 'react';
import { Copy, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Lock, Unlock, Edit3 } from 'lucide-react';

export default function ContextMenu({
  x, y, selectedIds = new Set(), elements = [], onClose,
  onDuplicate, onDelete, onLayerUp, onLayerDown,
  onToggleHidden, onToggleLocked, onEditText,
}) {
  const menuRef = useRef(null);
  const selectedEl = selectedIds.size === 1 ? elements.find(e => e.id === [...selectedIds][0]) : null;
  const hasSelection = selectedIds.size > 0;
  const isHidden = selectedEl?.hidden;
  const isLocked = selectedEl?.locked;
  const isText   = selectedEl?.type === 'text' || selectedEl?.type === 'sticky';

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { offsetWidth: w, offsetHeight: h } = el;
    const vw = window.innerWidth, vh = window.innerHeight;
    let nx = x, ny = y;
    if (x + w > vw - 8) nx = vw - w - 8;
    if (y + h > vh - 8) ny = vh - h - 8;
    el.style.left = `${nx}px`;
    el.style.top  = `${ny}px`;
  }, [x, y]);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const act = (fn) => { fn?.(); onClose(); };

  return (
    <div ref={menuRef} className="ctx-menu" style={{ position: 'fixed', left: x, top: y, zIndex: 900 }} onContextMenu={e => e.preventDefault()}>
      {isText && hasSelection && (
        <div className="ctx-section">
          <CtxItem icon={<Edit3 size={13} />} label="Edit text" onClick={() => act(onEditText)} />
        </div>
      )}
      {hasSelection && (
        <div className="ctx-section">
          <div className="ctx-section-label">Arrange</div>
          <CtxItem icon={<ArrowUp   size={13} />} label="Bring forward" shortcut="⌘]" onClick={() => act(onLayerUp)} />
          <CtxItem icon={<ArrowDown size={13} />} label="Send backward"  shortcut="⌘[" onClick={() => act(onLayerDown)} />
        </div>
      )}
      {hasSelection && (
        <div className="ctx-section">
          <div className="ctx-section-label">Edit</div>
          <CtxItem icon={<Copy size={13} />} label="Duplicate" shortcut="⌘D" onClick={() => act(onDuplicate)} />
          <CtxItem icon={isHidden ? <Eye size={13}/> : <EyeOff size={13}/>} label={isHidden ? 'Show' : 'Hide'} onClick={() => act(onToggleHidden)} />
          <CtxItem icon={isLocked ? <Unlock size={13}/> : <Lock size={13}/>} label={isLocked ? 'Unlock' : 'Lock'} onClick={() => act(onToggleLocked)} />
        </div>
      )}
      {hasSelection && (
        <div className="ctx-section">
          <CtxItem icon={<Trash2 size={13} />} label={`Delete${selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}`} shortcut="Del" danger onClick={() => act(onDelete)} />
        </div>
      )}
      {!hasSelection && (
        <div className="ctx-section">
          <div className="ctx-section-label">Canvas</div>
          <CtxItem icon={<Copy size={13} />} label="Select all" disabled />
        </div>
      )}
    </div>
  );
}

function CtxItem({ icon, label, shortcut, onClick, disabled, danger }) {
  return (
    <button
      className={`ctx-item${danger ? ' ctx-item--danger' : ''}${disabled ? ' ctx-item--disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <span className="ctx-item-icon">{icon}</span>
      <span className="ctx-item-label">{label}</span>
      {shortcut && <span className="ctx-item-shortcut">{shortcut}</span>}
    </button>
  );
}