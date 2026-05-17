import React, { useState, useCallback } from "react";
import { exportCanvasToPNG } from "../utils/canvasExport";

/**
 * ExportModal.jsx
 * - Removed all hardcoded var(--purple) references → var(--accent)
 * - Wired PNG export to the new exportCanvasToPNG utility
 * - PDF export stub preserved (requires server-side or jsPDF)
 */
export default function ExportModal({ isOpen, onClose, elements = [], canvasRef }) {
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState("2x");  // 1x | 2x | 3x
  const [padding, setPadding] = useState(32);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const scaleMap = { "1x": 1, "2x": 2, "3x": 3 };

  const handleExport = useCallback(async () => {
    setError(null);
    setExporting(true);

    try {
      if (format === "png") {
        await exportCanvasToPNG({
          elements,
          scale: scaleMap[quality],
          padding,
          filename: `collabboard-export-${Date.now()}.png`,
        });
      } else if (format === "pdf") {
        // PDF: delegate to server or jsPDF — stub kept for future implementation
        throw new Error("PDF export is coming soon. Try PNG for now.");
      } else if (format === "svg") {
        exportToSVG({ elements, padding });
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }, [format, quality, padding, elements, onClose]);

  if (!isOpen) return null;

  const elementCount = elements.length;
  const estimatedSize = estimateSize(elementCount, scaleMap[quality]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal export-modal" role="dialog" aria-modal="true" aria-label="Export board">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Board
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Format selector */}
          <div className="export-section">
            <label className="export-label">Format</label>
            <div className="export-format-grid">
              {[
                { id: "png", icon: "🖼️", name: "PNG", desc: "Raster image, best for sharing" },
                { id: "svg", icon: "✦", name: "SVG", desc: "Vector, scales infinitely" },
                { id: "pdf", icon: "📄", name: "PDF", desc: "Coming soon", disabled: true },
              ].map((f) => (
                <button
                  key={f.id}
                  className={`export-format-card${format === f.id ? " export-format-card--active" : ""}${f.disabled ? " export-format-card--disabled" : ""}`}
                  onClick={() => !f.disabled && setFormat(f.id)}
                  disabled={f.disabled}
                >
                  <span className="export-format-icon">{f.icon}</span>
                  <span className="export-format-name">{f.name}</span>
                  <span className="export-format-desc">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PNG-specific options */}
          {format === "png" && (
            <div className="export-section">
              <label className="export-label">Resolution</label>
              <div className="export-quality-row">
                {["1x", "2x", "3x"].map((q) => (
                  <button
                    key={q}
                    className={`export-quality-btn${quality === q ? " export-quality-btn--active" : ""}`}
                    onClick={() => setQuality(q)}
                  >
                    {q}
                    {q === "2x" && <span className="export-quality-recommended">Recommended</span>}
                  </button>
                ))}
              </div>
              <p className="export-hint">Estimated file size: ~{estimatedSize}</p>
            </div>
          )}

          {/* Padding */}
          <div className="export-section">
            <label className="export-label" htmlFor="export-padding">
              Padding
              <span className="export-label-value">{padding}px</span>
            </label>
            <input
              id="export-padding"
              type="range"
              className="export-slider"
              min={0}
              max={120}
              step={8}
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
            />
            <div className="export-slider-labels">
              <span>None</span>
              <span>Generous</span>
            </div>
          </div>

          {/* Summary */}
          <div className="export-summary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Exporting <strong>{elementCount}</strong> element{elementCount !== 1 ? "s" : ""} as{" "}
            <strong>{format.toUpperCase()}</strong>
            {format === "png" && ` at ${quality} resolution`}
          </div>

          {error && (
            <div className="export-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn--ghost" onClick={onClose} disabled={exporting}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleExport}
            disabled={exporting || elementCount === 0}
          >
            {exporting ? (
              <>
                <span className="spinner spinner--sm" />
                Exporting…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── SVG export (client-side) ── */
function exportToSVG({ elements, padding }) {
  if (!elements.length) return;

  const xs = elements.map((e) => e.x ?? 0);
  const ys = elements.map((e) => e.y ?? 0);
  const x2s = elements.map((e) => (e.x ?? 0) + (e.width ?? 100));
  const y2s = elements.map((e) => (e.y ?? 0) + (e.height ?? 40));

  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...x2s) + padding;
  const maxY = Math.max(...y2s) + padding;

  const w = maxX - minX;
  const h = maxY - minY;

  // Simple text-based SVG representation
  const rects = elements.map((el) => {
    const x = (el.x ?? 0) - minX;
    const y = (el.y ?? 0) - minY;
    const fill = el.fill || el.color || "#ffffff";
    const text = el.text || el.content || "";
    return `<rect x="${x}" y="${y}" width="${el.width ?? 120}" height="${el.height ?? 40}" rx="4" fill="${fill}" stroke="#e2e8f0" stroke-width="1"/>
<text x="${x + (el.width ?? 120) / 2}" y="${y + (el.height ?? 40) / 2 + 5}" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#1a1a2e">${escapeXML(text)}</text>`;
  }).join("\n");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="white"/>
  ${rects}
</svg>`;

  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `collabboard-export-${Date.now()}.svg`);
}

function escapeXML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function estimateSize(count, scale) {
  const bytes = count * 2500 * scale * scale;
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}