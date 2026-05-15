import React from 'react';
import { LayoutTemplate, AlignStartVertical, GitBranch } from 'lucide-react';

export default function TemplateLibrary({ onClose, onAddElement, userId }) {
  const withDefaults = (element, index) => ({
    strokeColor: '#111827',
    fillColor: 'transparent',
    strokeWidth: 2,
    zIndex: Date.now() + index,
    userId,
    ...element,
  });

  const insertKanban = () => {
    const templates = [];
    const baseY = 100;
    const cols = ['To Do', 'In Progress', 'Done'];
    
    // Draw columns
    cols.forEach((col, i) => {
      const x = 100 + i * 300;
      // Header text
      templates.push({
        id: crypto.randomUUID(),
        type: 'text',
        x: x + 100,
        y: baseY + 30,
        text: col,
        strokeColor: '#111827',
        fontSize: 24,
      });
      // Vertical divider
      templates.push({
        id: crypto.randomUUID(),
        type: 'line',
        x1: x + 280,
        y1: baseY,
        x2: x + 280,
        y2: baseY + 800,
        strokeColor: '#d1d5db',
        strokeWidth: 2,
      });
      // Example sticky
      templates.push({
        id: crypto.randomUUID(),
        type: 'sticky',
        x: x + 60,
        y: baseY + 80,
        width: 160,
        height: 120,
        text: `Example ${col} task`,
        fillColor: ['#fde68a','#bbf7d0','#bfdbfe'][i],
      });
    });

    templates.map(withDefaults).forEach(el => onAddElement(el));
    onClose();
  };

  const insertFlowchart = () => {
    const templates = [
      { id: crypto.randomUUID(), type: 'rect', x1: 300, y1: 100, x2: 450, y2: 160, strokeColor: '#2563eb', fillColor: '#dbeafe', strokeWidth: 3 },
      { id: crypto.randomUUID(), type: 'text', x: 340, y: 135, text: 'Start', strokeColor: '#111827', fontSize: 18 },
      { id: crypto.randomUUID(), type: 'arrow', x1: 375, y1: 160, x2: 375, y2: 220, strokeColor: '#2563eb', strokeWidth: 2 },
      
      { id: crypto.randomUUID(), type: 'rect', x1: 275, y1: 220, x2: 475, y2: 300, strokeColor: '#059669', fillColor: '#d1fae5', strokeWidth: 3 },
      { id: crypto.randomUUID(), type: 'text', x: 300, y: 265, text: 'Process Step', strokeColor: '#111827', fontSize: 18 },
      { id: crypto.randomUUID(), type: 'arrow', x1: 375, y1: 300, x2: 375, y2: 360, strokeColor: '#059669', strokeWidth: 2 },
      
      { id: crypto.randomUUID(), type: 'rect', x1: 300, y1: 360, x2: 450, y2: 420, strokeColor: '#dc2626', fillColor: '#fee2e2', strokeWidth: 3 },
      { id: crypto.randomUUID(), type: 'text', x: 345, y: 395, text: 'End', strokeColor: '#111827', fontSize: 18 },
    ];
    templates.map(withDefaults).forEach(el => onAddElement(el));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Template Library</h2>
        <p className="modal-subtitle">Kickstart your brainstorming session with a predefined layout.</p>
        
        <div className="export-options">
          <div className="export-option" onClick={insertKanban}>
            <div className="export-option-icon" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
              <AlignStartVertical size={20} />
            </div>
            <div className="export-option-text">
              <div className="export-option-title">Kanban Board</div>
              <div className="export-option-desc">To Do, In Progress, Done columns</div>
            </div>
          </div>

          <div className="export-option" onClick={insertFlowchart}>
            <div className="export-option-icon" style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa' }}>
              <GitBranch size={20} />
            </div>
            <div className="export-option-text">
              <div className="export-option-title">Basic Flowchart</div>
              <div className="export-option-desc">Start, Process, End diagram</div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
