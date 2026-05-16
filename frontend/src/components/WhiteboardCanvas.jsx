import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useWhiteboard } from '../contexts/WhiteboardContext';
import { useTool } from '../contexts/ToolContext';
import { useCollaboration } from '../contexts/CollaborationContext';
import { drawElement, drawSelectionBox } from '../engine/renderer';
import { isHit } from '../engine/hitDetection';
import EditableTextOverlay from './EditableTextOverlay';
import ContextMenu from './ContextMenu';
import { useContextMenu } from '../hooks/useContextMenu';

const WhiteboardCanvas = forwardRef(function WhiteboardCanvas(props, ref) {
  const {
    elements, addElement, updateElement, deleteElements,
    selectedIds, setSelectedIds,
    saveSnapshot,
    zoom, panOffset, setPanOffset, setZoom,
    screenToWorld, worldToScreen
  } = useWhiteboard();

  const { activeTool, strokeColor, fillColor, strokeWidth, fontSize, setActiveTool } = useTool();
  const {
    remoteUsers,
    sendCursor,
    sendSelection,
    publishElementCreate,
    publishElementUpdate,
    publishElementDelete
  } = useCollaboration();

  const containerRef    = useRef(null);
  const canvasRef       = useRef(null);
  const activeCanvasRef = useRef(null);

  const [isDrawing,  setIsDrawing]  = useState(false);
  const [isPanning,  setIsPanning]  = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const startPan             = useRef({ x: 0, y: 0 });
  const currentElement       = useRef(null);
  const lastDraggedElement   = useRef(null);
  const dragOffset           = useRef({ x: 0, y: 0 });

  const [editingText, setEditingText] = useState(null);

  // ── Context Menu ──────────────────────────────────────────────
  const { contextMenu, showContextMenu, closeContextMenu } = useContextMenu();

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    zoomIn:    () => setZoom(s => Math.min(s * 1.2, 5)),
    zoomOut:   () => setZoom(s => Math.max(s / 1.2, 0.1)),
    resetZoom: () => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }
  }));

  const lastCursorSend = useRef(0);

  // ── Render loop ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);

      const sorted = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      sorted.forEach(el => {
        if (el.hidden) return; // skip hidden layers
        drawElement(ctx, el);
        if (selectedIds.has(el.id)) drawSelectionBox(ctx, el, zoom);
        Object.values(remoteUsers).forEach(remote => {
          if (remote.selectedElementIds?.includes(el.id)) {
            drawSelectionBox(ctx, el, zoom, remote.color || '#06b6d4');
          }
        });
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [elements, panOffset, zoom, selectedIds, remoteUsers]);

  useEffect(() => { sendSelection(Array.from(selectedIds)); }, [selectedIds, sendSelection]);

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) return;

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.size) {
        event.preventDefault();
        const ids = Array.from(selectedIds);
        deleteElements(ids);
        publishElementDelete(ids);
        setSelectedIds(new Set());
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd' && selectedIds.size) {
        event.preventDefault();
        duplicateSelected();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        // undo handled by WhiteboardContext
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, elements]);

  const duplicateSelected = useCallback(() => {
    saveSnapshot();
    const maxZ = elements.length ? Math.max(...elements.map(e => e.zIndex || 0)) + 1 : 1;
    const clones = elements
      .filter(el => selectedIds.has(el.id))
      .map((el, i) => {
        const clone = { ...el, id: crypto.randomUUID(), zIndex: maxZ + i };
        if (clone.x  !== undefined) clone.x  += 24;
        if (clone.y  !== undefined) clone.y  += 24;
        if (clone.x1 !== undefined) { clone.x1 += 24; clone.x2 += 24; }
        if (clone.y1 !== undefined) { clone.y1 += 24; clone.y2 += 24; }
        if (clone.points) clone.points = clone.points.map(p => ({ x: p.x + 24, y: p.y + 24 }));
        return clone;
      });
    clones.forEach(c => { addElement(c); publishElementCreate(c); });
    setSelectedIds(new Set(clones.map(c => c.id)));
  }, [elements, selectedIds, saveSnapshot, addElement, publishElementCreate, setSelectedIds]);

  // ── Context menu action handlers ──────────────────────────────
  const selectedEl = selectedIds.size === 1 ? elements.find(e => e.id === [...selectedIds][0]) : null;

  const handleCtxDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    saveSnapshot();
    deleteElements(ids);
    publishElementDelete(ids);
    setSelectedIds(new Set());
  }, [selectedIds, saveSnapshot, deleteElements, publishElementDelete, setSelectedIds]);

  const handleCtxLayerUp = useCallback(() => {
    if (!selectedEl) return;
    const maxZ = Math.max(...elements.map(e => e.zIndex || 0));
    const next = { ...selectedEl, zIndex: maxZ + 1 };
    saveSnapshot();
    updateElement(next);
    publishElementUpdate(next);
  }, [selectedEl, elements, saveSnapshot, updateElement, publishElementUpdate]);

  const handleCtxLayerDown = useCallback(() => {
    if (!selectedEl) return;
    const minZ = Math.min(...elements.map(e => e.zIndex || 0));
    const next = { ...selectedEl, zIndex: minZ - 1 };
    saveSnapshot();
    updateElement(next);
    publishElementUpdate(next);
  }, [selectedEl, elements, saveSnapshot, updateElement, publishElementUpdate]);

  const handleCtxToggleHidden = useCallback(() => {
    if (!selectedEl) return;
    const next = { ...selectedEl, hidden: !selectedEl.hidden };
    saveSnapshot();
    updateElement(next);
    publishElementUpdate(next);
  }, [selectedEl, saveSnapshot, updateElement, publishElementUpdate]);

  const handleCtxToggleLocked = useCallback(() => {
    if (!selectedEl) return;
    const next = { ...selectedEl, locked: !selectedEl.locked };
    saveSnapshot();
    updateElement(next);
    publishElementUpdate(next);
  }, [selectedEl, saveSnapshot, updateElement, publishElementUpdate]);

  const handleCtxEditText = useCallback(() => {
    if (selectedEl && (selectedEl.type === 'text' || selectedEl.type === 'sticky')) {
      setEditingText(selectedEl);
    }
  }, [selectedEl]);

  // ── Pointer events ────────────────────────────────────────────
  const handlePointerDown = (e) => {
    if (editingText) return;
    closeContextMenu();

    if (e.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
      startPan.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    const pos = screenToWorld(e.clientX, e.clientY);

    if (activeTool === 'eraser') {
      const sorted = [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
      for (const el of sorted) {
        if (!el.locked && isHit(el, pos.x, pos.y)) {
          deleteElements([el.id]);
          publishElementDelete([el.id]);
          return;
        }
      }
      return;
    }

    if (activeTool === 'select') {
      const sorted = [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
      let hit = null;
      for (const el of sorted) {
        if (!el.locked && isHit(el, pos.x, pos.y)) { hit = el; break; }
      }
      if (hit) {
        setSelectedIds(prev => {
          if (!e.shiftKey) return new Set([hit.id]);
          const next = new Set(prev);
          next.has(hit.id) ? next.delete(hit.id) : next.add(hit.id);
          return next;
        });
        setIsDragging(true);
        saveSnapshot();
        dragOffset.current = { x: pos.x - (hit.x ?? hit.x1 ?? 0), y: pos.y - (hit.y ?? hit.y1 ?? 0) };
      } else {
        setSelectedIds(new Set());
      }
      return;
    }

    setIsDrawing(true);
    setSelectedIds(new Set());

    const baseZ = elements.length ? Math.max(...elements.map(e => e.zIndex || 0)) + 1 : 1;
    currentElement.current = {
      id: crypto.randomUUID(),
      type: activeTool,
      strokeColor, fillColor, strokeWidth, fontSize,
      zIndex: baseZ,
      x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y,
      x: pos.x,  y: pos.y,
      points: [{ x: pos.x, y: pos.y }],
    };

    if (activeTool === 'text' || activeTool === 'sticky') {
      setIsDrawing(false);
      if (activeTool === 'text') {
        setEditingText({ ...currentElement.current, text: '' });
      } else {
        currentElement.current.text = 'Click to edit';
        currentElement.current.width = 200;
        currentElement.current.height = 120;
        addElement(currentElement.current);
        publishElementCreate(currentElement.current);
      }
      setActiveTool('select');
      currentElement.current = null;
    }
  };

  const handlePointerMove = (e) => {
    if (editingText) return;
    const pos = screenToWorld(e.clientX, e.clientY);

    const now = Date.now();
    if (now - lastCursorSend.current > 50) {
      sendCursor({ cursorX: pos.x, cursorY: pos.y });
      lastCursorSend.current = now;
    }

    if (isPanning) {
      setPanOffset({ x: e.clientX - startPan.current.x, y: e.clientY - startPan.current.y });
      return;
    }

    if (isDragging && selectedIds.size > 0) {
      const id = [...selectedIds][0];
      const el = elements.find(e => e.id === id);
      if (!el) return;

      const dx = pos.x - dragOffset.current.x - (el.x ?? el.x1 ?? 0);
      const dy = pos.y - dragOffset.current.y - (el.y ?? el.y1 ?? 0);
      const newEl = { ...el };
      if (newEl.x  !== undefined) newEl.x  += dx;
      if (newEl.y  !== undefined) newEl.y  += dy;
      if (newEl.x1 !== undefined) { newEl.x1 += dx; newEl.x2 += dx; }
      if (newEl.y1 !== undefined) { newEl.y1 += dy; newEl.y2 += dy; }
      if (newEl.points) newEl.points = newEl.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
      lastDraggedElement.current = newEl;
      updateElement(newEl);
      return;
    }

    if (isDrawing && currentElement.current) {
      currentElement.current.x2 = pos.x;
      currentElement.current.y2 = pos.y;
      if (activeTool === 'pen') currentElement.current.points.push({ x: pos.x, y: pos.y });

      const canvas = activeCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (canvas.width !== window.innerWidth) canvas.width = window.innerWidth;
      if (canvas.height !== window.innerHeight) canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);
      drawElement(ctx, currentElement.current);
      ctx.restore();
    }
  };

  const handlePointerUp = () => {
    if (editingText) return;
    setIsPanning(false);

    if (isDragging && selectedIds.size > 0) {
      const id = [...selectedIds][0];
      const el = lastDraggedElement.current || elements.find(e => e.id === id);
      if (el) publishElementUpdate(el);
      lastDraggedElement.current = null;
    }
    setIsDragging(false);

    if (isDrawing && currentElement.current) {
      setIsDrawing(false);
      addElement(currentElement.current);
      publishElementCreate(currentElement.current);
      currentElement.current = null;
      const canvas = activeCanvasRef.current;
      if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleDoubleClick = (e) => {
    const pos = screenToWorld(e.clientX, e.clientY);
    const sorted = [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    for (const el of sorted) {
      if (isHit(el, pos.x, pos.y) && (el.type === 'text' || el.type === 'sticky')) {
        setEditingText(el);
        return;
      }
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const factor  = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(zoom * factor, 0.1), 5);
      const dx = e.clientX - panOffset.x;
      const dy = e.clientY - panOffset.y;
      setPanOffset({ x: e.clientX - dx * (newZoom / zoom), y: e.clientY - dy * (newZoom / zoom) });
      setZoom(newZoom);
    } else {
      setPanOffset(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [panOffset, zoom]);

  // ── Layer actions (contextual bar) ────────────────────────────
  const hasSelection = selectedIds.size > 0;

  const layerUp = () => {
    if (!selectedEl) return;
    const maxZ = Math.max(...elements.map(e => e.zIndex || 0));
    const next = { ...selectedEl, zIndex: maxZ + 1 };
    saveSnapshot(); updateElement(next); publishElementUpdate(next);
  };

  const layerDown = () => {
    if (!selectedEl) return;
    const minZ = Math.min(...elements.map(e => e.zIndex || 0));
    const next = { ...selectedEl, zIndex: minZ - 1 };
    saveSnapshot(); updateElement(next); publishElementUpdate(next);
  };

  const getCursor = () => {
    if (isPanning || activeTool === 'pan') return 'grab';
    if (activeTool === 'select') return isDragging ? 'grabbing' : 'default';
    if (activeTool === 'eraser') return 'cell';
    if (activeTool === 'text')   return 'text';
    return 'crosshair';
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, touchAction: 'none', overflow: 'hidden' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onContextMenu={showContextMenu}
    >
      {/* Contextual Action Bar */}
      {hasSelection && !isDragging && activeTool === 'select' && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-full)', padding: '4px 8px',
          display: 'flex', gap: 3, backdropFilter: 'blur(16px)',
          alignItems: 'center', boxShadow: 'var(--shadow-lg)',
          animation: 'fadeUp 0.12s ease',
        }}>
          <button className="btb-btn" onClick={layerUp}>↑ Forward</button>
          <button className="btb-btn" onClick={layerDown}>↓ Backward</button>
          <button className="btb-btn" onClick={duplicateSelected}>⌘D Duplicate</button>
          <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 2px' }} />
          <button className="btb-btn btb-btn--danger" onClick={() => {
            const ids = Array.from(selectedIds);
            saveSnapshot(); deleteElements(ids); publishElementDelete(ids); setSelectedIds(new Set());
          }}>Delete</button>
        </div>
      )}

      {/* Text Editing Overlay */}
      {editingText && (
        <EditableTextOverlay
          text={editingText.text || ''}
          x={editingText.x}
          y={editingText.y}
          color={editingText.strokeColor || '#111827'}
          fontSize={editingText.fontSize || 18}
          zoom={zoom}
          panOffset={panOffset}
          onSave={(newText) => {
            if (newText.trim() !== '') {
              const next = { ...editingText, text: newText };
              if (elements.find(e => e.id === editingText.id)) {
                saveSnapshot(); updateElement(next); publishElementUpdate(next);
              } else {
                addElement(next); publishElementCreate(next);
              }
            }
            setEditingText(null);
            setActiveTool('select');
          }}
          onCancel={() => setEditingText(null)}
        />
      )}

      {/* Grid Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        backgroundSize:     `${24 * zoom}px ${24 * zoom}px`,
        backgroundImage:    'radial-gradient(var(--canvas-dot) 1px, transparent 1px)',
      }} />

      <canvas ref={canvasRef}       className="canvas-layer" style={{ zIndex: 10 }} />
      <canvas ref={activeCanvasRef} className="canvas-layer" style={{ zIndex: 20, cursor: getCursor() }} />

      {/* Remote cursors */}
      {Object.entries(remoteUsers).map(([id, u]) => (
        <div key={id} className="remote-cursor" style={{
          transform: `translate(${u.x * zoom + panOffset.x}px, ${u.y * zoom + panOffset.y}px)`,
          zIndex: 50, '--cursor-color': u.color,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" className="cursor-arrow">
            <path d="M5 3l14 9-7 2-2 7z" fill={u.color} stroke="white" strokeWidth="1.5" />
          </svg>
          <div className="cursor-label">{u.name} {u.handRaised && '✋'}</div>
        </div>
      ))}

      {/* Context Menu */}
      {contextMenu && (
        <div className="canvas-ctx-wrapper" style={{ pointerEvents: 'all' }}>
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            selectedIds={selectedIds}
            elements={elements}
            onClose={closeContextMenu}
            onDuplicate={duplicateSelected}
            onDelete={handleCtxDelete}
            onLayerUp={handleCtxLayerUp}
            onLayerDown={handleCtxLayerDown}
            onToggleHidden={handleCtxToggleHidden}
            onToggleLocked={handleCtxToggleLocked}
            onEditText={handleCtxEditText}
          />
        </div>
      )}
    </div>
  );
});

export default WhiteboardCanvas;