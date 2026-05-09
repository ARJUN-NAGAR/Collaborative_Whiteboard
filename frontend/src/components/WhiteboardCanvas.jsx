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

// ─── Bounding box helpers ────────────────────────────────────────────────────
function getElementBoundingBox(el) {
  const pad = 0;
  if (el.type === 'rect' || el.type === 'circle' || el.type === 'line' || el.type === 'arrow') {
    return {
      minX: Math.min(el.x1, el.x2) - pad,
      maxX: Math.max(el.x1, el.x2) + pad,
      minY: Math.min(el.y1, el.y2) - pad,
      maxY: Math.max(el.y1, el.y2) + pad,
    };
  }
  if (el.type === 'sticky') {
    return { minX: el.x, maxX: el.x + (el.width || 160), minY: el.y, maxY: el.y + (el.height || 120) };
  }
  if (el.type === 'text') {
    return { minX: el.x, maxX: el.x + 120, minY: el.y - 20, maxY: el.y + 20 };
  }
  if (el.type === 'pen' && el.points?.length > 0) {
    return {
      minX: Math.min(...el.points.map(p => p.x)),
      maxX: Math.max(...el.points.map(p => p.x)),
      minY: Math.min(...el.points.map(p => p.y)),
      maxY: Math.max(...el.points.map(p => p.y)),
    };
  }
  return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
}

const isHit = (el, x, y) => {
  const pad = 10;
  if (el.type === 'rect' || el.type === 'sticky') {
    const minX = Math.min(el.x1 ?? el.x, el.x2 ?? (el.x + (el.width || 160)));
    const maxX = Math.max(el.x1 ?? el.x, el.x2 ?? (el.x + (el.width || 160)));
    const minY = Math.min(el.y1 ?? el.y, el.y2 ?? (el.y + (el.height || 120)));
    const maxY = Math.max(el.y1 ?? el.y, el.y2 ?? (el.y + (el.height || 120)));
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
    return el.points?.some(p => Math.hypot(p.x - x, p.y - y) < pad + 2);
  }
  return false;
};

// Checks if element overlaps selection rectangle
function elementInSelectionBox(el, sx1, sx2, sy1, sy2) {
  const minSelX = Math.min(sx1, sx2), maxSelX = Math.max(sx1, sx2);
  const minSelY = Math.min(sy1, sy2), maxSelY = Math.max(sy1, sy2);
  const bb = getElementBoundingBox(el);
  return bb.maxX >= minSelX && bb.minX <= maxSelX && bb.maxY >= minSelY && bb.minY <= maxSelY;
}

// ─── Alignment Guide helpers ──────────────────────────────────────────────────
function getAlignmentGuides(movingEl, dx, dy, allElements, threshold = 6) {
  const guides = [];
  const mbb = getElementBoundingBox(movingEl);
  const mMinX = mbb.minX + dx, mMaxX = mbb.maxX + dx;
  const mMinY = mbb.minY + dy, mMaxY = mbb.maxY + dy;
  const mCX = (mMinX + mMaxX) / 2, mCY = (mMinY + mMaxY) / 2;

  allElements.forEach(el => {
    if (el.id === movingEl.id) return;
    const bb = getElementBoundingBox(el);
    const eCX = (bb.minX + bb.maxX) / 2, eCY = (bb.minY + bb.maxY) / 2;

    // Vertical alignment (X axis)
    const xChecks = [
      { mv: mMinX, ev: bb.minX, type: 'x' }, { mv: mMaxX, ev: bb.maxX, type: 'x' },
      { mv: mCX, ev: eCX, type: 'x' }, { mv: mMinX, ev: bb.maxX, type: 'x' },
      { mv: mMaxX, ev: bb.minX, type: 'x' },
    ];
    xChecks.forEach(({ mv, ev, type }) => {
      if (Math.abs(mv - ev) < threshold) {
        guides.push({ type: 'vertical', x: ev, snapDx: ev - mv });
      }
    });

    // Horizontal alignment (Y axis)
    const yChecks = [
      { mv: mMinY, ev: bb.minY, type: 'y' }, { mv: mMaxY, ev: bb.maxY, type: 'y' },
      { mv: mCY, ev: eCY, type: 'y' }, { mv: mMinY, ev: bb.maxY, type: 'y' },
      { mv: mMaxY, ev: bb.minY, type: 'y' },
    ];
    yChecks.forEach(({ mv, ev }) => {
      if (Math.abs(mv - ev) < threshold) {
        guides.push({ type: 'horizontal', y: ev, snapDy: ev - mv });
      }
    });
  });
  return guides;
}

// ─── Component ───────────────────────────────────────────────────────────────
const WhiteboardCanvas = forwardRef(function WhiteboardCanvas(
  {
    elements, tool, color, strokeWidth, user, remoteUsers,
    onAddElement, onUpdateElement, onDeleteElement, onCursorMove, onClear,
    onBringToFront, onSendToBack,
  },
  ref
) {
  const canvasRef = useRef(null);
  const activeCanvasRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const currentEl = useRef(null);
  const [textInput, setTextInput] = useState(null);

  // Selection & drag (single)
  const [selectedId, setSelectedId] = useState(null);
  const [draggingElement, setDraggingElement] = useState(null);
  const dragStartPos = useRef(null);
  const originalElement = useRef(null);

  // Multi-select
  const [selectionBox, setSelectionBox] = useState(null);
  const selBoxStart = useRef(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Double-click edit
  const [editingEl, setEditingEl] = useState(null); // { id, text }
  const editTextRef = useRef('');
  const lastClickTime = useRef(0);
  const lastClickId = useRef(null);

  // Alignment guides
  const [alignGuides, setAlignGuides] = useState([]);

  // Pan & Zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = useRef(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    zoomIn: () => setScale(s => Math.min(s * 1.2, 5)),
    zoomOut: () => setScale(s => Math.max(s / 1.2, 0.1)),
    resetZoom: () => { setScale(1); setPan({ x: 0, y: 0 }); },
  }));

  // Resize
  useEffect(() => {
    const resize = () => {
      [canvasRef, activeCanvasRef].forEach(r => {
        if (r.current) { r.current.width = r.current.offsetWidth; r.current.height = r.current.offsetHeight; }
      });
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ─── Redraw ─────────────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    elements.forEach(el => {
      if (draggingElement && el.id === draggingElement.id) return;
      // Dim element if it's being inline-edited
      if (editingEl && el.id === editingEl.id) {
        ctx.save(); ctx.globalAlpha = 0.3; drawElement(ctx, el); ctx.restore();
        return;
      }
      drawElement(ctx, el);
    });

    // Selection highlights
    const allSelected = new Set(selectedIds);
    if (selectedId) allSelected.add(selectedId);

    allSelected.forEach(sid => {
      if (draggingElement && sid === draggingElement.id) return;
      const sel = elements.find(e => e.id === sid);
      if (!sel) return;
      const bb = getElementBoundingBox(sel);
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2 / scale;
      ctx.setLineDash([5 / scale, 5 / scale]);
      ctx.strokeRect(bb.minX - 5, bb.minY - 5, (bb.maxX - bb.minX) + 10, (bb.maxY - bb.minY) + 10);
      ctx.setLineDash([]);
      if (sel.isLocked) {
        ctx.fillStyle = '#ef4444';
        ctx.font = `${11 / scale}px sans-serif`;
        ctx.fillText('🔒', bb.minX - 5, bb.minY - 8);
      }
    });

    // Selection drag box
    if (selectionBox) {
      const sx = Math.min(selectionBox.x1, selectionBox.x2);
      const sy = Math.min(selectionBox.y1, selectionBox.y2);
      const sw = Math.abs(selectionBox.x2 - selectionBox.x1);
      const sh = Math.abs(selectionBox.y2 - selectionBox.y1);
      ctx.fillStyle = 'rgba(99,102,241,0.08)';
      ctx.strokeStyle = 'rgba(99,102,241,0.7)';
      ctx.lineWidth = 1.5 / scale;
      ctx.setLineDash([4 / scale, 3 / scale]);
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.setLineDash([]);
    }

    // Alignment guides
    if (alignGuides.length > 0) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5 / scale;
      ctx.setLineDash([6 / scale, 3 / scale]);
      const W = canvas.width / scale, H = canvas.height / scale;
      alignGuides.forEach(g => {
        if (g.type === 'vertical') {
          ctx.beginPath();
          ctx.moveTo(g.x - pan.x / scale, -pan.y / scale);
          ctx.lineTo(g.x - pan.x / scale, H - pan.y / scale);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(-pan.x / scale, g.y - pan.y / scale);
          ctx.lineTo(W - pan.x / scale, g.y - pan.y / scale);
          ctx.stroke();
        }
      });
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [elements, pan, scale, selectedId, selectedIds, draggingElement, selectionBox, alignGuides, editingEl]);

  useEffect(() => { redraw(); }, [elements, pan, scale, selectedId, selectedIds, draggingElement, selectionBox, alignGuides, editingEl, redraw]);

  const getPos = (e) => {
    const rect = (e.target || canvasRef.current).getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left - pan.x) / scale, y: (clientY - rect.top - pan.y) / scale };
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.1, Math.min(scale * zoomFactor, 5));
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
      setPan(prev => ({ x: mouseX - (mouseX - prev.x) * (newScale / scale), y: mouseY - (mouseY - prev.y) * (newScale / scale) }));
      setScale(newScale);
    } else {
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  useEffect(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [scale, pan]);

  // ─── Double-click to edit text / sticky ──────────────────────────────────────
  const onDoubleClick = (e) => {
    if (tool !== 'select') return;
    const pos = getPos(e);
    const hit = [...elements].reverse().find(el => isHit(el, pos.x, pos.y));
    if (hit && (hit.type === 'text' || hit.type === 'sticky') && !hit.isLocked) {
      editTextRef.current = hit.text || '';
      setEditingEl({ id: hit.id, el: hit });
    }
  };

  const commitEdit = () => {
    if (!editingEl) return;
    const updated = { ...editingEl.el, text: editTextRef.current };
    onUpdateElement(updated);
    setEditingEl(null);
  };

  // ─── Pointer events ─────────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    // Commit any pending edit
    if (editingEl) { commitEdit(); return; }

    if (e.button === 1 || tool === 'pan') {
      setIsPanning(true);
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const pos = getPos(e);

    if (tool === 'select') {
      const now = Date.now();
      const hit = [...elements].reverse().find(el => isHit(el, pos.x, pos.y));

      if (hit) {
        // Double-click detection
        if (now - lastClickTime.current < 300 && lastClickId.current === hit.id) {
          onDoubleClick(e);
          lastClickTime.current = 0;
          lastClickId.current = null;
          return;
        }
        lastClickTime.current = now;
        lastClickId.current = hit.id;

        setSelectedId(hit.id);
        setSelectedIds(new Set());
        if (!hit.isLocked) {
          dragStartPos.current = pos;
          originalElement.current = hit;
          setDraggingElement(hit);
        }
      } else {
        // Start selection box
        setSelectedId(null);
        setSelectedIds(new Set());
        selBoxStart.current = pos;
        setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
      }
      return;
    }

    setSelectedId(null);
    setSelectedIds(new Set());

    if (tool === 'text') { setTextInput({ x: pos.x, y: pos.y }); return; }
    if (tool === 'sticky') {
      const STICKY_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f87171', '#c084fc'];
      onAddElement({ id: crypto.randomUUID(), type: 'sticky', x: pos.x, y: pos.y, width: 160, height: 120, text: 'Double-click to edit', bgColor: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)], userId: user.id });
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
      const dx = e.clientX - lastPanPos.current.x, dy = e.clientY - lastPanPos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const pos = getPos(e);
    onCursorMove(pos.x, pos.y);

    // Selection box expansion
    if (selBoxStart.current) {
      setSelectionBox({ x1: selBoxStart.current.x, y1: selBoxStart.current.y, x2: pos.x, y2: pos.y });
      return;
    }

    // Dragging with alignment guides
    if (tool === 'select' && draggingElement && originalElement.current && dragStartPos.current) {
      const dx = pos.x - dragStartPos.current.x;
      const dy = pos.y - dragStartPos.current.y;

      // Compute guides
      const guides = getAlignmentGuides(originalElement.current, dx, dy, elements, 6 / scale);
      setAlignGuides(guides);

      // Apply snap
      let snapDx = 0, snapDy = 0;
      guides.forEach(g => {
        if (g.type === 'vertical' && Math.abs(g.snapDx) < Math.abs(snapDx) + 6 / scale) snapDx = g.snapDx;
        if (g.type === 'horizontal' && Math.abs(g.snapDy) < Math.abs(snapDy) + 6 / scale) snapDy = g.snapDy;
      });

      const finalDx = dx + snapDx, finalDy = dy + snapDy;
      const newEl = JSON.parse(JSON.stringify(originalElement.current));
      moveElement(newEl, finalDx, finalDy);
      setDraggingElement(newEl);

      // Draw on active canvas
      const activeCtx = activeCanvasRef.current?.getContext('2d');
      if (activeCtx) {
        activeCtx.clearRect(0, 0, activeCanvasRef.current.width, activeCanvasRef.current.height);
        activeCtx.save();
        activeCtx.translate(pan.x, pan.y);
        activeCtx.scale(scale, scale);
        drawElement(activeCtx, newEl);
        activeCtx.restore();
      }
      return;
    }

    if (!isDrawing || !currentEl.current) return;
    const activeCtx = activeCanvasRef.current?.getContext('2d');
    if (!activeCtx) return;
    activeCtx.clearRect(0, 0, activeCanvasRef.current.width, activeCanvasRef.current.height);
    activeCtx.save();
    activeCtx.translate(pan.x, pan.y);
    activeCtx.scale(scale, scale);
    if (currentEl.current.points) { currentEl.current.points.push(pos); }
    else { currentEl.current.x2 = pos.x; currentEl.current.y2 = pos.y; }
    drawElement(activeCtx, currentEl.current);
    activeCtx.restore();
  };

  const onPointerUp = () => {
    if (isPanning) { setIsPanning(false); lastPanPos.current = null; return; }

    // Finalize selection box
    if (selBoxStart.current && selectionBox) {
      const { x1, y1, x2, y2 } = selectionBox;
      if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
        const inBox = elements.filter(el => elementInSelectionBox(el, x1, x2, y1, y2));
        setSelectedIds(new Set(inBox.map(el => el.id)));
        if (inBox.length === 1) { setSelectedId(inBox[0].id); setSelectedIds(new Set()); }
      }
      setSelectionBox(null);
      selBoxStart.current = null;
      return;
    }

    // Finalize drag
    if (tool === 'select' && draggingElement) {
      onUpdateElement(draggingElement);
      setDraggingElement(null);
      originalElement.current = null;
      setAlignGuides([]);
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
    if (el) onUpdateElement({ ...el, isLocked: !el.isLocked });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      selectedIds.forEach(id => onDeleteElement(id));
      setSelectedIds(new Set());
    } else if (selectedId) {
      onDeleteElement(selectedId);
      setSelectedId(null);
    }
  };

  const selectedEl = selectedId ? elements.find(e => e.id === selectedId) : null;
  const multiCount = selectedIds.size;
  const hasActionBar = (selectedId && !draggingElement && tool === 'select') || multiCount > 1;

  // Compute inline edit position in screen space
  const editElFull = editingEl ? elements.find(e => e.id === editingEl.id) : null;
  const editScreenPos = editElFull ? {
    left: (editElFull.x ?? editElFull.x1 ?? 0) * scale + pan.x,
    top: (editElFull.y ?? editElFull.y1 ?? 0) * scale + pan.y,
    width: (editElFull.width || (editElFull.x2 - editElFull.x1) || 160) * scale,
    height: (editElFull.height || 120) * scale,
  } : null;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Contextual Action Bar */}
      {hasActionBar && (
        <div style={{
          position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, background: 'rgba(14,14,26,0.92)',
          border: '1px solid var(--purple)', borderRadius: 10,
          padding: '6px 12px', display: 'flex', gap: 6,
          backdropFilter: 'blur(12px)', flexWrap: 'wrap', alignItems: 'center',
        }}>
          {multiCount > 1 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingRight: 6, borderRight: '1px solid var(--border)' }}>
              {multiCount} selected
            </span>
          )}

          {selectedEl && !selectedEl.isLocked && onBringToFront && (
            <button className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.72rem' }} onClick={() => onBringToFront(selectedId)}>
              Bring Front
            </button>
          )}
          {selectedEl && !selectedEl.isLocked && onSendToBack && (
            <button className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.72rem' }} onClick={() => onSendToBack(selectedId)}>
              Send Back
            </button>
          )}
          {selectedEl && (
            <button className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.72rem' }} onClick={toggleLock}>
              {selectedEl.isLocked ? '🔓 Unlock' : '🔒 Lock'}
            </button>
          )}
          {(multiCount > 1 || (selectedEl && !selectedEl.isLocked)) && (
            <button className="btn btn-danger btn-sm" style={{ padding: '3px 8px', fontSize: '0.72rem' }} onClick={handleDeleteSelected}>
              Delete{multiCount > 1 ? ` (${multiCount})` : ''}
            </button>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="canvas-layer" style={{ zIndex: 10 }} />
      <canvas
        ref={activeCanvasRef}
        className="canvas-layer"
        style={{
          zIndex: 20,
          cursor: isPanning || tool === 'pan' ? 'grabbing'
            : tool === 'eraser' ? 'cell'
            : tool === 'select' ? 'default'
            : 'crosshair',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onDoubleClick={onDoubleClick}
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
          style={{
            position: 'absolute',
            left: textInput.x * scale + pan.x,
            top: textInput.y * scale + pan.y,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            zIndex: 100,
            background: 'rgba(0,0,0,0.7)',
            color,
            border: `2px solid ${color}`,
            borderRadius: 6,
            padding: '4px 8px',
            font: '18px Inter,sans-serif',
            outline: 'none',
            resize: 'none',
            minWidth: 120,
            minHeight: 36,
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(e.target.value); }
            if (e.key === 'Escape') setTextInput(null);
          }}
          onBlur={e => commitText(e.target.value)}
        />
      )}

      {/* Inline edit overlay for text/sticky double-click */}
      {editingEl && editScreenPos && (
        <textarea
          autoFocus
          defaultValue={editingEl.el.text || ''}
          onChange={e => { editTextRef.current = e.target.value; }}
          style={{
            position: 'absolute',
            left: editScreenPos.left,
            top: editScreenPos.top,
            width: editScreenPos.width,
            height: editScreenPos.height,
            zIndex: 200,
            background: editingEl.el.bgColor || 'rgba(20,20,40,0.95)',
            color: editingEl.el.bgColor ? '#1a1a1a' : (editingEl.el.color || '#fff'),
            border: '2px solid #8b5cf6',
            borderRadius: editingEl.el.type === 'sticky' ? 4 : 6,
            padding: '8px',
            font: `${(editingEl.el.fontSize || 14) * scale}px Inter, sans-serif`,
            outline: 'none',
            resize: 'none',
            boxShadow: '0 0 0 3px rgba(139,92,246,0.3)',
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') { setEditingEl(null); }
            if (e.key === 'Enter' && !e.shiftKey && editingEl.el.type !== 'sticky') {
              e.preventDefault(); commitEdit();
            }
          }}
          onBlur={commitEdit}
        />
      )}
    </div>
  );
});

// ─── Move element helper ─────────────────────────────────────────────────────
function moveElement(el, dx, dy) {
  if (el.type === 'pen') { el.points.forEach(p => { p.x += dx; p.y += dy; }); }
  else if (['rect','circle','line','arrow'].includes(el.type)) { el.x1 += dx; el.y1 += dy; el.x2 += dx; el.y2 += dy; }
  else { el.x += dx; el.y += dy; }
}

export default WhiteboardCanvas;