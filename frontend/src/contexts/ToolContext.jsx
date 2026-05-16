import React, { createContext, useContext, useState, useEffect } from 'react';

const ToolContext = createContext();

export function ToolProvider({ children }) {
  const [activeTool, setActiveTool] = useState('select'); // 'select', 'pan', 'pen', 'rect', 'circle', 'text', 'sticky', etc.
  const [strokeColor, setStrokeColor] = useState('#111827');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(18);

  // Keyboard shortcuts for tools
  useEffect(() => {
    const keys = { 
      v: 'select', 
      ' ': 'pan', 
      p: 'pen', 
      e: 'eraser', 
      r: 'rect', 
      c: 'circle', 
      l: 'line', 
      a: 'arrow', 
      t: 'text', 
      s: 'sticky' 
    };

    const handler = (ev) => {
      // Don't trigger if inside input or textarea
      if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA' || ev.target.isContentEditable) {
        return;
      }
      
      const t = keys[ev.key.toLowerCase()];
      if (t) {
        setActiveTool(prev => prev === t ? 'select' : t);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const value = {
    activeTool,
    setActiveTool: (tool) => setActiveTool(prev => prev === tool ? 'select' : tool),
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    fontSize,
    setFontSize
  };

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  );
}

export const useTool = () => useContext(ToolContext);
