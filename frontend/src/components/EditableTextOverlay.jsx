import { useEffect, useRef, useState } from 'react';

/**
 * EditableTextOverlay
 * Renders an auto-growing textarea positioned over the canvas at world coordinates.
 * Submits on Enter (no shift), cancels on Escape.
 */
export default function EditableTextOverlay({
  text = '',
  x,
  y,
  color = '#111827',
  fontSize = 18,
  zoom,
  panOffset,
  onSave,
  onCancel,
}) {
  const [value, setValue] = useState(text);
  const ref = useRef(null);

  // Screen position from world coordinates
  const screenX = x * zoom + panOffset.x;
  const screenY = y * zoom + panOffset.y;

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.select();
      autoResize(ref.current);
    }
  }, []);

  const autoResize = (el) => {
    el.style.height = 'auto';
    el.style.width  = 'auto';
    el.style.height = `${el.scrollHeight}px`;
    el.style.width  = `${Math.max(el.scrollWidth, 120)}px`;
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(value);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    autoResize(e.target);
  };

  return (
    <div
      style={{
        position:  'absolute',
        left:       screenX,
        top:        screenY,
        zIndex:     500,
        pointerEvents: 'all',
      }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKey}
        onBlur={() => onSave(value)}
        rows={1}
        style={{
          background:   'rgba(255,255,255,0.06)',
          border:       '1.5px solid var(--accent)',
          borderRadius: '4px',
          padding:      '4px 8px',
          color,
          fontSize:      fontSize * zoom,
          fontFamily:   'var(--font)',
          lineHeight:    1.5,
          outline:      'none',
          resize:       'none',
          overflow:     'hidden',
          minWidth:     120,
          maxWidth:     600,
          backdropFilter: 'blur(8px)',
          boxShadow:    '0 0 0 3px var(--accent-glow)',
          transition:   'box-shadow 0.15s',
        }}
      />
      <div style={{
        fontSize:   '0.6rem',
        color:      'var(--text-muted)',
        marginTop:  3,
        padding:    '2px 6px',
        background: 'var(--bg-elevated)',
        border:     '1px solid var(--border-subtle)',
        borderRadius: 4,
        display:    'inline-block',
      }}>
        Enter to save · Esc to cancel
      </div>
    </div>
  );
}