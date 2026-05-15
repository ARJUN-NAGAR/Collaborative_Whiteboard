import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';

// ─── Drawing ────────────────────────────────────────────────────────────────
function drawElement(ctx, el) {
  ctx.save();
  ctx.strokeStyle = el.color || '#fff';
  ctx.fillStyle = el.fillColor || 'transparent';
  ctx.lineWidth = el.strokeWidth || 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (el.type === 'pen' && el.points?.length > 1) {
    ctx.beginPath();
    ctx.moveTo(el.points[0].x, el.points[0].y);
    for (let i = 1; i < el.points.length - 1; i++) {
      const mx = (el.points[i].x + el.points[i + 1].x) / 2;
      const my = (el.points[i].y + el.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, mx, my);
    }
    ctx.lineTo(el.points[el.points.length - 1].x, el.points[el.points.length - 1].y);
    ctx.stroke();
  } else if (el.type === 'rect') {
    const w = el.x2 - el.x1, h = el.y2 - el.y1;
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor;
      ctx.fillRect(el.x1, el.y1, w, h);
    }
    ctx.strokeRect(el.x1, el.y1, w, h);
  } else if (el.type === 'circle') {
    const cx = (el.x1 + el.x2) / 2,
      cy = (el.y1 + el.y2) / 2;
    const rx = Math.abs(el.x2 - el.x1) / 2,
      ry = Math.abs(el.y2 - el.y1) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (el.fillColor && el.fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (el.type === 'line') {
    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
  } else if (el.type === 'arrow') {
    const dx = el.x2 - el.x1,
      dy = el.y2 - el.y1;
    const angle = Math.atan2(dy, dx);
    const headLen = 16;

    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(el.x2, el.y2);
    ctx.lineTo(
      el.x2 - headLen * Math.cos(angle - Math.PI / 6),
      el.y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(el.x2, el.y2);
    ctx.lineTo(
      el.x2 - headLen * Math.cos(angle + Math.PI / 6),
      el.y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  } else if (el.type === 'text') {
    ctx.font = `${el.fontSize || 18}px Inter, sans-serif`;
    ctx.fillStyle = el.color || '#fff';

    const lines = (el.text || '').split('\n');
    lines.forEach((line, i) =>
      ctx.fillText(line, el.x, el.y + i * (el.fontSize || 18) * 1.3)
    );
  } else if (el.type === 'sticky') {
    ctx.fillStyle = el.bgColor || '#fbbf24';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 8;

    ctx.fillRect(el.x, el.y, el.width || 160, el.height || 120);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `13px Inter, sans-serif`;

    const words = (el.text || '').split(' ');
    let line = '';
    let lines2 = [];
    let maxW = (el.width || 160) - 16;

    words.forEach((w) => {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        lines2.push(line.trim());
        line = w + ' ';
      } else {
        line = test;
      }
    });

    if (line) lines2.push(line.trim());

    lines2.forEach((l, i) =>
      ctx.fillText(l, el.x + 8, el.y + 20 + i * 16)
    );
  }

  ctx.restore();
}

// ─── Bounding box helpers ────────────────────────────────────────────────────
function getElementBoundingBox(el) {
  const pad = 0;

  if (
    el.type === 'rect' ||
    el.type === 'circle' ||
    el.type === 'line' ||
    el.type === 'arrow'
  ) {
    return {
      minX: Math.min(el.x1, el.x2) - pad,
      maxX: Math.max(el.x1, el.x2) + pad,
      minY: Math.min(el.y1, el.y2) - pad,
      maxY: Math.max(el.y1, el.y2) + pad,
    };
  }

  if (el.type === 'sticky') {
    return {
      minX: el.x,
      maxX: el.x + (el.width || 160),
      minY: el.y,
      maxY: el.y + (el.height || 120),
    };
  }

  if (el.type === 'text') {
    return {
      minX: el.x,
      maxX: el.x + 120,
      minY: el.y - 20,
      maxY: el.y + 20,
    };
  }

  if (el.type === 'pen' && el.points?.length > 0) {
    return {
      minX: Math.min(...el.points.map((p) => p.x)),
      maxX: Math.max(...el.points.map((p) => p.x)),
      minY: Math.min(...el.points.map((p) => p.y)),
      maxY: Math.max(...el.points.map((p) => p.y)),
    };
  }

  return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
}

const isHit = (el, x, y) => {
  const pad = 10;

  if (el.type === 'rect' || el.type === 'sticky') {
    const minX = Math.min(
      el.x1 ?? el.x,
      el.x2 ?? el.x + (el.width || 160)
    );
    const maxX = Math.max(
      el.x1 ?? el.x,
      el.x2 ?? el.x + (el.width || 160)
    );

    const minY = Math.min(
      el.y1 ?? el.y,
      el.y2 ?? el.y + (el.height || 120)
    );

    const maxY = Math.max(
      el.y1 ?? el.y,
      el.y2 ?? el.y + (el.height || 120)
    );

    return (
      x >= minX - pad &&
      x <= maxX + pad &&
      y >= minY - pad &&
      y <= maxY + pad
    );
  }

  if (el.type === 'circle') {
    const cx = (el.x1 + el.x2) / 2,
      cy = (el.y1 + el.y2) / 2;

    const rx = Math.abs(el.x2 - el.x1) / 2,
      ry = Math.abs(el.y2 - el.y1) / 2;

    return (
      x >= cx - rx - pad &&
      x <= cx + rx + pad &&
      y >= cy - ry - pad &&
      y <= cy + ry + pad
    );
  }

  if (el.type === 'line' || el.type === 'arrow') {
    const minX = Math.min(el.x1, el.x2),
      maxX = Math.max(el.x1, el.x2);

    const minY = Math.min(el.y1, el.y2),
      maxY = Math.max(el.y1, el.y2);

    return (
      x >= minX - pad &&
      x <= maxX + pad &&
      y >= minY - pad &&
      y <= maxY + pad
    );
  }

  if (el.type === 'text') {
    return (
      x >= el.x - pad &&
      x <= el.x + 150 &&
      y >= el.y - 20 &&
      y <= el.y + 40
    );
  }

  if (el.type === 'pen') {
    return el.points?.some(
      (p) => Math.hypot(p.x - x, p.y - y) < pad + 2
    );
  }

  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const WhiteboardCanvas = forwardRef(function WhiteboardCanvas(
  {
    elements,
    tool,
    color,
    strokeWidth,
    user,
    remoteUsers,
    onAddElement,
    onUpdateElement,
    onDeleteElement,
    onCursorMove,
    onClear,
    onBringToFront,
    onSendToBack,
  },
  ref
) {
  const canvasRef = useRef(null);
  const activeCanvasRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [draggingElement, setDraggingElement] = useState(null);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const selectedEl = selectedId
    ? elements.find((e) => e.id === selectedId)
    : null;

  const multiCount = selectedIds.size;

  const hasActionBar =
    (selectedId && !draggingElement && tool === 'select') ||
    multiCount > 1;

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Contextual Action Bar */}
      {hasActionBar && (
        <div
          style={{
            position: 'absolute',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,

            // UPDATED TOKENS
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border-subtle)',

            borderRadius: 10,
            padding: '6px 12px',

            display: 'flex',
            gap: 6,

            backdropFilter: 'blur(12px)',
            flexWrap: 'wrap',
            alignItems: 'center',

            boxShadow: 'var(--shadow-md)',
          }}
        >
          {multiCount > 1 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                paddingRight: 6,

                // UPDATED TOKEN
                borderRight:
                  '1px solid var(--border-subtle)',
              }}
            >
              {multiCount} selected
            </span>
          )}

          {selectedEl &&
            !selectedEl.isLocked &&
            onBringToFront && (
              <button
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                }}
                onClick={() =>
                  onBringToFront(selectedId)
                }
              >
                Bring Front
              </button>
            )}

          {selectedEl &&
            !selectedEl.isLocked &&
            onSendToBack && (
              <button
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                }}
                onClick={() =>
                  onSendToBack(selectedId)
                }
              >
                Send Back
              </button>
            )}

          {selectedEl && (
            <button
              className="btn btn-secondary btn-sm"
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
              }}
            >
              {selectedEl.isLocked
                ? '🔓 Unlock'
                : '🔒 Lock'}
            </button>
          )}

          {(multiCount > 1 ||
            (selectedEl &&
              !selectedEl.isLocked)) && (
            <button
              className="btn btn-danger btn-sm"
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',

                // UPDATED TOKEN
                color: 'var(--error)',
              }}
              onClick={() => {
                if (selectedIds.size > 0) {
                  selectedIds.forEach((id) =>
                    onDeleteElement(id)
                  );
                  setSelectedIds(new Set());
                } else if (selectedId) {
                  onDeleteElement(selectedId);
                  setSelectedId(null);
                }
              }}
            >
              Delete
              {multiCount > 1
                ? ` (${multiCount})`
                : ''}
            </button>
          )}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="canvas-layer"
        style={{ zIndex: 10 }}
      />

      <canvas
        ref={activeCanvasRef}
        className="canvas-layer"
        style={{
          zIndex: 20,
          cursor:
            tool === 'eraser'
              ? 'cell'
              : tool === 'select'
              ? 'default'
              : 'crosshair',
        }}
      />

      {/* Remote cursors */}
      {Object.entries(remoteUsers).map(([id, u]) => (
        <div
          key={id}
          className="remote-cursor"
          style={{
            transform: `translate(${
              u.x * scale + pan.x
            }px, ${u.y * scale + pan.y}px)`,

            zIndex: 50,
            '--cursor-color': u.color,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className="cursor-arrow"
          >
            <path
              d="M5 3l14 9-7 2-2 7z"
              fill={u.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>

          <div className="cursor-label">
            {u.name}
          </div>
        </div>
      ))}
    </div>
  );
});

export default WhiteboardCanvas;