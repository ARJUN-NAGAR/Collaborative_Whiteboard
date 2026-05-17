import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../components/ToastSystem";
import { sessionAPI } from "../services/api";
import { ChevronDown, ArrowRight, Zap, Users, Shield, Star } from "lucide-react";

const COMPANY_LOGOS = [
  { name: "Google", svg: <svg viewBox="0 0 74 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{height:18}}><text y="18" fontFamily="sans-serif" fontWeight="700" fontSize="16" fill="currentColor">Google</text></svg> },
  { name: "Microsoft", svg: <svg viewBox="0 0 90 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{height:18}}><text y="18" fontFamily="sans-serif" fontWeight="700" fontSize="16" fill="currentColor">Microsoft</text></svg> },
  { name: "Notion", svg: <svg viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{height:18}}><text y="18" fontFamily="sans-serif" fontWeight="700" fontSize="16" fill="currentColor">Notion</text></svg> },
  { name: "Airbnb", svg: <svg viewBox="0 0 58 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{height:18}}><text y="18" fontFamily="sans-serif" fontWeight="700" fontSize="16" fill="currentColor">Airbnb</text></svg> },
  { name: "Spotify", svg: <svg viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{height:18}}><text y="18" fontFamily="sans-serif" fontWeight="700" fontSize="16" fill="currentColor">Spotify</text></svg> },
];

const FEATURES = [
  { icon: <Zap size={20} />, title: "Real-time collaboration", desc: "Work together seamlessly with your entire team on an infinite canvas." },
  { icon: <Users size={20} />, title: "Team workspaces", desc: "Organize boards by projects and invite teammates with custom permissions." },
  { icon: <Shield size={20} />, title: "Enterprise-ready", desc: "SSO, audit logs, and advanced security controls for your organization." },
  { icon: <Star size={20} />, title: "500+ Templates", desc: "Jump-start any project with professionally designed templates." },
];

// Mini whiteboard preview stickies
const STICKIES = [
  { text: "User Research", color: "#fde68a", x: 30, y: 40, rotate: -2 },
  { text: "Competitive Analysis", color: "#bbf7d0", x: 200, y: 25, rotate: 1.5 },
  { text: "Wireframes", color: "#bfdbfe", x: 370, y: 45, rotate: -1 },
  { text: "User Flow", color: "#fde68a", x: 130, y: 140, rotate: 2 },
  { text: "Ideas", color: "#e9d5ff", x: 300, y: 130, rotate: -1.5 },
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
    if (!createName.trim()) { addToast("Please enter a board name", "error"); return; }
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
    if (!joinId.trim()) { addToast("Please enter a Session ID", "error"); return; }
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

      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          {/* Logo */}
          <div className="lp-logo" onClick={() => navigate("/")}>
            <div className="lp-logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/>
              </svg>
            </div>
            <span className="lp-logo-text">Boardly</span>
          </div>

          {/* Desktop nav links */}
          <div className="lp-nav-links">
            {["Product", "Solutions", "Resources", "Pricing"].map(link => (
              <button key={link} className="lp-nav-link"
                onClick={() => link === "Pricing" && navigate("/pricing")}>
                {link}
                {["Product", "Solutions", "Resources"].includes(link) && <ChevronDown size={12} />}
              </button>
            ))}
          </div>

          {/* Auth actions */}
          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={toggleTheme} title="Toggle theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            {currentUser ? (
              <>
                <span className="lp-nav-user">{currentUser.name}</span>
                <button className="lp-btn-ghost" onClick={() => navigate("/dashboard")}>Dashboard</button>
                <button className="lp-btn-ghost" onClick={onLogout}>Log out</button>
              </>
            ) : (
              <>
                <button className="lp-btn-ghost" onClick={() => navigate("/login")}>Log in</button>
                <button className="lp-btn-primary" onClick={() => navigate("/register")}>Sign up</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            New: AI-powered diagram generation →
          </div>

          <h1 className="lp-hero-title">
            Ideate. Collaborate.<br/>
            <span className="lp-hero-gradient">Create</span> without limits.
          </h1>

          <p className="lp-hero-sub">
            Boardly is the visual workspace for teams to brainstorm,<br/>
            plan, and turn ideas into action — together.
          </p>

          {currentUser ? (
            <div className="lp-hero-forms">
              <div className="lp-form-card">
                <div className="lp-form-label">Start a new session</div>
                <form onSubmit={handleCreate} className="lp-form-row">
                  <input className="lp-input" placeholder="Board name..." value={createName}
                    onChange={e => setCreateName(e.target.value)} />
                  <button type="submit" className="lp-btn-primary" disabled={loading === "create"}>
                    {loading === "create" ? "Creating…" : "Create"}
                  </button>
                </form>
              </div>
              <div className="lp-form-card">
                <div className="lp-form-label">Join existing session</div>
                <form onSubmit={handleJoin} className="lp-form-row">
                  <input className="lp-input" placeholder="Session ID..." value={joinId}
                    onChange={e => setJoinId(e.target.value)} />
                  <button type="submit" className="lp-btn-outline" disabled={loading === "join"}>
                    {loading === "join" ? "Joining…" : "Join"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="lp-hero-ctas">
              <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate("/register")}>
                Get started free
              </button>
              <button className="lp-btn-ghost lp-btn-lg" onClick={() => navigate("/register")}>
                See how it works <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* Trust strip */}
          <div className="lp-trust">
            <div className="lp-trust-label">Trusted by teams at</div>
            <div className="lp-trust-logos">
              {COMPANY_LOGOS.map(c => (
                <span key={c.name} className="lp-trust-logo">{c.name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Board preview */}
        <div className="lp-preview">
          <div className="lp-preview-chrome">
            <div className="lp-chrome-dots">
              <span /><span /><span />
            </div>
            <span className="lp-chrome-title">Q3 Product Planning</span>
            <div className="lp-chrome-avatars">
              {["#8b5cf6","#06b6d4","#f59e0b"].map((c,i) => (
                <div key={i} style={{width:22,height:22,borderRadius:"50%",background:c,border:"2px solid #fff",marginLeft:i?-6:0,display:"inline-block"}} />
              ))}
            </div>
          </div>
          <div className="lp-preview-canvas">
            {/* Grid dots */}
            <div className="lp-canvas-grid" />
            {/* Arrow/connectors */}
            <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
              <path d="M 115 65 Q 160 80 190 155" stroke="#d1d5db" strokeWidth="1.5" fill="none" strokeDasharray="4,3"/>
              <path d="M 285 55 Q 320 90 315 145" stroke="#d1d5db" strokeWidth="1.5" fill="none" strokeDasharray="4,3"/>
            </svg>
            {/* Stickies */}
            {STICKIES.map((s, i) => (
              <div key={i} className="lp-sticky" style={{
                background: s.color,
                left: s.x, top: s.y,
                transform: `rotate(${s.rotate}deg)`,
              }}>
                {s.text}
              </div>
            ))}
            {/* Cursor */}
            <div className="lp-cursor" style={{left:310,top:95}}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 3l14 9-7 2-2 7z" fill="#6366f1" stroke="white" strokeWidth="1.5"/></svg>
              <span className="lp-cursor-label" style={{background:"#6366f1"}}>Sarah</span>
            </div>
            <div className="lp-cursor" style={{left:180,top:50}}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 3l14 9-7 2-2 7z" fill="#06b6d4" stroke="white" strokeWidth="1.5"/></svg>
              <span className="lp-cursor-label" style={{background:"#06b6d4"}}>Alex</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-features">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">Everything your team needs</h2>
          <p className="lp-section-sub">A complete workspace for visual collaboration — from brainstorming to delivery.</p>
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

      {/* ── CTA Banner ── */}
      {!currentUser && (
        <section className="lp-cta-banner">
          <div className="lp-section-inner" style={{textAlign:"center"}}>
            <h2 className="lp-cta-title">Start collaborating for free</h2>
            <p className="lp-cta-sub">No credit card required. Up to 3 boards free forever.</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:24}}>
              <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate("/register")}>
                Get started free
              </button>
              <button className="lp-btn-outline lp-btn-lg" onClick={() => navigate("/pricing")}>
                View pricing
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo-icon" style={{width:24,height:24}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/>
              </svg>
            </div>
            <span style={{fontWeight:700,fontSize:"0.95rem"}}>Boardly</span>
          </div>
          <div className="lp-footer-links">
            {["Privacy","Terms","Security","Status","Blog"].map(l => (
              <span key={l} className="lp-footer-link">{l}</span>
            ))}
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} Boardly, Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}