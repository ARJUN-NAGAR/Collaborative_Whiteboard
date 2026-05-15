import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../components/ToastSystem";
import { sessionAPI } from "../services/api";

export default function LandingPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const heroRef = useRef(null);

  const [createName, setCreateName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [loading, setLoading] = useState("");

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handle = (e) => {
      const { clientX, clientY } = e;
      const xPct = (clientX / window.innerWidth - 0.5) * 20;
      const yPct = (clientY / window.innerHeight - 0.5) * 20;
      hero.style.setProperty("--px", `${xPct}px`);
      hero.style.setProperty("--py", `${yPct}px`);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createName.trim()) { addToast("Please enter a board name", "error"); return; }
    setLoading("create");
    try {
      const session = await sessionAPI.create({
        name: createName.trim(),
        ownerName: currentUser.name,
        ownerId: currentUser.id,
      });
      navigate(`/board/${session.id}`, { state: { sessionData: session } });
    } catch (err) {
      addToast("Could not create session", "error");
    } finally { setLoading(""); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinId.trim()) { addToast("Please enter a Session ID", "error"); return; }
    setLoading("join");
    try {
      const session = await sessionAPI.getById(joinId.trim());
      if (!session) { addToast("Session not found", "error"); return; }
      navigate(`/board/${session.id}`, { state: { sessionData: session } });
    } catch (err) {
      addToast("Could not join session", "error");
    } finally { setLoading(""); }
  };

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="nav-logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--accent)" />
            <rect x="7" y="7" width="8" height="8" rx="2" fill="white" opacity=".9" />
            <rect x="17" y="7" width="8" height="8" rx="2" fill="white" opacity=".6" />
            <rect x="7" y="17" width="8" height="8" rx="2" fill="white" opacity=".6" />
            <rect x="17" y="17" width="8" height="8" rx="2" fill="white" opacity=".3" />
          </svg>
          <span>CollabBoard</span>
        </div>
        <div className="nav-actions">
          <button className="landing-nav__theme" onClick={toggleTheme} title="Toggle theme" style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex" }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-hover)", padding: "4px 12px", borderRadius: "100px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{currentUser.name}</span>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => navigate("/dashboard")}>Dashboard</button>
              <button className="btn btn--secondary btn--sm" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <>
              <button className="btn btn--ghost" onClick={() => navigate("/login")}>Sign in</button>
              <button className="btn btn--primary" onClick={() => navigate("/register")}>Get started free</button>
            </>
          )}
        </div>
      </nav>

      <section className="landing-hero" ref={heroRef}>
        <div className="landing-hero__bg" aria-hidden="true" />
        <div className="landing-hero__content">
          <div className="hero-badge"><span className="hero-badge">✦ Live Collaboration</span></div>
          <h1 className="hero-title">Your team's<br /><span className="text-accent">creative canvas</span>,<br />multiplied.</h1>
          <p className="hero-subtitle">Real-time whiteboard collaboration with drawing tools, sticky notes, live cursors, and video — all in the browser.</p>
          
          <div className="hero-actions" style={{ flexDirection: currentUser ? "column" : "row", gap: currentUser ? "1rem" : "1.5rem", alignItems: "stretch", width: "100%", maxWidth: "420px" }}>
            {currentUser ? (
              <>
                <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "12px", gap: "8px", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textAlign: "left" }}>Start a new session</span>
                  <form onSubmit={handleCreate} style={{ display: "flex", gap: "8px" }}>
                    <input className="form-input" style={{ flex: 1 }} placeholder="Board name..." value={createName} onChange={e => setCreateName(e.target.value)} />
                    <button type="submit" className="btn btn--primary" disabled={loading === "create"}>{loading === "create" ? "..." : "Create"}</button>
                  </form>
                </div>
                <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "12px", gap: "8px", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textAlign: "left" }}>Join existing session</span>
                  <form onSubmit={handleJoin} style={{ display: "flex", gap: "8px" }}>
                    <input className="form-input" style={{ flex: 1 }} placeholder="Session ID..." value={joinId} onChange={e => setJoinId(e.target.value)} />
                    <button type="submit" className="btn btn--secondary" disabled={loading === "join"}>{loading === "join" ? "..." : "Join"}</button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <button className="btn btn--primary btn--lg" onClick={() => navigate("/register")}>Start for free</button>
                <button className="btn btn--ghost btn--lg" onClick={() => navigate("/demo")}>Watch demo</button>
              </>
            )}
          </div>
        </div>

        {/* Floating preview */}
        <div className="hero-preview" aria-hidden="true">
          <div className="preview-frame">
            <div className="preview-toolbar">
              <span className="preview-dot" style={{ background: "var(--error)" }} />
              <span className="preview-dot" style={{ background: "var(--warning)" }} />
              <span className="preview-dot" style={{ background: "var(--success)" }} />
            </div>
            <div className="preview-canvas">
              <div className="preview-sticky" style={{ top: "18%", left: "12%", background: "var(--accent)", opacity: 0.85 }}>Sprint goals 🎯</div>
              <div className="preview-sticky" style={{ top: "44%", left: "48%", background: "var(--success)", opacity: 0.8 }}>Ship it! 🚀</div>
              <div className="preview-sticky" style={{ top: "62%", left: "16%", background: "var(--warning)", opacity: 0.8 }}>Review UX ✏️</div>
              <div className="preview-cursor" style={{ top: "28%", left: "60%" }}>
                <svg width="16" height="20" viewBox="0 0 16 20" fill="var(--accent)"><path d="M0 0 L0 20 L5 15 L9 20 L11 19 L7 14 L13 14 Z" /></svg>
                <span>Alex</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="landing-footer">
        <div className="landing-footer__brand">
          <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>CollabBoard</span>
        </div>
        <p className="landing-footer__copy">© {new Date().getFullYear()} CollabBoard. Built for distributed teams.</p>
      </footer>
    </div>
  );
}