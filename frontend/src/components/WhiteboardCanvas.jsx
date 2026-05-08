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

const isHit = (el, x, y) => {
  const pad = 10;
  if (el.type === 'rect' || el.type === 'sticky') {
    const minX = Math.min(el.x1 || el.x, el.x2 || (el.x + (el.width||160)));
    const maxX = Math.max(el.x1 || el.x, el.x2 || (el.x + (el.width||160)));
    const minY = Math.min(el.y1 || el.y, el.y2 || (el.y + (el.height||120)));
    const maxY = Math.max(el.y1 || el.y, el.y2 || (el.y + (el.height||120)));
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
    return x >= el.x - pad && x <= el.x + 100 && y >= el.y - 20 && y <= el.y + 40;
  }
  if (el.type === 'pen') {
    return el.points?.some(p => Math.hypot(p.x - x, p.y - y) < pad);
  }
  return false;
};

const WhiteboardCanvas = forwardRef(function WhiteboardCanvas(
  { elements, tool, color, strokeWidth, user, remoteUsers, onAddElement, onUpdateElement, onDeleteElement, onCursorMove, onClear },
  ref
) {
  const canvasRef = useRef(null);
  const activeCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentEl = useRef(null);
  const [textInput, setTextInput] = useState(null);

  // Selection & Dragging state
  const [selectedId, setSelectedId] = useState(null);
  const [draggingElement, setDraggingElement] = useState(null);
  const dragStartPos = useRef(null);
  const originalElement = useRef(null);

  // Pan & Zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = useRef(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    zoomIn: () => setScale(s => Math.min(s * 1.2, 5)),
    zoomOut: () => setScale(s => Math.max(s / 1.2, 0.1)),
    resetZoom: () => { setScale(1); setPan({ x: 0, y: 0 }); }
  }));

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
    
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);
    
    elements.forEach(el => {
      // Don't draw the element being dragged on the main canvas
      if (draggingElement && el.id === draggingElement.id) return;
      drawElement(ctx, el);
    });

    // Draw selection box
    if (selectedId && !draggingElement) {
      const sel = elements.find(e => e.id === selectedId);
      if (sel) {
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);
        
        // Rough bounding box
        let minX=0, minY=0, w=0, h=0;
        if (sel.type === 'rect' || sel.type === 'sticky') {
          minX = Math.min(sel.x1 || sel.x, sel.x2 || (sel.x + (sel.width||160)));
          minY = Math.min(sel.y1 || sel.y, sel.y2 || (sel.y + (sel.height||120)));
          w = Math.abs((sel.x2 || (sel.x + (sel.width||160))) - minX);
          h = Math.abs((sel.y2 || (sel.y + (sel.height||120))) - minY);
        } else if (sel.type === 'circle') {
          const cx = (sel.x1 + sel.x2) / 2, cy = (sel.y1 + sel.y2) / 2;
          const rx = Math.abs(sel.x2 - sel.x1) / 2, ry = Math.abs(sel.y2 - sel.y1) / 2;
          minX = cx - rx; minY = cy - ry; w = rx*2; h = ry*2;
        } else if (sel.type === 'line' || sel.type === 'arrow') {
          minX = Math.min(sel.x1, sel.x2); minY = Math.min(sel.y1, sel.y2);
          w = Math.abs(sel.x2 - sel.x1); h = Math.abs(sel.y2 - sel.y1);
        } else if (sel.type === 'text') {
          minX = sel.x; minY = sel.y - 20; w = 100; h = 40;
        } else if (sel.type === 'pen' && sel.points?.length > 0) {
          minX = Math.min(...sel.points.map(p => p.x));
          minY = Math.min(...sel.points.map(p => p.y));
          w = Math.max(...sel.points.map(p => p.x)) - minX;
          h = Math.max(...sel.points.map(p => p.y)) - minY;
        }
        
        ctx.strokeRect(minX - 5, minY - 5, w + 10, h + 10);
        ctx.setLineDash([]);
        
        if (sel.isLocked) {
          ctx.fillStyle = '#ef4444';
          ctx.font = `${12/scale}px sans-serif`;
          ctx.fillText('🔒 Locked', minX - 5, minY - 10);
        }
      }
    }
    
    ctx.restore();
  }, [elements, pan, scale, selectedId, draggingElement]);

  useEffect(() => { redraw(); }, [elements, pan, scale, selectedId, draggingElement, redraw]);

  const getPos = (e) => {
    const rect = (e.target || canvasRef.current).getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left - pan.x) / scale,
      y: (clientY - rect.top - pan.y) / scale
    };
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.1, Math.min(scale * zoomFactor, 5));
      
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPan(prev => ({
        x: mouseX - (mouseX - prev.x) * (newScale / scale),
        y: mouseY - (mouseY - prev.y) * (newScale / scale)
      }));
      setScale(newScale);
    } else {
      // Pan
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  // Attach wheel listener natively to prevent passive event warning
  useEffect(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [scale, pan]);

  const onPointerDown = (e) => {
    if (e.button === 1 || tool === 'pan') {
      setIsPanning(true);
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const pos = getPos(e);

    if (tool === 'select') {
      const hit = [...elements].reverse().find(el => isHit(el, pos.x, pos.y));
      if (hit) {
        setSelectedId(hit.id);
        if (!hit.isLocked) {
          dragStartPos.current = pos;
          originalElement.current = hit;
          setDraggingElement(hit);
        }
      } else {
        setSelectedId(null);
      }
      return;
    }

    setSelectedId(null);

    if (tool === 'text') {
      setTextInput({ x: pos.x, y: pos.y });
      return;
    }
    if (tool === 'sticky') {
      const COLORS = ['#fbbf24','#34d399','#60a5fa','#f87171','#c084fc'];
      const el = { id: crypto.randomUUID(), type: 'sticky', x: pos.x, y: pos.y, width: 160, height: 120, text: 'Double-click to edit', bgColor: COLORS[Math.floor(Math.random() * COLORS.length)], userId: user.id };
      onAddElement(el);
      return;
    }
    setIsDrawing(true);
    if (tool === 'pen' || tool === 'eraser') {
      currentEl.current = { id: crypto.randomUUID(), type: 'pen', points: [pos], color: tool === 'eraser' ? '#111118' : color, strokeWidth: tool === 'eraser' ? strokeWidth * 4 : strokeWidth, userId: user.id };
    } else {
      currentEl.current = { id: crypto.randomUUID(), type: tool, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, color, strokeWidth, userId: user.id };
    }
  };

  const onPointerMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const pos = getPos(e);
    // Send absolute screen position or world coordinates for cursor?
    // Usually world coordinates makes sense so users see where the cursor actually is on the drawing!
    onCursorMove(pos.x, pos.y);
    
    if (!isDrawing || !currentEl.current) return;
    const activeCtx = activeCanvasRef.current?.getContext('2d');
    if (!activeCtx) return;
    
    activeCtx.clearRect(0, 0, activeCanvasRef.current.width, activeCanvasRef.current.height);
    
    activeCtx.save();
    activeCtx.translate(pan.x, pan.y);
    activeCtx.scale(scale, scale);
    
    if (tool === 'select' && draggingElement && originalElement.current) {
      const dx = pos.x - dragStartPos.current.x;
      const dy = pos.y - dragStartPos.current.y;
      
      const newEl = JSON.parse(JSON.stringify(originalElement.current)); // Deep clone
      if (newEl.type === 'pen') {
        newEl.points.forEach(p => { p.x += dx; p.y += dy; });
      } else if (newEl.type === 'rect' || newEl.type === 'circle' || newEl.type === 'line' || newEl.type === 'arrow') {
        newEl.x1 += dx; newEl.y1 += dy; newEl.x2 += dx; newEl.y2 += dy;
      } else {
        newEl.x += dx; newEl.y += dy;
      }
      
      drawElement(activeCtx, newEl);
      setDraggingElement(newEl);
      activeCtx.restore();
      return;
    }

    if (currentEl.current.points) {
      currentEl.current.points.push(pos);
    } else {
      currentEl.current.x2 = pos.x;
      currentEl.current.y2 = pos.y;
    }
    drawElement(activeCtx, currentEl.current);
    activeCtx.restore();
  };

  const onPointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      lastPanPos.current = null;
      return;
    }
    
    if (tool === 'select' && draggingElement) {
      onUpdateElement(draggingElement);
      setDraggingElement(null);
      originalElement.current = null;
      activeCanvasRef.current?.getContext('2d')?.clearRect(0, 0, activeCanvasRef.current.width, activeCanvasRef.current.height);
      return;
    }

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

  const toggleLock = () => {
    const el = elements.find(e => e.id === selectedId);
    if (el && onUpdateElement) {
      onUpdateElement({ ...el, isLocked: !el.isLocked });
    }
  };

  return (
    <div style={{ position:'absolute', inset:0 }}>
      {/* Contextual Action Bar for Selected Element */}
      {selectedId && !draggingElement && tool === 'select' && (
        <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(14,14,26,0.9)', border: '1px solid var(--purple)', borderRadius: '8px', padding: '6px 12px', display: 'flex', gap: '8px', backdropFilter: 'blur(10px)' }}>
          <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={toggleLock}>
            {elements.find(e => e.id === selectedId)?.isLocked ? 'Unlock' : 'Lock'}
          </button>
          {!elements.find(e => e.id === selectedId)?.isLocked && (
            <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => {
              if (onDeleteElement) {
                onDeleteElement(selectedId);
                setSelectedId(null);
              }
            }}>
              Delete
            </button>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="canvas-layer" style={{ zIndex: 10 }} />
      <canvas
        ref={activeCanvasRef}
        className="canvas-layer"
        style={{ zIndex: 20, cursor: isPanning || tool === 'pan' ? 'grabbing' : tool === 'eraser' ? 'cell' : tool === 'text' || tool === 'sticky' ? 'crosshair' : 'crosshair' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Remote cursors */}
      {Object.entries(remoteUsers).map(([id, u]) => (
        <div key={id} className="remote-cursor" style={{ transform: `translate(${u.x * scale + pan.x}px, ${u.y * scale + pan.y}px)`, zIndex: 50, '--cursor-color': u.color }}>
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
          style={{ position:'absolute', left: textInput.x * scale + pan.x, top: textInput.y * scale + pan.y, transform: `scale(${scale})`, transformOrigin: 'top left', zIndex:100, background:'rgba(0,0,0,0.7)', color, border:`2px solid ${color}`, borderRadius:6, padding:'4px 8px', font:'18px Inter,sans-serif', outline:'none', resize:'none', minWidth:120, minHeight:36 }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(e.target.value); } if (e.key === 'Escape') setTextInput(null); }}
          onBlur={e => commitText(e.target.value)}
        />
      )}
    </div>
  );
});

export default WhiteboardCanvas;
