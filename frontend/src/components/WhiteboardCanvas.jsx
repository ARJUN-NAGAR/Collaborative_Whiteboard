import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';

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
    if (el.fillColor && el.fillColor !== 'transparent') { ctx.fillStyle = el.fillColor; ctx.fillRect(el.x1, el.y1, w, h); }
    ctx.strokeRect(el.x1, el.y1, w, h);
  } else if (el.type === 'circle') {
    const cx = (el.x1 + el.x2) / 2, cy = (el.y1 + el.y2) / 2;
    const rx = Math.abs(el.x2 - el.x1) / 2, ry = Math.abs(el.y2 - el.y1) / 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (el.fillColor && el.fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (el.type === 'line') {
    ctx.beginPath(); ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
  } else if (el.type === 'arrow') {
    const dx = el.x2 - el.x1, dy = el.y2 - el.y1;
    const angle = Math.atan2(dy, dx);
    const headLen = 16;
    ctx.beginPath(); ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(el.x2, el.y2);
    ctx.lineTo(el.x2 - headLen * Math.cos(angle - Math.PI / 6), el.y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(el.x2, el.y2);
    ctx.lineTo(el.x2 - headLen * Math.cos(angle + Math.PI / 6), el.y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  } else if (el.type === 'text') {
    ctx.font = `${el.fontSize || 18}px Inter, sans-serif`;
    ctx.fillStyle = el.color || '#fff';
    const lines = (el.text || '').split('\n');
    lines.forEach((line, i) => ctx.fillText(line, el.x, el.y + i * (el.fontSize || 18) * 1.3));
  } else if (el.type === 'sticky') {
    ctx.fillStyle = el.bgColor || '#fbbf24';
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 8;
    ctx.fillRect(el.x, el.y, el.width || 160, el.height || 120);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `13px Inter, sans-serif`;
    const words = (el.text || '').split(' ');
    let line = '', lines2 = [], maxW = (el.width || 160) - 16;
    words.forEach(w => {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > maxW && line) { lines2.push(line.trim()); line = w + ' '; }
      else line = test;
    });
    if (line) lines2.push(line.trim());
    lines2.forEach((l, i) => ctx.fillText(l, el.x + 8, el.y + 20 + i * 16));
  }
  ctx.restore();
}

const WhiteboardCanvas = forwardRef(function WhiteboardCanvas(
  { elements, tool, color, strokeWidth, user, remoteUsers, onAddElement, onCursorMove, onClear },
  ref
) {
  const canvasRef = useRef(null);
  const activeCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentEl = useRef(null);
  const [textInput, setTextInput] = useState(null);

  useImperativeHandle(ref, () => ({ getCanvas: () => canvasRef.current }));

  // Resize canvases
  useEffect(() => {
    const resize = () => {
      [canvasRef, activeCanvasRef].forEach(r => {
        if (r.current) {
          r.current.width = r.current.offsetWidth;
          r.current.height = r.current.offsetHeight;
        }
      });
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elements.forEach(el => drawElement(ctx, el));
  }, [elements]);

  useEffect(() => { redraw(); }, [elements, redraw]);

  const getPos = (e) => {
    const rect = (e.target || canvasRef.current).getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const onPointerDown = (e) => {
    if (tool === 'text') {
      const pos = getPos(e);
      setTextInput({ x: pos.x, y: pos.y });
      return;
    }
    if (tool === 'sticky') {
      const pos = getPos(e);
      const COLORS = ['#fbbf24','#34d399','#60a5fa','#f87171','#c084fc'];
      const el = { id: crypto.randomUUID(), type: 'sticky', x: pos.x, y: pos.y, width: 160, height: 120, text: 'Double-click to edit', bgColor: COLORS[Math.floor(Math.random() * COLORS.length)], userId: user.id };
      onAddElement(el);
      return;
    }
    setIsDrawing(true);
    const pos = getPos(e);
    if (tool === 'pen' || tool === 'eraser') {
      currentEl.current = { id: crypto.randomUUID(), type: 'pen', points: [pos], color: tool === 'eraser' ? '#111118' : color, strokeWidth: tool === 'eraser' ? strokeWidth * 4 : strokeWidth, userId: user.id };
    } else {
      currentEl.current = { id: crypto.randomUUID(), type: tool, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, color, strokeWidth, userId: user.id };
    }
  };

  const onPointerMove = (e) => {
    const pos = getPos(e);
    onCursorMove(pos.x, pos.y);
    if (!isDrawing || !currentEl.current) return;
    const activeCtx = activeCanvasRef.current?.getContext('2d');
    if (!activeCtx) return;
    activeCtx.clearRect(0, 0, activeCanvasRef.current.width, activeCanvasRef.current.height);
    if (currentEl.current.points) {
      currentEl.current.points.push(pos);
    } else {
      currentEl.current.x2 = pos.x;
      currentEl.current.y2 = pos.y;
    }
    drawElement(activeCtx, currentEl.current);
  };

  const onPointerUp = () => {
    if (!isDrawing || !currentEl.current) return;
    setIsDrawing(false);
    activeCanvasRef.current?.getContext('2d')?.clearRect(0, 0, activeCanvasRef.current.width, activeCanvasRef.current.height);
    const el = currentEl.current;
    currentEl.current = null;
    if (el.type === 'pen' && el.points.length < 2) return;
    onAddElement(el);
  };

  const commitText = (text) => {
    if (text.trim()) {
      onAddElement({ id: crypto.randomUUID(), type: 'text', x: textInput.x, y: textInput.y, text, color, fontSize: 18, userId: user.id });
    }
    setTextInput(null);
  };

  return (
    <div style={{ position:'absolute', inset:0 }}>
      <canvas ref={canvasRef} className="canvas-layer" style={{ zIndex: 10 }} />
      <canvas
        ref={activeCanvasRef}
        className="canvas-layer"
        style={{ zIndex: 20, cursor: tool === 'eraser' ? 'cell' : tool === 'text' || tool === 'sticky' ? 'crosshair' : 'crosshair' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Remote cursors */}
      {Object.entries(remoteUsers).map(([id, u]) => (
        <div key={id} className="remote-cursor" style={{ transform: `translate(${u.x}px, ${u.y}px)`, zIndex: 50, '--cursor-color': u.color }}>
          <svg width="18" height="18" viewBox="0 0 24 24" className="cursor-arrow">
            <path d="M5 3l14 9-7 2-2 7z" fill={u.color} stroke="white" strokeWidth="1.5" />
          </svg>
          <div className="cursor-label">{u.name}</div>
        </div>
      ))}

      {/* Text input overlay */}
      {textInput && (
        <textarea
          autoFocus
          style={{ position:'absolute', left: textInput.x, top: textInput.y, zIndex:100, background:'rgba(0,0,0,0.7)', color, border:`2px solid ${color}`, borderRadius:6, padding:'4px 8px', font:'18px Inter,sans-serif', outline:'none', resize:'none', minWidth:120, minHeight:36 }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(e.target.value); } if (e.key === 'Escape') setTextInput(null); }}
          onBlur={e => commitText(e.target.value)}
        />
      )}
    </div>
  );
});

export default WhiteboardCanvas;
