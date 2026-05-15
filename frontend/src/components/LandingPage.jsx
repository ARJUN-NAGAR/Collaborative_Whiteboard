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
          <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em' }}>Boardly</span>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-secondary)' }} className="hidden-mobile">
          <span style={{ cursor: 'pointer' }}>Product</span>
          <span style={{ cursor: 'pointer' }}>Solutions</span>
          <span style={{ cursor: 'pointer' }}>Resources</span>
          <span style={{ cursor: 'pointer' }}>Pricing</span>
        </div>
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={toggleTheme} title="Toggle theme" style={{ padding: '0.4rem 0.6rem' }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-hover)", padding: "4px 12px", borderRadius: "100px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{currentUser.name}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("/dashboard")}>Dashboard</button>
              <button className="btn btn-secondary btn-sm" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => navigate("/login")}>Sign in</button>
              <button className="btn btn-primary" onClick={() => navigate("/register")}>Get started free</button>
            </>
          )}
        </div>
      </nav>

      <section className="landing-hero" ref={heroRef}>
        <div className="landing-hero__bg" aria-hidden="true" />
        <div className="landing-hero__content">
          <div className="hero-badge"><span className="hero-badge">✦ Live Collaboration</span></div>
          <h1 className="hero-title">Ideate. Collaborate.<br /><span className="text-accent">Create without limits.</span></h1>
          <p className="hero-subtitle">Boardly is the visual workspace for teams to brainstorm, plan, and turn ideas into action — together.</p>
          
          <div className="hero-actions" style={{ flexDirection: currentUser ? "column" : "row", gap: currentUser ? "1rem" : "1.5rem", alignItems: "stretch", width: "100%", maxWidth: "420px" }}>
            {currentUser ? (
              <>
                <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "12px", gap: "8px", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textAlign: "left" }}>Start a new session</span>
                  <form onSubmit={handleCreate} style={{ display: "flex", gap: "8px" }}>
                    <input className="form-input" style={{ flex: 1 }} placeholder="Board name..." value={createName} onChange={e => setCreateName(e.target.value)} />
                    <button type="submit" className="btn btn-primary" disabled={loading === "create"}>{loading === "create" ? "..." : "Create"}</button>
                  </form>
                </div>
                <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "12px", gap: "8px", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textAlign: "left" }}>Join existing session</span>
                  <form onSubmit={handleJoin} style={{ display: "flex", gap: "8px" }}>
                    <input className="form-input" style={{ flex: 1 }} placeholder="Session ID..." value={joinId} onChange={e => setJoinId(e.target.value)} />
                    <button type="submit" className="btn btn-secondary" disabled={loading === "join"}>{loading === "join" ? "..." : "Join"}</button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <button className="btn btn-primary btn-lg" onClick={() => navigate("/register")}>Get started free</button>
                <button className="btn btn-ghost btn-lg" onClick={() => navigate("/demo")}>See how it works</button>
              </>
            )}
          </div>
        </div>

        {/* Floating preview */}
        <div className="hero-preview" aria-hidden="true" style={{ marginTop: '4rem', width: '100%', maxWidth: '1000px', padding: '0 2rem' }}>
           <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)', height: '400px', position: 'relative', overflow: 'hidden' }}>
             <div style={{ height: 46, borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
               <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
               <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
               <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
               <div style={{ marginLeft: 16, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Q3 Product Roadmap</div>
             </div>
             <div style={{ position: 'absolute', top: 100, left: 100, width: 180, height: 120, background: '#fef08a', borderRadius: 8, padding: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', color: '#1a1a1a', fontSize: '0.9rem', fontFamily: 'var(--font)' }}>Define target personas</div>
             <div style={{ position: 'absolute', top: 140, left: 320, width: 180, height: 120, background: '#bbf7d0', borderRadius: 8, padding: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', color: '#1a1a1a', fontSize: '0.9rem', fontFamily: 'var(--font)' }}>Map user journey</div>
             <div style={{ position: 'absolute', top: 220, left: 180, width: 180, height: 120, background: '#bfdbfe', borderRadius: 8, padding: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', color: '#1a1a1a', fontSize: '0.9rem', fontFamily: 'var(--font)' }}>Wireframe dashboard</div>
             
             <div style={{ position: 'absolute', top: 180, left: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--accent)"><path d="M5 3l14 9-7 2-2 7z" stroke="white" strokeWidth="1.5"/></svg>
                <span style={{ background: 'var(--accent)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, marginTop: 2, fontWeight: 600 }}>Sarah</span>
             </div>
           </div>
        </div>

        {/* Social Proof */}
        <div style={{ marginTop: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.7 }}>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Trusted by innovative teams worldwide</p>
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center', filter: 'grayscale(100%)', opacity: 0.6 }}>
            {['Acme Corp', 'Globex', 'Soylent', 'Initech', 'Umbrella'].map(company => (
              <span key={company} style={{ fontSize: '1.25rem', fontWeight: 800 }}>{company}</span>
            ))}
          </div>
        </div>
      </section>
      
      <footer className="landing-footer">
        <div className="landing-footer__brand">
          <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Boardly</span>
        </div>
        <p className="landing-footer__copy">© {new Date().getFullYear()} Boardly. Built for distributed teams.</p>
      </footer>
    </div>
  );
}