import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

/**
 * LandingPage.jsx
 * Updated: all var(--purple) → var(--accent), var(--purple-*) → var(--accent-*)
 * Uses the full design-system token set.
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const heroRef = useRef(null);

  /* Subtle parallax on hero canvas dots */
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

  return (
    <div className="landing">
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <div className="landing-nav__logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--accent)" />
            <rect x="7" y="7" width="8" height="8" rx="2" fill="white" opacity=".9" />
            <rect x="17" y="7" width="8" height="8" rx="2" fill="white" opacity=".6" />
            <rect x="7" y="17" width="8" height="8" rx="2" fill="white" opacity=".6" />
            <rect x="17" y="17" width="8" height="8" rx="2" fill="white" opacity=".3" />
          </svg>
          <span>CollabBoard</span>
        </div>
        <div className="landing-nav__links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <button className="landing-nav__theme" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button className="btn btn--ghost" onClick={() => navigate("/login")}>
            Sign in
          </button>
          <button className="btn btn--primary" onClick={() => navigate("/register")}>
            Get started free
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero" ref={heroRef}>
        <div className="landing-hero__bg" aria-hidden="true" />
        <div className="landing-hero__content">
          <div className="landing-hero__badge">
            <span className="badge badge--accent">✦ Now in open beta</span>
          </div>
          <h1 className="landing-hero__headline">
            Your team's<br />
            <span className="text-accent">creative canvas</span>,<br />
            multiplied.
          </h1>
          <p className="landing-hero__sub">
            Real-time whiteboard collaboration with drawing tools, sticky notes,
            live cursors, and video — all in the browser.
          </p>
          <div className="landing-hero__cta">
            <button
              className="btn btn--primary btn--lg"
              onClick={() => navigate("/register")}
            >
              Start for free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              className="btn btn--ghost btn--lg"
              onClick={() => navigate("/demo")}
            >
              Watch demo
            </button>
          </div>
          <p className="landing-hero__footnote">
            No credit card required · Free for up to 3 collaborators
          </p>
        </div>

        {/* Floating mini-preview */}
        <div className="landing-hero__preview" aria-hidden="true">
          <div className="preview-frame">
            <div className="preview-toolbar">
              <span className="preview-dot" style={{ background: "var(--error)" }} />
              <span className="preview-dot" style={{ background: "var(--warning)" }} />
              <span className="preview-dot" style={{ background: "var(--success)" }} />
            </div>
            <div className="preview-canvas">
              <div className="preview-sticky" style={{ top: "18%", left: "12%", background: "var(--accent)", opacity: 0.85 }}>
                Sprint goals 🎯
              </div>
              <div className="preview-sticky" style={{ top: "44%", left: "48%", background: "var(--success)", opacity: 0.8 }}>
                Ship it! 🚀
              </div>
              <div className="preview-sticky" style={{ top: "62%", left: "16%", background: "var(--warning)", opacity: 0.8 }}>
                Review UX ✏️
              </div>
              {/* Fake cursors */}
              <div className="preview-cursor" style={{ top: "28%", left: "60%" }}>
                <svg width="16" height="20" viewBox="0 0 16 20" fill="var(--accent)">
                  <path d="M0 0 L0 20 L5 15 L9 20 L11 19 L7 14 L13 14 Z" />
                </svg>
                <span>Alex</span>
              </div>
              <div className="preview-cursor" style={{ top: "56%", left: "70%" }}>
                <svg width="16" height="20" viewBox="0 0 16 20" fill="var(--success)">
                  <path d="M0 0 L0 20 L5 15 L9 20 L11 19 L7 14 L13 14 Z" />
                </svg>
                <span>Sam</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="landing-features" id="features">
        <div className="section-label">Features</div>
        <h2 className="section-heading">Everything your team needs to think together</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="landing-social">
        <p className="social-label">Trusted by teams at</p>
        <div className="social-logos">
          {["Notion", "Linear", "Vercel", "Figma", "Loom"].map((name) => (
            <span key={name} className="social-logo-pill">{name}</span>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="landing-pricing" id="pricing">
        <div className="section-label">Pricing</div>
        <h2 className="section-heading">Simple, honest pricing</h2>
        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <div
              className={`pricing-card${plan.featured ? " pricing-card--featured" : ""}`}
              key={plan.name}
            >
              {plan.featured && <div className="pricing-badge">Most popular</div>}
              <div className="pricing-name">{plan.name}</div>
              <div className="pricing-price">
                <span className="pricing-amount">{plan.price}</span>
                {plan.period && <span className="pricing-period">{plan.period}</span>}
              </div>
              <p className="pricing-desc">{plan.desc}</p>
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`btn btn--lg ${plan.featured ? "btn--primary" : "btn--ghost"}`}
                onClick={() => navigate("/register")}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer__brand">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--accent)" />
            <rect x="7" y="7" width="8" height="8" rx="2" fill="white" opacity=".9" />
            <rect x="17" y="7" width="8" height="8" rx="2" fill="white" opacity=".6" />
            <rect x="7" y="17" width="8" height="8" rx="2" fill="white" opacity=".6" />
            <rect x="17" y="17" width="8" height="8" rx="2" fill="white" opacity=".3" />
          </svg>
          <span>CollabBoard</span>
        </div>
        <p className="landing-footer__copy">
          © {new Date().getFullYear()} CollabBoard. Built with ♥ for distributed teams.
        </p>
      </footer>
    </div>
  );
}

/* ── Data ── */
const FEATURES = [
  {
    icon: "✏️",
    title: "Infinite canvas",
    desc: "Pan and zoom across an infinite workspace. Draw, type, and organize without limits.",
  },
  {
    icon: "👥",
    title: "Live cursors",
    desc: "See every teammate's cursor in real time. Know exactly who's working on what.",
  },
  {
    icon: "💬",
    title: "Built-in chat",
    desc: "Threaded, grouped chat right inside the board. No context switching required.",
  },
  {
    icon: "🎥",
    title: "Video overlay",
    desc: "Bring your face to the canvas. Floating video tiles that don't block your work.",
  },
  {
    icon: "🔒",
    title: "Role-based access",
    desc: "Owner, Admin, Editor, Presenter, Viewer — full RBAC so the right people have the right permissions.",
  },
  {
    icon: "📤",
    title: "Export anywhere",
    desc: "Export boards as PNG or PDF, preserving all elements at full resolution.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    desc: "Great for side projects and small teams getting started.",
    features: ["3 collaborators", "5 boards", "30-day history", "PNG export"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/ seat / mo",
    desc: "For growing teams that need unlimited everything.",
    features: [
      "Unlimited collaborators",
      "Unlimited boards",
      "Infinite history",
      "PDF + PNG export",
      "Video overlay",
      "Priority support",
    ],
    cta: "Get Pro",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "SSO, SLAs, dedicated support, and on-prem options.",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Custom retention",
      "Dedicated CSM",
      "On-prem deployment",
    ],
    cta: "Contact sales",
    featured: false,
  },
];