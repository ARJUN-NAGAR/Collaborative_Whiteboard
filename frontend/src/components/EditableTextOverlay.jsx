import React, { useState, useEffect, useRef } from 'react';

export default function EditableTextOverlay({ 
  text, 
  x, 
  y, 
  color, 
  fontSize, 
  zoom, 
  panOffset, 
  onSave, 
  onCancel 
}) {
  const [value, setValue] = useState(text || '');
  const textareaRef = useRef(null);

  // Focus and select all on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      if (!text) {
        // If it's new text, we don't necessarily need to select, just focus
      } else {
        // Put cursor at the end
        textareaRef.current.setSelectionRange(value.length, value.length);
      }
    }
  }, [text, value.length]);

  // Adjust textarea height automatically based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, zoom]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Commit on Enter (use Shift+Enter for newline)
      e.preventDefault();
      onSave(value);
    }
  };

  const handleBlur = () => {
    onSave(value);
  };

  const screenX = x * zoom + panOffset.x;
  const screenY = y * zoom + panOffset.y;

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY - (fontSize * zoom * 0.2), // slight adjustment for baseline
        fontSize: `${fontSize * zoom}px`,
        color: color,
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.3,
        background: 'transparent',
        border: '1px solid var(--accent)',
        outline: 'none',
        resize: 'none',
        padding: 0,
        margin: 0,
        minWidth: `${100 * zoom}px`,
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    />
  );
}
