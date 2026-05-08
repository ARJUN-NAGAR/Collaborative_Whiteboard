import React, { useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export default function ZoomControls({ canvasRef }) {
  const [scale, setScale] = useState(1);

  // Poll scale for simplicity, or we could pass the scale state up to WhiteboardApp
  // Since we put scale inside WhiteboardCanvas, let's just trigger methods.

  const handleZoomIn = () => {
    if (canvasRef.current) canvasRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (canvasRef.current) canvasRef.current.zoomOut();
  };

  const handleReset = () => {
    if (canvasRef.current) canvasRef.current.resetZoom();
  };

  return (
    <div style={{ position: 'absolute', bottom: '20px', right: '320px', zIndex: 100, display: 'flex', gap: '4px', background: 'rgba(14,14,26,0.65)', padding: '6px', borderRadius: '12px', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={handleZoomOut} className="btn btn-secondary btn-sm" style={{ padding: '6px', border: 'none', background: 'transparent' }} title="Zoom Out">
        <ZoomOut size={16} />
      </button>
      <button onClick={handleReset} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', border: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 600 }} title="Reset Zoom">
        100%
      </button>
      <button onClick={handleZoomIn} className="btn btn-secondary btn-sm" style={{ padding: '6px', border: 'none', background: 'transparent' }} title="Zoom In">
        <ZoomIn size={16} />
      </button>
    </div>
  );
}
