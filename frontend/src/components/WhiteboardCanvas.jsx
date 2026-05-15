import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';

// ─── Drawing Helpers ─────────────────────────────────────────────────────────
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
    const cx = (el.x1 + el.x2) / 2, cy = (el.y1 + el.y2) / 2;
    const rx = Math.abs(el.x2 - el.x1) / 2, ry = Math.abs(el.y2 - el.y1) / 2;
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
    const dx = el.x2 - el.x1, dy = el.y2 - el.y1;
    const angle = Math.atan2(dy, dx);
    const headLen = 16;
    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
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
    lines2.forEach((l, i) => ctx.fillText(l, el.x + 8, el.y + 20 + i * 16));
  }
  ctx.restore();
}

function isHit(el, x, y) {
  const pad = 10;
  if (el.type === 'rect' || el.type === 'sticky') {
    const minX = Math.min(el.x1 ?? el.x, el.x2 ?? el.x + (el.width || 160));
    const maxX = Math.max(el.x1 ?? el.x, el.x2 ?? el.x + (el.width || 160));
    const minY = Math.min(el.y1 ?? el.y, el.y2 ?? el.y + (el.height || 120));
    const maxY = Math.max(el.y1 ?? el.y, el.y2 ?? el.y + (el.height || 120));
    return x >= minX - pad && x <= maxX + pad && y >= minY - pad && y <= maxY + pad;
  }
  if (el.type === 'circle') {
    const cx = (el.x1 + el.x2) / 2, cy = (el.y1 + el.y2) / 2;
    const rx = Math.abs(el.x2 - el.x1) / 2, ry = Math.abs(el.y2 - el.y1) / 2;
    return x >= cx - rx - pad && x <= cx + rx + pad && y >= cy - ry - pad && y <= cy + ry + pad;
  }
  if (el.type === 'line' || el.type === 'arrow') {
    const minX = Math.min(el.x1, el.x2), maxX = Math.max(el.x1, el.x2);
    const minY = Math.min(el.y1, el.y2), maxY = Math.max(el.y1, el.y2);
    return x >= minX - pad && x <= maxX + pad && y >= minY - pad && y <= maxY + pad;
  }
  if (el.type === 'text') {
    return x >= el.x - pad && x <= el.x + 150 && y >= el.y - 20 && y <= el.y + 40;
  }
  if (el.type === 'pen') {
    return el.points?.some((p) => Math.hypot(p.x - x, p.y - y) < pad + 2);
  }
  return false;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const WhiteboardCanvas = forwardRef(function WhiteboardCanvas({
  elements, tool, color, strokeWidth, user, remoteUsers,
  onAddElement, onUpdateElement, onDeleteElement, onCursorMove,
  onBringToFront, onSendToBack
}, ref) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const activeCanvasRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startPan = useRef({ x: 0, y: 0 });
  const currentElement = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const originalPos = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    zoomIn: () => setScale(s => Math.min(s * 1.2, 5)),
    zoomOut: () => setScale(s => Math.max(s / 1.2, 0.1)),
    resetZoom: () => { setScale(1); setPan({ x: 0, y: 0 }); }
  }));

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    const render = () => {
      // Handle resize
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(scale, scale);
      
      elements.forEach(el => {
        // Render all elements
        drawElement(ctx, el);
        
        // Highlight selection
        if (selectedId === el.id || selectedIds.has(el.id)) {
          ctx.strokeStyle = 'var(--accent, #7c5cfc)';
          ctx.lineWidth = 1 / scale;
          ctx.setLineDash([5 / scale, 5 / scale]);
          
          let minX, minY, maxX, maxY;
          if (el.type === 'rect' || el.type === 'circle' || el.type === 'line' || el.type === 'arrow') {
            minX = Math.min(el.x1, el.x2); maxX = Math.max(el.x1, el.x2);
            minY = Math.min(el.y1, el.y2); maxY = Math.max(el.y1, el.y2);
          } else if (el.type === 'sticky') {
            minX = el.x; maxX = el.x + (el.width || 160);
            minY = el.y; maxY = el.y + (el.height || 120);
          } else if (el.type === 'text') {
            minX = el.x; maxX = el.x + 100;
            minY = el.y - 20; maxY = el.y + 20;
          } else if (el.type === 'pen' && el.points?.length) {
            minX = Math.min(...el.points.map(p => p.x)); maxX = Math.max(...el.points.map(p => p.x));
            minY = Math.min(...el.points.map(p => p.y)); maxY = Math.max(...el.points.map(p => p.y));
          }
          
          if (minX !== undefined) {
            ctx.strokeRect(minX - 4, minY - 4, maxX - minX + 8, maxY - minY + 8);
          }
          ctx.setLineDash([]);
        }
      });
      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [elements, pan, scale, selectedId, selectedIds]);

  const getPointerPos = (e) => ({
    x: (e.clientX - pan.x) / scale,
    y: (e.clientY - pan.y) / scale
  });

  const handlePointerDown = (e) => {
    // Middle click or Pan tool
    if (e.button === 1 || tool === 'pan') {
      setIsPanning(true);
      startPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }
    
    const pos = getPointerPos(e);
    
    if (tool === 'select') {
      let hit = null;
      for (let i = elements.length - 1; i >= 0; i--) {
         if (isHit(elements[i], pos.x, pos.y)) { hit = elements[i]; break; }
      }
      if (hit) {
         setSelectedId(hit.id);
         setIsDragging(true);
         dragOffset.current = { x: pos.x - (hit.x ?? hit.x1 ?? 0), y: pos.y - (hit.y ?? hit.y1 ?? 0) };
         originalPos.current = { x1: hit.x1, y1: hit.y1, x2: hit.x2, y2: hit.y2, x: hit.x, y: hit.y };
      } else {
         setSelectedId(null);
         setSelectedIds(new Set());
      }
      return;
    }
    
    // Start drawing
    setIsDrawing(true);
    setSelectedId(null);
    setSelectedIds(new Set());
    
    currentElement.current = {
      id: crypto.randomUUID(),
      type: tool,
      color,
      strokeWidth,
      x1: pos.x, y1: pos.y,
      x2: pos.x, y2: pos.y,
      x: pos.x, y: pos.y, // For sticky/text
      points: [{ x: pos.x, y: pos.y }],
      text: tool === 'text' ? 'New Text' : tool === 'sticky' ? 'New Note' : undefined
    };
  };

  const handlePointerMove = (e) => {
    const pos = getPointerPos(e);
    if (onCursorMove) onCursorMove(pos.x, pos.y);
    
    if (isPanning) {
      setPan({ x: e.clientX - startPan.current.x, y: e.clientY - startPan.current.y });
      return;
    }
    
    if (isDragging && selectedId) {
      const el = elements.find(el => el.id === selectedId);
      if (el) {
         const newX = pos.x - dragOffset.current.x;
         const newY = pos.y - dragOffset.current.y;
         const dx = newX - (el.x ?? el.x1 ?? 0);
         const dy = newY - (el.y ?? el.y1 ?? 0);
         
         const newEl = { ...el };
         if (newEl.x !== undefined) newEl.x += dx;
         if (newEl.y !== undefined) newEl.y += dy;
         if (newEl.x1 !== undefined) { newEl.x1 += dx; newEl.x2 += dx; }
         if (newEl.y1 !== undefined) { newEl.y1 += dy; newEl.y2 += dy; }
         if (newEl.points) newEl.points = newEl.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
         onUpdateElement(newEl);
      }
      return;
    }
    
    if (isDrawing && currentElement.current) {
      currentElement.current.x2 = pos.x;
      currentElement.current.y2 = pos.y;
      if (tool === 'pen') {
         currentElement.current.points.push({ x: pos.x, y: pos.y });
      }
      
      // Render active element on activeCanvas
      const canvas = activeCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(scale, scale);
      drawElement(ctx, currentElement.current);
      ctx.restore();
    }
  };

  const handlePointerUp = (e) => {
    setIsPanning(false);
    setIsDragging(false);
    if (isDrawing && currentElement.current) {
      setIsDrawing(false);
      onAddElement(currentElement.current);
      currentElement.current = null;
      const canvas = activeCanvasRef.current;
      if (canvas) {
         const ctx = canvas.getContext('2d');
         ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 5);
      const dx = e.clientX - pan.x;
      const dy = e.clientY - pan.y;
      setPan({ x: e.clientX - dx * (newScale / scale), y: e.clientY - dy * (newScale / scale) });
      setScale(newScale);
    } else {
      // Pan
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [pan, scale]);

  const selectedEl = selectedId ? elements.find((e) => e.id === selectedId) : null;
  const multiCount = selectedIds.size;
  const hasActionBar = (selectedId && !isDragging && tool === 'select') || multiCount > 1;

  return (
    <div 
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Contextual Action Bar */}
      {hasActionBar && (
        <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '6px 12px', display: 'flex', gap: 6, backdropFilter: 'blur(12px)', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
          {selectedEl && onBringToFront && (
            <button className="btn btn-secondary btn-sm" onClick={() => onBringToFront(selectedId)}>Bring Front</button>
          )}
          {selectedEl && onSendToBack && (
            <button className="btn btn-secondary btn-sm" onClick={() => onSendToBack(selectedId)}>Send Back</button>
          )}
          <button className="btn btn-danger btn-sm" style={{ color: 'var(--error)' }} onClick={() => {
            if (selectedId) { onDeleteElement(selectedId); setSelectedId(null); }
          }}>Delete</button>
        </div>
      )}

      <canvas ref={canvasRef} className="canvas-layer" style={{ zIndex: 10 }} />
      <canvas ref={activeCanvasRef} className="canvas-layer" style={{ zIndex: 20, cursor: tool === 'eraser' ? 'cell' : tool === 'select' ? 'default' : 'crosshair' }} />

      {/* Remote cursors */}
      {Object.entries(remoteUsers).map(([id, u]) => (
        <div key={id} className="remote-cursor" style={{ transform: `translate(${u.x * scale + pan.x}px, ${u.y * scale + pan.y}px)`, zIndex: 50, '--cursor-color': u.color }}>
          <svg width="18" height="18" viewBox="0 0 24 24" className="cursor-arrow">
            <path d="M5 3l14 9-7 2-2 7z" fill={u.color} stroke="white" strokeWidth="1.5" />
          </svg>
          <div className="cursor-label">{u.name}</div>
        </div>
      ))}
    </div>
  );
});

export default WhiteboardCanvas;