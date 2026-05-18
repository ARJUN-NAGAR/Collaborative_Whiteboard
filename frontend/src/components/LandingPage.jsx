import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../components/ToastSystem";
import { sessionAPI } from "../services/api";
import { ChevronDown, ArrowRight, Zap, Users, Shield, Star, Menu, X } from "lucide-react";

const FEATURES = [
  {
    icon: <Zap size={20} />,
    title: "Real-time collaboration",
    desc: "Every stroke, shape and sticky note syncs instantly across your entire team on an infinite canvas.",
  },
  {
    icon: <Users size={20} />,
    title: "Team workspaces",
    desc: "Organize boards by projects, invite teammates, and assign roles with granular permissions.",
  },
  {
    icon: <Shield size={20} />,
    title: "Enterprise-ready",
    desc: "SSO, audit logs, role-based access controls, and end-to-end encryption built in from day one.",
  },
  {
    icon: <Star size={20} />,
    title: "500+ Templates",
    desc: "Jump-start any project with professionally designed Kanban boards, flowcharts, and wireframes.",
  },
];

const STICKIES = [
  { text: "User Research", color: "#FDE68A", x: 28, y: 38, rotate: -2 },
  { text: "Competitive Analysis", color: "#BBF7D0", x: 198, y: 24, rotate: 1.5 },
  { text: "Wireframes", color: "#BFDBFE", x: 370, y: 44, rotate: -1 },
  { text: "User Flow", color: "#FDE68A", x: 128, y: 140, rotate: 2 },
  { text: "Ideas ✦", color: "#E9D5FF", x: 300, y: 130, rotate: -1.5 },
];

const METRICS = [
  { value: "50k+", label: "Teams" },
  { value: "2M+", label: "Boards created" },
  { value: "99.9%", label: "Uptime" },
  { value: "<50ms", label: "Sync latency" },
];

export default function LandingPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const [createName, setCreateName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [loading, setLoading] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName.trim()) { addToast("Enter a board name", "error"); return; }
    setLoading("create");
    try {
      const session = await sessionAPI.create({
        name: createName.trim(),
        ownerName: currentUser?.name || "Anonymous",
        ownerId: currentUser?.id || "guest",
      });
      navigate(`/board/${session.id}`, { state: { sessionData: session } });
    } catch { addToast("Could not create session", "error"); }
    finally { setLoading(""); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinId.trim()) { addToast("Enter a Session ID", "error"); return; }
    setLoading("join");
    try {
      const session = await sessionAPI.getById(joinId.trim());
      if (!session) { addToast("Session not found", "error"); return; }
      navigate(`/board/${session.id}`, { state: { sessionData: session } });
    } catch { addToast("Could not join session", "error"); }
    finally { setLoading(""); }
  };

  return (
    <div className="lp-root">

      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => navigate("/")}>
            <div className="lp-logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A0A14">
                <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
              </svg>
            </div>
            <span className="lp-logo-text">CollabBoard</span>
          </div>

          <div className="lp-nav-links">
            {["Product", "Solutions", "Resources"].map((link) => (
              <button key={link} className="lp-nav-link">
                {link} <ChevronDown size={12} />
              </button>
            ))}
            <button className="lp-nav-link" onClick={() => navigate("/pricing")}>
              Pricing
            </button>
          </div>

          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={toggleTheme} style={{ fontSize: "1rem", padding: "6px 10px" }}>
              {theme === "dark" ? "☀" : "⏾"}
            </button>
            {currentUser ? (
              <>
                <span className="lp-nav-user">{currentUser.name}</span>
                <button className="lp-btn-ghost" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </button>
                <button className="lp-btn-ghost" onClick={onLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button className="lp-btn-ghost" onClick={() => navigate("/login")}>
                  Sign in
                </button>
                <button className="lp-btn-primary" onClick={() => navigate("/register")}>
                  Get started free
                </button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lp-btn-ghost hidden-desktop"
            style={{ marginLeft: "auto" }}
            onClick={() => setMobileMenuOpen((s) => !s)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "12px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="lp-btn-ghost" onClick={() => navigate("/pricing")}>Pricing</button>
            {currentUser ? (
              <>
                <button className="lp-btn-ghost" onClick={() => navigate("/dashboard")}>Dashboard</button>
                <button className="lp-btn-ghost" onClick={onLogout}>Sign out</button>
              </>
            ) : (
              <>
                <button className="lp-btn-ghost" onClick={() => navigate("/login")}>Sign in</button>
                <button className="lp-btn-primary" onClick={() => navigate("/register")}>Get started</button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-content">

          {/* Badge */}
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            Real-time collaboration — now with AI assist →
          </div>

          {/* Headline */}
          <h1 className="lp-hero-title">
            Where great teams<br />
            <span className="lp-hero-gradient">build together</span>
          </h1>

          <p className="lp-hero-sub">
            CollabBoard is the infinite canvas your team has been waiting for.
            Draw, plan, and ship — in real time, together.
          </p>

          {/* CTAs */}
          {currentUser ? (
            <div className="lp-hero-forms">
              <div className="lp-form-card">
                <div className="lp-form-label">Create a new board</div>
                <form onSubmit={handleCreate} className="lp-form-row">
                  <input
                    className="lp-input"
                    placeholder="Board name…"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                  <button type="submit" className="lp-btn-primary" disabled={loading === "create"}>
                    {loading === "create" ? "Creating…" : "Create"}
                  </button>
                </form>
              </div>
              <div className="lp-form-card">
                <div className="lp-form-label">Join existing board</div>
                <form onSubmit={handleJoin} className="lp-form-row">
                  <input
                    className="lp-input"
                    placeholder="Session ID or share code…"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                  />
                  <button type="submit" className="lp-btn-outline" disabled={loading === "join"}>
                    {loading === "join" ? "Joining…" : "Join"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="lp-hero-ctas">
              <button
                className="lp-btn-primary lp-btn-lg"
                onClick={() => navigate("/register")}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                Start for free
                <ArrowRight size={16} />
              </button>
              <button
                className="lp-btn-outline lp-btn-lg"
                onClick={() => navigate("/pricing")}
              >
                View pricing
              </button>
            </div>
          )}

          {/* Metrics strip */}
          <div style={{ display: "flex", gap: "3rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginTop: currentUser ? "1.5rem" : 0, opacity: 0.7 }}>
            {METRICS.map((m) => (
              <div key={m.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--lime)", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {m.value}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3, fontWeight: 600 }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Board preview */}
        <div className="lp-preview">
          <div className="lp-preview-chrome">
            <div className="lp-chrome-dots">
              <span /><span /><span />
            </div>
            <span className="lp-chrome-title">Q3 Product Planning · 3 collaborators</span>
            <div className="lp-chrome-avatars">
              {["#C4FF33", "#3EA6FF", "#FF5E42"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 22, height: 22, borderRadius: "50%", background: c,
                    border: "2px solid var(--bg-surface)",
                    marginLeft: i ? -6 : 0, display: "inline-block",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="lp-preview-canvas">
            <div className="lp-canvas-grid" />
            {/* Connectors */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <path d="M 115 65 Q 160 80 190 155" stroke="rgba(196,255,51,0.25)" strokeWidth="1.5" fill="none" strokeDasharray="4,3" />
              <path d="M 285 55 Q 320 90 315 145" stroke="rgba(62,166,255,0.25)" strokeWidth="1.5" fill="none" strokeDasharray="4,3" />
            </svg>
            {/* Stickies */}
            {STICKIES.map((s, i) => (
              <div
                key={i}
                className="lp-sticky"
                style={{ background: s.color, left: s.x, top: s.y, transform: `rotate(${s.rotate}deg)` }}
              >
                {s.text}
              </div>
            ))}
            {/* Cursors */}
            <div className="lp-cursor" style={{ left: 316, top: 92 }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M5 3l14 9-7 2-2 7z" fill="#C4FF33" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
              </svg>
              <span className="lp-cursor-label" style={{ background: "#3A5500" }}>Sarah</span>
            </div>
            <div className="lp-cursor" style={{ left: 184, top: 48 }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M5 3l14 9-7 2-2 7z" fill="#3EA6FF" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
              </svg>
              <span className="lp-cursor-label" style={{ background: "#0D3A6B" }}>Alex</span>
            </div>

            {/* Live indicator */}
            <div style={{
              position: "absolute", bottom: 14, right: 14,
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--glass)", border: "1px solid var(--glass-border)",
              borderRadius: "var(--r-full)", padding: "4px 10px",
              fontSize: "0.65rem", fontWeight: 700, color: "var(--green)",
              backdropFilter: "blur(8px)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite" }} />
              LIVE
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section className="lp-features">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">Everything your team needs</h2>
          <p className="lp-section-sub">
            A complete workspace for visual collaboration — from first idea to final delivery.
          </p>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────── */}
      {!currentUser && (
        <section className="lp-cta-banner">
          <div className="lp-section-inner" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            {/* Decorative element */}
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 56, height: 56, borderRadius: "var(--r-lg)",
              background: "var(--lime-muted)", border: "1px solid var(--lime-border)",
              marginBottom: "1.5rem", fontSize: "1.5rem",
            }}>✦</div>
            <h2 className="lp-cta-title">Start collaborating today</h2>
            <p className="lp-cta-sub">No credit card required. Up to 3 boards free, forever.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
              <button
                className="lp-btn-primary lp-btn-lg"
                onClick={() => navigate("/register")}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                Get started free <ArrowRight size={16} />
              </button>
              <button
                className="lp-btn-outline lp-btn-lg"
                onClick={() => navigate("/pricing")}
              >
                View pricing
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo-icon" style={{ width: 22, height: 22, flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A0A14">
                <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.9rem" }}>
              CollabBoard
            </span>
          </div>
          <div className="lp-footer-links">
            {["Privacy", "Terms", "Security", "Status", "Blog", "Changelog"].map((l) => (
              <span key={l} className="lp-footer-link">{l}</span>
            ))}
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} CollabBoard, Inc.</p>
        </div>
      </footer>

      <style>{`
        .hidden-desktop { display: none; }
        @media (max-width: 768px) { .hidden-desktop { display: flex; } }
      `}</style>
    </div>
  );
}