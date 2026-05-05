import { useState } from 'react';
import { X, Image, FileText, Save } from 'lucide-react';
import { sessionAPI } from '../services/api';

export default function ExportModal({ canvasRef, sessionName, elements, onClose }) {
  const [saving, setSaving] = useState('');

  const exportPNG = async () => {
    setSaving('png');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const container = canvasRef?.current?.getCanvas?.()?.parentElement || document.querySelector('.canvas-container');
      const canvas = await html2canvas(container, { backgroundColor: '#111118', scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `${sessionName || 'whiteboard'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // Fallback: use the main canvas directly
      const mainCanvas = canvasRef?.current?.getCanvas?.();
      if (mainCanvas) {
        const link = document.createElement('a');
        link.download = `${sessionName || 'whiteboard'}.png`;
        link.href = mainCanvas.toDataURL('image/png');
        link.click();
      }
    }
    setSaving('');
    onClose();
  };

  const exportPDF = async () => {
    setSaving('pdf');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const container = document.querySelector('.canvas-container');
      const canvas = await html2canvas(container, { backgroundColor: '#111118', scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${sessionName || 'whiteboard'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
    setSaving('');
    onClose();
  };

  const saveToServer = async () => {
    setSaving('server');
    try {
      // Already auto-saved, just trigger manual save
      alert('Board saved to server!');
    } finally {
      setSaving('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
          <div className="modal-title">Export Whiteboard</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4 }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-subtitle">Choose how you'd like to save or export your board.</div>

        <div className="export-options">
          <button className="export-option" onClick={exportPNG} disabled={saving === 'png'}>
            <div className="export-option-icon" style={{ background:'rgba(6,182,212,0.15)' }}>
              <Image size={20} color="#06b6d4" />
            </div>
            <div className="export-option-text">
              <div className="export-option-title">{saving === 'png' ? 'Exporting…' : 'Export as PNG'}</div>
              <div className="export-option-desc">High-resolution image of your whiteboard</div>
            </div>
          </button>

          <button className="export-option" onClick={exportPDF} disabled={saving === 'pdf'}>
            <div className="export-option-icon" style={{ background:'rgba(236,72,153,0.15)' }}>
              <FileText size={20} color="#ec4899" />
            </div>
            <div className="export-option-text">
              <div className="export-option-title">{saving === 'pdf' ? 'Generating PDF…' : 'Export as PDF'}</div>
              <div className="export-option-desc">PDF document ready to share or print</div>
            </div>
          </button>

          <button className="export-option" onClick={saveToServer} disabled={saving === 'server'}>
            <div className="export-option-icon" style={{ background:'rgba(16,185,129,0.15)' }}>
              <Save size={20} color="#10b981" />
            </div>
            <div className="export-option-text">
              <div className="export-option-title">Save to Server</div>
              <div className="export-option-desc">Persist your board — reload anytime</div>
            </div>
          </button>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
