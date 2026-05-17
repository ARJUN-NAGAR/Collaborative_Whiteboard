import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const WhiteboardContext = createContext();

export function WhiteboardProvider({ children }) {
  // Elements state
  const [elements, setElements] = useState([]);
  
  // Ref for access inside requestAnimationFrame or fast handlers without triggering re-renders
  const elementsRef = useRef(elements);
  useEffect(() => { elementsRef.current = elements; }, [elements]);

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);

  // Camera System
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const panOffsetRef = useRef(panOffset);
  
  useEffect(() => {
    zoomRef.current = zoom;
    panOffsetRef.current = panOffset;
  }, [zoom, panOffset]);

  // History System (Command based conceptually, but storing element states for simplicity for now)
  const historyRef = useRef({ past: [], future: [] });
  const [, forceHistoryRender] = useState(0);
  const bumpHistory = useCallback(() => forceHistoryRender(n => n + 1), []);

  const saveSnapshot = useCallback(() => {
    historyRef.current.past.push([...elementsRef.current]);
    if (historyRef.current.past.length > 80) historyRef.current.past.shift();
    historyRef.current.future = [];
    bumpHistory();
  }, [bumpHistory]);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  const undo = useCallback(() => {
    if (!historyRef.current.past.length) return null;
    historyRef.current.future.push([...elementsRef.current]);
    const prev = historyRef.current.past.pop();
    setElements(prev);
    bumpHistory();
    return prev;
  }, [bumpHistory]);

  const redo = useCallback(() => {
    if (!historyRef.current.future.length) return null;
    historyRef.current.past.push([...elementsRef.current]);
    const next = historyRef.current.future.pop();
    setElements(next);
    bumpHistory();
    return next;
  }, [bumpHistory]);

  // Actions
  const addElement = useCallback((el) => {
    saveSnapshot();
    setElements(prev => [...prev, el]);
  }, [saveSnapshot]);

  const updateElement = useCallback((el) => {
    // Avoid heavy snapshotting on every frame of drag. Handled externally.
    setElements(prev => prev.map(e => e.id === el.id ? el : e));
  }, []);

  const deleteElements = useCallback((ids) => {
    saveSnapshot();
    const idSet = new Set(ids);
    setElements(prev => prev.filter(e => !idSet.has(e.id)));
    setSelectedIds(new Set());
  }, [saveSnapshot]);

  const clearCanvas = useCallback(() => {
    saveSnapshot();
    setElements([]);
    setSelectedIds(new Set());
  }, [saveSnapshot]);

  // Coordinate transforms
  const screenToWorld = useCallback((screenX, screenY) => {
    return {
      x: (screenX - panOffsetRef.current.x) / zoomRef.current,
      y: (screenY - panOffsetRef.current.y) / zoomRef.current
    };
  }, []);

  const worldToScreen = useCallback((worldX, worldY) => {
    return {
      x: worldX * zoomRef.current + panOffsetRef.current.x,
      y: worldY * zoomRef.current + panOffsetRef.current.y
    };
  }, []);

  const value = {
    elements,
    elementsRef,
    setElements, // mainly for incoming network sync
    selectedIds,
    selectedIdsRef,
    setSelectedIds,
    
    // Camera
    zoom,
    setZoom,
    zoomRef,
    panOffset,
    setPanOffset,
    panOffsetRef,
    screenToWorld,
    worldToScreen,

    // Actions
    addElement,
    updateElement,
    deleteElements,
    clearCanvas,
    
    // History
    canUndo,
    canRedo,
    undo,
    redo,
    saveSnapshot
  };

  return (
    <WhiteboardContext.Provider value={value}>
      {children}
    </WhiteboardContext.Provider>
  );
}

export const useWhiteboard = () => useContext(WhiteboardContext);
