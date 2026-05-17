import React, { useRef, useState, useCallback } from "react";

/**
 * VideoOverlay
 * - Draggable via pointer capture
 * - Pinned to bottom-right by default; user can drag anywhere inside viewport
 * - Uses design-system CSS tokens (no hardcoded var(--purple))
 * - isHost controls mute / camera buttons
 */
export default function VideoOverlay({ localStream, participants = [], isHost }) {
  const overlayRef = useRef(null);
  const dragState = useRef({ dragging: false, ox: 0, oy: 0 });
  const [pos, setPos] = useState({ right: 16, bottom: 72, left: null, top: null });
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  /* ── Pointer-capture drag ── */
  const onPointerDown = useCallback((e) => {
    // Only drag from the header bar, not from buttons
    if (e.target.closest(".vo-btn")) return;
    const el = overlayRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    dragState.current = {
      dragging: true,
      ox: e.clientX - rect.left,
      oy: e.clientY - rect.top,
    };
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragState.current.dragging) return;
    const { ox, oy } = dragState.current;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const el = overlayRef.current;
    const w = el ? el.offsetWidth : 240;
    const h = el ? el.offsetHeight : 180;

    let newLeft = e.clientX - ox;
    let newTop = e.clientY - oy;

    // Clamp inside viewport
    newLeft = Math.max(0, Math.min(vw - w, newLeft));
    newTop = Math.max(0, Math.min(vh - h, newTop));

    setPos({ left: newLeft, top: newTop, right: null, bottom: null });
  }, []);

  const onPointerUp = useCallback((e) => {
    dragState.current.dragging = false;
    const el = overlayRef.current;
    if (el) el.releasePointerCapture(e.pointerId);
  }, []);

  /* ── Toggle local stream tracks ── */
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = muted));
    }
    setMuted((m) => !m);
  };

  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = camOff));
    }
    setCamOff((c) => !c);
  };

  /* ── Position style ── */
  const posStyle =
    pos.left !== null
      ? { left: pos.left, top: pos.top }
      : { right: pos.right, bottom: pos.bottom };

  const remoteParticipants = participants.filter((p) => p.stream);

  return (
    <div
      className="video-overlay"
      ref={overlayRef}
      style={{ ...posStyle, position: "fixed", zIndex: 200 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Drag handle header */}
      <div className="vo-header">
        <span className="vo-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="10" r="3"/>
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
          </svg>
          {participants.length + 1} in call
        </span>
        <div className="vo-controls">
          <button
            className={`vo-btn${muted ? " vo-btn--active" : ""}`}
            onClick={toggleMute}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
          <button
            className={`vo-btn${camOff ? " vo-btn--active" : ""}`}
            onClick={toggleCam}
            title={camOff ? "Enable camera" : "Disable camera"}
          >
            {camOff ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Video tiles grid */}
      <div className="vo-grid" data-count={Math.min(remoteParticipants.length + 1, 4)}>
        {/* Local tile */}
        <VideoTile stream={localStream} label="You" muted camOff={camOff} isLocal />

        {/* Remote tiles */}
        {remoteParticipants.slice(0, 3).map((p) => (
          <VideoTile key={p.userId} stream={p.stream} label={p.name || "Guest"} color={p.color} />
        ))}
      </div>
    </div>
  );
}

/* ── Single video tile ── */
function VideoTile({ stream, label, muted = false, camOff = false, isLocal = false, color }) {
  const videoRef = useRef(null);

  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = label
    ? label.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className={`vo-tile${isLocal ? " vo-tile--local" : ""}`}>
      {stream && !camOff ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="vo-video" />
      ) : (
        <div className="vo-avatar" style={color ? { background: color } : {}}>
          {initials}
        </div>
      )}
      <span className="vo-tile-label">{label}</span>
      {muted && (
        <span className="vo-tile-muted" title="Muted">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
          </svg>
        </span>
      )}
    </div>
  );
}