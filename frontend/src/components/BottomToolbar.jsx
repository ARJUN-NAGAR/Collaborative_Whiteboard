import { useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, RotateCw, Trash2, Copy, ChevronDown } from 'lucide-react';
import { useWhiteboard } from '../contexts/WhiteboardContext';

/**
 * BottomToolbar
 * Glassmorphism floating bar at the bottom-center of the canvas.
 * Contains: zoom controls · undo/redo · clear board
 */
export default function BottomToolbar() {
  const {
    zoom, setZoom,
    panOffset, setPanOffset,
    undo, redo, canUndo, canRedo,
    elements, clearCanvas,
  } = useWhiteboard();

  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const zoomPct = Math.round(zoom * 100);

  const zoomTo = (val) => {
    setZoom(val);
    setPanOffset({ x: window.innerWidth / 2 - (window.innerWidth / 2) * val, y: window.innerHeight / 2 - (window.innerHeight / 2) * val });
    setShowZoomMenu(false);
  };

  const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150, 200];

  const handleClear = () => {
    if (window.confirm('Clear all elements from the canvas?')) {
      clearCanvas?.();
    }
  };

  return (
    <div className="bottom-toolbar">

      {/* Undo / Redo */}
      <div className="btb-group">
        <button
          className={`btb-btn${canUndo ? '' : ' btb-btn--disabled'}`}
          title="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={!canUndo}
        >
          <RotateCcw size={14} />
        </button>
        <button
          className={`btb-btn${canRedo ? '' : ' btb-btn--disabled'}`}
          title="Redo (Ctrl+Y)"
          onClick={redo}
          disabled={!canRedo}
        >
          <RotateCw size={14} />
        </button>
      </div>

      <div className="btb-sep" />

      {/* Zoom */}
      <div className="btb-group" style={{ position: 'relative' }}>
        <button
          className="btb-btn"
          title="Zoom out"
          onClick={() => setZoom(z => Math.max(z / 1.25, 0.1))}
        >
          <ZoomOut size={14} />
        </button>

        <button
          className="btb-btn btb-zoom-pct"
          title="Zoom level — click to pick preset"
          onClick={() => setShowZoomMenu(s => !s)}
        >
          {zoomPct}%
          <ChevronDown size={10} style={{ marginLeft: 2 }} />
        </button>

        <button
          className="btb-btn"
          title="Zoom in"
          onClick={() => setZoom(z => Math.min(z * 1.25, 5))}
        >
          <ZoomIn size={14} />
        </button>

        <button
          className="btb-btn"
          title="Reset view"
          onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
        >
          <Maximize2 size={14} />
        </button>

        {/* Zoom dropdown */}
        {showZoomMenu && (
          <div className="btb-dropdown">
            {ZOOM_PRESETS.map(p => (
              <button
                key={p}
                className={`btb-dropdown-item${zoomPct === p ? ' active' : ''}`}
                onClick={() => zoomTo(p / 100)}
              >
                {p}%
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="btb-sep" />

      {/* Element count */}
      <div className="btb-info">
        {elements.length} element{elements.length !== 1 ? 's' : ''}
      </div>

      <div className="btb-sep" />

      {/* Clear board */}
      <button
        className="btb-btn btb-btn--danger"
        title="Clear all elements"
        onClick={handleClear}
      >
        <Trash2 size={14} />
      </button>

    </div>
  );
}