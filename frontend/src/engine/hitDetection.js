export function isHit(el, x, y) {
  if (el.hidden || el.locked) return false;

  const pad = 10;
  
  if (el.type === 'rect' || el.type === 'sticky') {
    const minX = Math.min(el.x1 ?? el.x, el.x2 ?? el.x + (el.width || 160));
    const maxX = Math.max(el.x1 ?? el.x, el.x2 ?? el.x + (el.width || 160));
    const minY = Math.min(el.y1 ?? el.y, el.y2 ?? el.y + (el.height || 120));
    const maxY = Math.max(el.y1 ?? el.y, el.y2 ?? el.y + (el.height || 120));
    return x >= minX - pad && x <= maxX + pad && y >= minY - pad && y <= maxY + pad;
  }
  
  if (el.type === 'circle') {
    const cx = (el.x1 + el.x2) / 2;
    const cy = (el.y1 + el.y2) / 2;
    const rx = Math.abs(el.x2 - el.x1) / 2;
    const ry = Math.abs(el.y2 - el.y1) / 2;
    // Simple bounding box for circle for speed, could be improved to ellipse equation
    return x >= cx - rx - pad && x <= cx + rx + pad && y >= cy - ry - pad && y <= cy + ry + pad;
  }
  
  if (el.type === 'line' || el.type === 'arrow') {
    const minX = Math.min(el.x1, el.x2), maxX = Math.max(el.x1, el.x2);
    const minY = Math.min(el.y1, el.y2), maxY = Math.max(el.y1, el.y2);
    // Rough bounding box first
    if (!(x >= minX - pad && x <= maxX + pad && y >= minY - pad && y <= maxY + pad)) return false;
    
    // Distance to line segment
    const l2 = Math.pow(el.x2 - el.x1, 2) + Math.pow(el.y2 - el.y1, 2);
    if (l2 === 0) return Math.hypot(x - el.x1, y - el.y1) < pad;
    let t = ((x - el.x1) * (el.x2 - el.x1) + (y - el.y1) * (el.y2 - el.y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = el.x1 + t * (el.x2 - el.x1);
    const projY = el.y1 + t * (el.y2 - el.y1);
    return Math.hypot(x - projX, y - projY) < pad;
  }
  
  if (el.type === 'text') {
    // Rough estimate, should ideally use ctx.measureText
    return x >= el.x - pad && x <= el.x + 150 && y >= el.y - 20 && y <= el.y + 40;
  }
  
  if (el.type === 'pen') {
    return el.points?.some((p) => Math.hypot(p.x - x, p.y - y) < pad + 2);
  }
  
  return false;
}
