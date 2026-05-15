import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useWhiteboard } from '../contexts/WhiteboardContext';
import { useTool } from '../contexts/ToolContext';
import { useCollaboration } from '../contexts/CollaborationContext';
import { drawElement, drawSelectionBox } from '../engine/renderer';
import { isHit } from '../engine/hitDetection';
import EditableTextOverlay from './EditableTextOverlay';

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

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const activeCanvasRef = useRef(null);

  // Interaction State
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const startPan = useRef({ x: 0, y: 0 });
  const currentElement = useRef(null);
  const lastDraggedElement = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  // Text Overlay State
  const [editingText, setEditingText] = useState(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    zoomIn: () => setZoom(s => Math.min(s * 1.2, 5)),
    zoomOut: () => setZoom(s => Math.max(s / 1.2, 0.1)),
    resetZoom: () => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }
  }));

  const lastCursorSend = useRef(0);

  // Render Loop using requestAnimationFrame
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
      // Apply Camera Transform
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);
      
      // Sort elements by zIndex safely before rendering
      const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      
      sortedElements.forEach(el => {
        // Render
        drawElement(ctx, el);
        
        // Highlight selection
        if (selectedIds.has(el.id)) {
          drawSelectionBox(ctx, el, zoom);
        }

        Object.values(remoteUsers).forEach((remote) => {
          if (remote.selectedElementIds?.includes(el.id)) {
            drawSelectionBox(ctx, el, zoom, remote.color || '#06b6d4');
          }
        });
      });
      
      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [elements, panOffset, zoom, selectedIds, remoteUsers]);

  useEffect(() => {
    sendSelection(Array.from(selectedIds));
  }, [selectedIds, sendSelection]);

  useEffect(() => {
    const handler = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) return;

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.size) {
        event.preventDefault();
        const ids = Array.from(selectedIds);
        deleteElements(ids);
        publishElementDelete(ids);
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd' && selectedIds.size) {
        event.preventDefault();
        saveSnapshot();
        const nextZ = elements.length ? Math.max(...elements.map(el => el.zIndex || 0)) + 1 : 1;
        const clones = elements
          .filter(el => selectedIds.has(el.id))
          .map((el, index) => {
            const clone = { ...el, id: crypto.randomUUID(), zIndex: nextZ + index };
            if (clone.x !== undefined) clone.x += 24;
            if (clone.y !== undefined) clone.y += 24;
            if (clone.x1 !== undefined) { clone.x1 += 24; clone.x2 += 24; }
            if (clone.y1 !== undefined) { clone.y1 += 24; clone.y2 += 24; }
            if (clone.points) clone.points = clone.points.map(point => ({ x: point.x + 24, y: point.y + 24 }));
            return clone;
          });

        clones.forEach(clone => {
          addElement(clone);
          publishElementCreate(clone);
        });
        setSelectedIds(new Set(clones.map(clone => clone.id)));
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addElement, deleteElements, elements, publishElementCreate, publishElementDelete, saveSnapshot, selectedIds, setSelectedIds]);

  const handlePointerDown = (e) => {
    if (editingText) return; // Ignore if currently editing text

    // Middle click or Pan tool
    if (e.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
      startPan.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    const pos = screenToWorld(e.clientX, e.clientY);

    if (activeTool === 'eraser') {
      const sorted = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (isHit(sorted[i], pos.x, pos.y)) {
          deleteElements([sorted[i].id]);
          publishElementDelete([sorted[i].id]);
          return;
        }
      }
      return;
    }

    if (activeTool === 'select') {
      // Hit detection (highest zIndex first)
      let hit = null;
      const sorted = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      for (let i = sorted.length - 1; i >= 0; i--) {
         if (isHit(sorted[i], pos.x, pos.y)) { hit = sorted[i]; break; }
      }
      if (hit) {
         setSelectedIds(prev => {
           if (!e.shiftKey) return new Set([hit.id]);
           const next = new Set(prev);
           if (next.has(hit.id)) next.delete(hit.id);
           else next.add(hit.id);
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
    
    // Start drawing
    setIsDrawing(true);
    setSelectedIds(new Set());
    
    const baseZIndex = elements.length > 0 ? Math.max(...elements.map(e => e.zIndex || 0)) + 1 : 1;

    currentElement.current = {
      id: crypto.randomUUID(),
      type: activeTool,
      strokeColor,
      fillColor,
      strokeWidth,
      fontSize,
      zIndex: baseZIndex,
      x1: pos.x, y1: pos.y,
      x2: pos.x, y2: pos.y,
      x: pos.x, y: pos.y,
      points: [{ x: pos.x, y: pos.y }],
    };
    
    // Auto-create text/sticky to avoid dragging
    if (activeTool === 'text' || activeTool === 'sticky') {
      setIsDrawing(false); // don't track drag
      if (activeTool === 'text') {
        setEditingText({ ...currentElement.current, text: '' });
      } else {
        // Sticky
        currentElement.current.text = 'Double click to edit';
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
      const selectedId = Array.from(selectedIds)[0]; // single select for now
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
         lastDraggedElement.current = newEl;
         updateElement(newEl);
      }
      return;
    }
    
    if (isDrawing && currentElement.current) {
      currentElement.current.x2 = pos.x;
      currentElement.current.y2 = pos.y;
      if (activeTool === 'pen') {
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
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);
      drawElement(ctx, currentElement.current);
      ctx.restore();
    }
  };

  const handlePointerUp = (e) => {
    if (editingText) return;

    setIsPanning(false);
    if (isDragging && selectedIds.size > 0) {
      const selectedId = Array.from(selectedIds)[0];
      const el = lastDraggedElement.current || elements.find(item => item.id === selectedId);
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
      if (canvas) {
         const ctx = canvas.getContext('2d');
         ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleDoubleClick = (e) => {
    const pos = screenToWorld(e.clientX, e.clientY);
    let hit = null;
    const sorted = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    for (let i = sorted.length - 1; i >= 0; i--) {
        if (isHit(sorted[i], pos.x, pos.y)) { hit = sorted[i]; break; }
    }
    
    if (hit && (hit.type === 'text' || hit.type === 'sticky')) {
      setEditingText(hit);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5);
      const dx = e.clientX - panOffset.x;
      const dy = e.clientY - panOffset.y;
      setPanOffset({ 
        x: e.clientX - dx * (newZoom / zoom), 
        y: e.clientY - dy * (newZoom / zoom) 
      });
      setZoom(newZoom);
    } else {
      // Pan
      setPanOffset(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [panOffset, zoom]);

  // Contextual Action Bar
  const hasSelection = selectedIds.size > 0;
  
  const layerUp = () => {
    if (!hasSelection) return;
    const id = Array.from(selectedIds)[0];
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const maxZ = Math.max(...elements.map(e => e.zIndex || 0));
    const next = { ...el, zIndex: maxZ + 1 };
    saveSnapshot();
    updateElement(next);
    publishElementUpdate(next);
  };
  
  const layerDown = () => {
    if (!hasSelection) return;
    const id = Array.from(selectedIds)[0];
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const minZ = Math.min(...elements.map(e => e.zIndex || 0));
    const next = { ...el, zIndex: minZ - 1 };
    saveSnapshot();
    updateElement(next);
    publishElementUpdate(next);
  };

  const getCursor = () => {
    if (isPanning || activeTool === 'pan') return 'grab';
    if (activeTool === 'select') return 'default';
    if (activeTool === 'eraser') return 'cell';
    if (activeTool === 'text') return 'text';
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
    >
      {/* Contextual Action Bar */}
      {hasSelection && !isDragging && activeTool === 'select' && (
        <div style={{ 
          position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', 
          zIndex: 100, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--r-md)', padding: '6px 12px', display: 'flex', gap: '6px', 
          backdropFilter: 'blur(16px)', alignItems: 'center', boxShadow: 'var(--shadow-lg)' 
        }}>
          <button className="btn btn-secondary btn-sm" onClick={layerUp}>Bring Forward</button>
          <button className="btn btn-secondary btn-sm" onClick={layerDown}>Send Backward</button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              const ids = Array.from(selectedIds);
              deleteElements(ids);
              publishElementDelete(ids);
            }}
          >
            Delete
          </button>
        </div>
      )}

      {/* Editing Text Overlay */}
      {editingText && (
        <EditableTextOverlay
          text={editingText.text}
          x={editingText.x}
          y={editingText.y}
          color={editingText.strokeColor || editingText.color || '#111827'}
          fontSize={editingText.fontSize || 18}
          zoom={zoom}
          panOffset={panOffset}
          onSave={(newText) => {
            if (newText.trim() === '') {
              // Ignore empty
            } else {
              if (elements.find(e => e.id === editingText.id)) {
                const next = { ...editingText, text: newText };
                saveSnapshot();
                updateElement(next);
                publishElementUpdate(next);
              } else {
                const next = { ...editingText, text: newText };
                addElement(next);
                publishElementCreate(next);
              }
            }
            setEditingText(null);
            setActiveTool('select');
          }}
          onCancel={() => setEditingText(null)}
        />
      )}

      {/* Grid Pattern */}
      <div 
        style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundImage: 'radial-gradient(var(--canvas-dot) 1px, transparent 1px)'
        }}
      />

      <canvas ref={canvasRef} className="canvas-layer" style={{ zIndex: 10 }} />
      <canvas ref={activeCanvasRef} className="canvas-layer" style={{ zIndex: 20, cursor: getCursor() }} />

      {/* Remote cursors */}
      {Object.entries(remoteUsers).map(([id, u]) => (
        <div key={id} className="remote-cursor" style={{ 
          transform: `translate(${u.x * zoom + panOffset.x}px, ${u.y * zoom + panOffset.y}px)`, 
          zIndex: 50, '--cursor-color': u.color 
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" className="cursor-arrow">
            <path d="M5 3l14 9-7 2-2 7z" fill={u.color} stroke="white" strokeWidth="1.5" />
          </svg>
          <div className="cursor-label">{u.name} {u.handRaised && '✋'}</div>
        </div>
      ))}
    </div>
  );
});

export default WhiteboardCanvas;
