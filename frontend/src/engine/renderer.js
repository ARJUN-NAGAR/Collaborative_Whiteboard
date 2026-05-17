export function drawElement(ctx, el) {
  if (el.hidden) return;

  ctx.save();
  ctx.strokeStyle = el.strokeColor || el.color || '#111827';
  ctx.fillStyle = el.fillColor || 'transparent';
  ctx.lineWidth = el.strokeWidth || 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (el.type === 'pen' && el.points?.length > 1) {
    ctx.beginPath();
    ctx.moveTo(el.points[0].x, el.points[0].y);
    for (let i = 1; i < el.points.length - 1; i++) {
      const mx = (el.points[i].x + el.points[i + 1].x) / 2;
      const my = (el.points[i].y + el.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, mx, my);
    }
    ctx.lineTo(el.points[el.points.length - 1].x, el.points[el.points.length - 1].y);
    ctx.stroke();
  } else if (el.type === 'rect') {
    const w = el.x2 - el.x1;
    const h = el.y2 - el.y1;
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillRect(el.x1, el.y1, w, h);
    }
    ctx.strokeRect(el.x1, el.y1, w, h);
  } else if (el.type === 'circle') {
    const cx = (el.x1 + el.x2) / 2;
    const cy = (el.y1 + el.y2) / 2;
    const rx = Math.abs(el.x2 - el.x1) / 2;
    const ry = Math.abs(el.y2 - el.y1) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (el.fillColor && el.fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  } else if (el.type === 'line') {
    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
  } else if (el.type === 'arrow') {
    const dx = el.x2 - el.x1, dy = el.y2 - el.y1;
    const angle = Math.atan2(dy, dx);
    const headLen = 16;
    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(el.x2, el.y2);
    ctx.lineTo(el.x2 - headLen * Math.cos(angle - Math.PI / 6), el.y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(el.x2, el.y2);
    ctx.lineTo(el.x2 - headLen * Math.cos(angle + Math.PI / 6), el.y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  } else if (el.type === 'text') {
    ctx.font = `${el.fontSize || 18}px Inter, sans-serif`;
    ctx.fillStyle = el.strokeColor || el.color || '#111827';
    const lines = (el.text || '').split('\n');
    lines.forEach((line, i) => ctx.fillText(line, el.x, el.y + i * (el.fontSize || 18) * 1.3));
  } else if (el.type === 'sticky') {
    // Note background
    ctx.fillStyle = el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : '#fbbf24';
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    const width = el.width || 160;
    const height = el.height || 160;
    
    // Draw rounded rect
    ctx.beginPath();
    ctx.roundRect(el.x, el.y, width, height, 8);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Note text
    ctx.fillStyle = '#1a1a1a'; // Always dark for sticky notes by default
    ctx.font = `14px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    
    const words = (el.text || '').split(' ');
    let line = '';
    const lines2 = [];
    const maxW = width - 24; // 12px padding on each side
    
    words.forEach((w) => {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        lines2.push(line.trim());
        line = w + ' ';
      } else {
        line = test;
      }
    });
    if (line) lines2.push(line.trim());
    lines2.forEach((l, i) => ctx.fillText(l, el.x + 12, el.y + 16 + i * 20));
  }
  ctx.restore();
}

export function drawSelectionBox(ctx, el, scale, color = '#4f46e5') {
  if (el.hidden) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 / scale;
  
  let minX, minY, maxX, maxY;
  
  if (['rect', 'circle', 'line', 'arrow'].includes(el.type)) {
    minX = Math.min(el.x1, el.x2); maxX = Math.max(el.x1, el.x2);
    minY = Math.min(el.y1, el.y2); maxY = Math.max(el.y1, el.y2);
  } else if (el.type === 'sticky') {
    minX = el.x; maxX = el.x + (el.width || 160);
    minY = el.y; maxY = el.y + (el.height || 160);
  } else if (el.type === 'text') {
    // Rough estimation
    minX = el.x; maxX = el.x + 100;
    minY = el.y - 20; maxY = el.y + 20;
  } else if (el.type === 'pen' && el.points?.length) {
    minX = Math.min(...el.points.map(p => p.x)); maxX = Math.max(...el.points.map(p => p.x));
    minY = Math.min(...el.points.map(p => p.y)); maxY = Math.max(...el.points.map(p => p.y));
  }
  
  if (minX !== undefined) {
    const pad = 6;
    ctx.strokeRect(minX - pad, minY - pad, (maxX - minX) + pad*2, (maxY - minY) + pad*2);
    
    // Draw handles
    ctx.fillStyle = '#fff';
    const handleSize = 6 / scale;
    const drawHandle = (x, y) => {
      ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
    };
    
    drawHandle(minX - pad, minY - pad);
    drawHandle(maxX + pad, minY - pad);
    drawHandle(minX - pad, maxY + pad);
    drawHandle(maxX + pad, maxY + pad);
  }
  
  ctx.restore();
}
