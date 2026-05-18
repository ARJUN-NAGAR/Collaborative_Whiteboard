import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../components/ToastSystem";
import { authAPI } from "../services/api";
import { auth } from "../services/authUtils";

const TESTIMONIALS = [
  { text: "Finally a whiteboard that feels as fast as thinking.", author: "Priya S., Product Lead" },
  { text: "We replaced Miro with this in one sprint. Zero regrets.", author: "Tomás R., CTO" },
  { text: "Our remote design reviews are 10× more productive.", author: "Mei L., UX Director" },
];

export default function LoginPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const [isRegister, setIsRegister] = useState(location.pathname === "/register");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [quoteIdx] = useState(() => Math.floor(Math.random() * TESTIMONIALS.length));

  useEffect(() => {
    setIsRegister(location.pathname === "/register");
    setErrors({});
  }, [location.pathname]);

  const validate = () => {
    const e = {};
    if (isRegister && !form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (isRegister && form.password.length < 6) e.password = "Minimum 6 characters";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      const payload = isRegister
        ? { name: form.name.trim(), email: form.email.trim(), password: form.password }
        : { email: form.email.trim(), password: form.password };
      const res = isRegister
        ? await authAPI.register(payload)
        : await authAPI.login(payload);
      auth.save(res.token, { userId: res.userId, name: res.name, email: res.email });
      addToast(isRegister ? "Welcome to CollabBoard!" : "Welcome back!", "success");
      if (onAuthSuccess) {
        onAuthSuccess({ id: res.userId, name: res.name, email: res.email });
      } else {
        navigate("/");
      }
    } catch (err) {
      const msg = err.message?.includes("400")
        ? "That email is already registered."
        : err.message?.includes("401")
          ? "Invalid email or password."
          : "Server error — please try again.";
      addToast(msg, "error");
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined, general: undefined }));
  };

  const toggleMode = (e) => {
    e.preventDefault();
    setForm({ name: "", email: "", password: "" });
    setErrors({});
    navigate(isRegister ? "/login" : "/register");
  };

  const quote = TESTIMONIALS[quoteIdx];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>

      {/* ── Left: Form ──────────────────────────────── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "2rem", minWidth: 0,
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Logo */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2.5rem", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            <div style={{
              width: 34, height: 34, background: "var(--lime)", borderRadius: "var(--r-md)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--shadow-lime)",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A0A14">
                <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)" }}>
              CollabBoard
            </span>
          </div>

          {/* Heading */}
          <h1 className="auth-title">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="auth-subtitle">
            {isRegister
              ? "Start collaborating with your team in seconds."
              : "Sign in to pick up where you left off."}
          </p>

          {/* Error banner */}
          {errors.general && (
            <div className="auth-error-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errors.general}
            </div>
          )}

          {/* OAuth (disabled for now) */}
          <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
            {["Google", "GitHub"].map((provider) => (
              <button
                key={provider}
                className="auth-oauth-btn"
                disabled
                style={{ flex: 1, opacity: 0.5, cursor: "not-allowed" }}
                title="Coming soon"
              >
                {provider}
              </button>
            ))}
          </div>

          <div className="auth-divider"><span>or continue with email</span></div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* Name */}
            {isRegister && (
              <div className={`auth-field${errors.name ? " auth-field--error" : ""}`}>
                <label className="auth-label" htmlFor="name">Full name</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="name" type="text" className="auth-input"
                    placeholder="Jane Smith"
                    value={form.name} onChange={handleChange("name")}
                    autoComplete="name" autoFocus
                  />
                </div>
                {errors.name && <span className="auth-field-error">{errors.name}</span>}
              </div>
            )}

            {/* Email */}
            <div className={`auth-field${errors.email ? " auth-field--error" : ""}`}>
              <label className="auth-label" htmlFor="email">Email address</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="email" type="email" className="auth-input"
                  placeholder="you@company.com"
                  value={form.email} onChange={handleChange("email")}
                  autoComplete="email" autoFocus={!isRegister}
                />
              </div>
              {errors.email && <span className="auth-field-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className={`auth-field${errors.password ? " auth-field--error" : ""}`}>
              <label className="auth-label" htmlFor="password">
                Password
                {!isRegister && (
                  <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>
                )}
              </label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className="auth-input auth-input--with-toggle"
                  placeholder={isRegister ? "Min. 6 characters" : "••••••••"}
                  value={form.password} onChange={handleChange("password")}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
                <button
                  type="button" className="auth-pass-toggle"
                  onClick={() => setShowPass((s) => !s)}
                >
                  {showPass ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              style={{
                width: "100%", padding: "11px", marginTop: "1rem",
                fontSize: "0.95rem", border: "none", borderRadius: "var(--r-md)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font)", fontWeight: 700,
              }}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner spinner--sm" /> {isRegister ? "Creating account…" : "Signing in…"}</>
              ) : (
                isRegister ? "Create account" : "Sign in"
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="auth-switch" style={{ marginTop: "1.5rem" }}>
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <a href="#" onClick={toggleMode} className="auth-switch__link">
              {isRegister ? "Sign in" : "Create one free"}
            </a>
          </p>

          {/* Terms note */}
          {isRegister && (
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center", marginTop: "1rem", lineHeight: 1.5 }}>
              By creating an account you agree to our{" "}
              <span style={{ color: "var(--lime)", cursor: "pointer" }}>Terms of Service</span>{" "}
              and{" "}
              <span style={{ color: "var(--lime)", cursor: "pointer" }}>Privacy Policy</span>.
            </p>
          )}
        </div>
      </div>

      {/* ── Right: Visual panel ──────────────────────── */}
      <div
        className="hidden-mobile"
        style={{
          flex: 1,
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-subtle)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "3rem", position: "relative", overflow: "hidden",
        }}
      >
        {/* Grid dot bg */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(var(--canvas-dot) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        {/* Lime glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,255,51,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 380, width: "100%", textAlign: "left" }}>
          {/* Logo mark */}
          <div style={{
            width: 52, height: 52, background: "var(--lime)", borderRadius: "var(--r-lg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1.5rem", boxShadow: "var(--shadow-lime)",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#0A0A14">
              <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
            </svg>
          </div>

          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)",
            marginBottom: "1rem", lineHeight: 1.1,
          }}>
            Visual collaboration,<br />
            <span style={{ color: "var(--lime)" }}>without limits</span>
          </h2>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            Bring your entire team onto one infinite canvas.
            Sketch ideas, run standups, ship designs — all in real time.
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: "2.5rem" }}>
            {[
              "Real-time cursors and presence",
              "50+ shape tools and templates",
              "Chat, reactions and video calls",
              "End-to-end encrypted sessions",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "var(--lime-muted)", border: "1px solid var(--lime-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="var(--lime)" strokeWidth="2.5">
                    <polyline points="3 8 6 12 13 4" />
                  </svg>
                </div>
                {item}
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{
            background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
            borderRadius: "var(--r-xl)", padding: "16px 18px",
          }}>
            <div style={{
              fontSize: "0.85rem", color: "var(--text-primary)",
              fontStyle: "italic", lineHeight: 1.6, marginBottom: 10,
            }}>
              "{quote.text}"
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
              — {quote.author}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}