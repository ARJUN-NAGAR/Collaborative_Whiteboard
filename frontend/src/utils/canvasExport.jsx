/**
 * utils/canvasExport.js
 * ============================================================================
 * Utility: exportCanvasToPNG
 *
 * Renders all whiteboard elements to an offscreen <canvas> and triggers
 * a PNG download.
 *
 * Features:
 * - Tight bounding-box export
 * - 1x / 2x / 3x resolution rendering
 * - Parallel image preloading
 * - Rectangles
 * - Ellipses / circles
 * - Sticky notes
 * - Text with word-wrap
 * - Arrows / lines
 * - Freehand drawing
 * - Images
 * - Rotation support
 * - zIndex stacking
 * ============================================================================
 */

export async function exportCanvasToPNG({
  elements = [],
  scale = 2,
  padding = 32,
  filename = "collabboard-export.png",
  bg = "#ffffff",
}) {
  if (!elements.length) {
    throw new Error("No elements to export.");
  }

  /* ─────────────────────────────────────────────────────────────
     1. Compute bounding box
  ───────────────────────────────────────────────────────────── */

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    // Freehand path
    if (
      (el.type === "pen" || el.type === "freehand") &&
      Array.isArray(el.points)
    ) {
      for (const p of el.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      continue;
    }

    const x = el.x ?? el.x1 ?? 0;
    const y = el.y ?? el.y1 ?? 0;

    const w =
      el.width ??
      (el.x2 != null && el.x1 != null
        ? Math.abs(el.x2 - el.x1)
        : elementDefaultWidth(el));

    const h =
      el.height ??
      (el.y2 != null && el.y1 != null
        ? Math.abs(el.y2 - el.y1)
        : elementDefaultHeight(el));

    if (el.type === "arrow" || el.type === "line") {
      minX = Math.min(minX, x, el.x2 ?? x);
      minY = Math.min(minY, y, el.y2 ?? y);

      maxX = Math.max(maxX, x + w, el.x2 ?? x);
      maxY = Math.max(maxY, y + h, el.y2 ?? y);
    } else {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);

      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    }
  }

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const logicalW = maxX - minX;
  const logicalH = maxY - minY;

  /* ─────────────────────────────────────────────────────────────
     2. Create offscreen canvas
  ───────────────────────────────────────────────────────────── */

  const canvas = document.createElement("canvas");

  canvas.width = Math.ceil(logicalW * scale);
  canvas.height = Math.ceil(logicalH * scale);

  const ctx = canvas.getContext("2d");

  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, logicalW, logicalH);

  /* ─────────────────────────────────────────────────────────────
     3. Preserve stacking order
  ───────────────────────────────────────────────────────────── */

  const sorted = [...elements].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
  );

  /* ─────────────────────────────────────────────────────────────
     4. Preload images in parallel
  ───────────────────────────────────────────────────────────── */

  const imageCache = {};

  await Promise.all(
    sorted
      .filter((el) => el.type === "image" && el.src)
      .map(
        (el) =>
          new Promise((resolve) => {
            const img = new Image();

            img.crossOrigin = "anonymous";

            img.onload = () => {
              imageCache[el.id] = img;
              resolve();
            };

            img.onerror = () => resolve();

            img.src = el.src;
          })
      )
  );

  /* ─────────────────────────────────────────────────────────────
     5. Draw elements
  ───────────────────────────────────────────────────────────── */

  for (const el of sorted) {
    ctx.save();

    const x = (el.x ?? el.x1 ?? 0) - minX;
    const y = (el.y ?? el.y1 ?? 0) - minY;

    const w =
      el.width ??
      (el.x2 != null && el.x1 != null
        ? Math.abs(el.x2 - el.x1)
        : elementDefaultWidth(el));

    const h =
      el.height ??
      (el.y2 != null && el.y1 != null
        ? Math.abs(el.y2 - el.y1)
        : elementDefaultHeight(el));

    // Rotation support
    if (el.rotation) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }

    switch (el.type) {
      case "rect":
      case "rectangle":
        drawRect(ctx, x, y, w, h, el);
        break;

      case "ellipse":
      case "circle":
        drawEllipse(ctx, x, y, w, h, el);
        break;

      case "sticky":
      case "sticky-note":
        drawSticky(ctx, x, y, w, h, el);
        break;

      case "text":
        drawText(ctx, x, y, w, h, el);
        break;

      case "arrow":
      case "line":
        drawArrow(ctx, el, minX, minY);
        break;

      case "image":
        drawImage(ctx, x, y, w, h, el, imageCache);
        break;

      case "pen":
      case "freehand":
        drawFreehand(ctx, el, minX, minY);
        break;

      default:
        drawRect(ctx, x, y, w, h, el);
        break;
    }

    ctx.restore();
  }

  /* ─────────────────────────────────────────────────────────────
     6. Trigger PNG download
  ───────────────────────────────────────────────────────────── */

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas export failed"));
          return;
        }

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        resolve();
      },
      "image/png",
      1
    );
  });
}

/* ════════════════════════════════════════════════════════════════
   DRAW HELPERS
════════════════════════════════════════════════════════════════ */

function drawRect(ctx, x, y, w, h, el) {
  const radius = el.borderRadius ?? 6;

  ctx.beginPath();
  roundRect(ctx, x, y, w, h, radius);

  ctx.fillStyle = el.fill ?? el.fillColor ?? "#ffffff";
  ctx.fill();

  if (el.stroke || el.strokeColor || el.color) {
    ctx.strokeStyle =
      el.stroke ??
      el.strokeColor ??
      el.color ??
      "#64748b";

    ctx.lineWidth = el.strokeWidth ?? 2;
    ctx.stroke();
  }

  if (el.text || el.content) {
    drawTextInBox(
      ctx,
      el.text ?? el.content,
      x,
      y,
      w,
      h,
      el
    );
  }
}

function drawEllipse(ctx, x, y, w, h, el) {
  ctx.beginPath();

  ctx.ellipse(
    x + w / 2,
    y + h / 2,
    w / 2,
    h / 2,
    0,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = el.fill ?? el.fillColor ?? "#ffffff";
  ctx.fill();

  if (el.stroke || el.strokeColor || el.color) {
    ctx.strokeStyle =
      el.stroke ??
      el.strokeColor ??
      el.color ??
      "#64748b";

    ctx.lineWidth = el.strokeWidth ?? 2;
    ctx.stroke();
  }

  if (el.text || el.content) {
    drawTextInBox(
      ctx,
      el.text ?? el.content,
      x,
      y,
      w,
      h,
      el
    );
  }
}

function drawSticky(ctx, x, y, w, h, el) {
  const fill = el.bgColor ?? el.fill ?? "#fef08a";

  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;

  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 8);

  ctx.fillStyle = fill;
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Accent strip
  ctx.beginPath();
  roundRect(ctx, x, y, w, 8, {
    tl: 8,
    tr: 8,
    bl: 0,
    br: 0,
  });

  ctx.fillStyle = darken(fill, 0.12);
  ctx.fill();

  if (el.text || el.content) {
    drawTextInBox(
      ctx,
      el.text ?? el.content,
      x,
      y + 8,
      w,
      h - 8,
      {
        ...el,
        textColor: "#1a1a2e",
        fontSize: el.fontSize ?? 13,
        padding: 10,
      }
    );
  }
}

function drawText(ctx, x, y, w, h, el) {
  const fontSize = el.fontSize ?? 16;

  ctx.font = `${
    el.fontWeight ?? "normal"
  } ${fontSize}px ${
    el.fontFamily ?? "Inter, sans-serif"
  }`;

  ctx.fillStyle =
    el.textColor ??
    el.color ??
    "#1a1a2e";

  ctx.textBaseline = "top";

  wrapText(
    ctx,
    el.text ?? el.content ?? "",
    x + (el.padding ?? 0),
    y,
    w,
    fontSize
  );
}

function drawArrow(ctx, el, minX, minY) {
  const x1 = (el.x1 ?? el.x ?? 0) - minX;
  const y1 = (el.y1 ?? el.y ?? 0) - minY;

  const x2 = (el.x2 ?? el.x ?? 0) - minX;
  const y2 = (el.y2 ?? el.y ?? 0) - minY;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);

  ctx.strokeStyle =
    el.color ??
    el.strokeColor ??
    "#475569";

  ctx.lineWidth = el.strokeWidth ?? 2;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.stroke();

  if (el.type === "arrow") {
    const angle = Math.atan2(y2 - y1, x2 - x1);

    const size = 12;

    ctx.beginPath();
    ctx.moveTo(x2, y2);

    ctx.lineTo(
      x2 - size * Math.cos(angle - Math.PI / 6),
      y2 - size * Math.sin(angle - Math.PI / 6)
    );

    ctx.lineTo(
      x2 - size * Math.cos(angle + Math.PI / 6),
      y2 - size * Math.sin(angle + Math.PI / 6)
    );

    ctx.closePath();

    ctx.fillStyle =
      el.color ??
      el.strokeColor ??
      "#475569";

    ctx.fill();
  }
}

function drawImage(ctx, x, y, w, h, el, cache) {
  const img = cache[el.id];

  if (img) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }

  // Placeholder
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    "Image",
    x + w / 2,
    y + h / 2
  );
}

function drawFreehand(ctx, el, minX, minY) {
  const points = el.points ?? [];

  if (points.length < 2) return;

  ctx.beginPath();

  ctx.moveTo(
    points[0].x - minX,
    points[0].y - minY
  );

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(
      points[i].x - minX,
      points[i].y - minY
    );
  }

  ctx.strokeStyle =
    el.color ?? "#1a1a2e";

  ctx.lineWidth =
    el.strokeWidth ?? 2;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.stroke();
}

/* ════════════════════════════════════════════════════════════════
   TEXT HELPERS
════════════════════════════════════════════════════════════════ */

function drawTextInBox(
  ctx,
  text,
  x,
  y,
  w,
  h,
  el = {}
) {
  const fontSize = el.fontSize ?? 14;
  const pad = el.padding ?? 8;
  const align = el.textAlign ?? "left";

  ctx.font = `${
    el.fontWeight ?? "normal"
  } ${fontSize}px ${
    el.fontFamily ?? "Inter, sans-serif"
  }`;

  ctx.fillStyle =
    el.textColor ?? "#1a1a2e";

  ctx.textBaseline = "top";
  ctx.textAlign = align;

  const textX =
    align === "center"
      ? x + w / 2
      : x + pad;

  wrapText(
    ctx,
    text,
    textX,
    y + pad,
    w - pad * 2,
    fontSize
  );
}

function wrapText(
  ctx,
  text,
  x,
  y,
  maxWidth,
  lineHeight
) {
  const words = String(text).split(" ");

  let line = "";
  let curY = y;

  for (const word of words) {
    const test = line
      ? `${line} ${word}`
      : word;

    if (
      ctx.measureText(test).width > maxWidth &&
      line
    ) {
      ctx.fillText(line, x, curY);

      line = word;

      curY += lineHeight * 1.4;
    } else {
      line = test;
    }
  }

  if (line) {
    ctx.fillText(line, x, curY);
  }
}

/* ════════════════════════════════════════════════════════════════
   CANVAS HELPERS
════════════════════════════════════════════════════════════════ */

function roundRect(ctx, x, y, w, h, r) {
  if (typeof r === "number") {
    r = {
      tl: r,
      tr: r,
      br: r,
      bl: r,
    };
  }

  ctx.moveTo(x + r.tl, y);

  ctx.lineTo(x + w - r.tr, y);
  ctx.quadraticCurveTo(
    x + w,
    y,
    x + w,
    y + r.tr
  );

  ctx.lineTo(x + w, y + h - r.br);
  ctx.quadraticCurveTo(
    x + w,
    y + h,
    x + w - r.br,
    y + h
  );

  ctx.lineTo(x + r.bl, y + h);
  ctx.quadraticCurveTo(
    x,
    y + h,
    x,
    y + h - r.bl
  );

  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(
    x,
    y,
    x + r.tl,
    y
  );

  ctx.closePath();
}

/* ════════════════════════════════════════════════════════════════
   UTILITIES
════════════════════════════════════════════════════════════════ */

function darken(hex, amount) {
  const num = parseInt(
    hex.replace("#", ""),
    16
  );

  const r = Math.max(
    0,
    ((num >> 16) & 0xff) -
      Math.round(255 * amount)
  );

  const g = Math.max(
    0,
    ((num >> 8) & 0xff) -
      Math.round(255 * amount)
  );

  const b = Math.max(
    0,
    (num & 0xff) -
      Math.round(255 * amount)
  );

  return `#${[r, g, b]
    .map((v) =>
      v.toString(16).padStart(2, "0")
    )
    .join("")}`;
}

function elementDefaultWidth(el) {
  if (el.type === "text") return 200;

  if (
    el.type === "sticky" ||
    el.type === "sticky-note"
  ) {
    return 160;
  }

  return 120;
}

function elementDefaultHeight(el) {
  if (el.type === "text") return 24;

  if (
    el.type === "sticky" ||
    el.type === "sticky-note"
  ) {
    return 120;
  }

  return 80;
}