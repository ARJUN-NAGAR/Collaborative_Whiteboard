import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../components/ToastSystem";
import { authAPI } from "../services/api";
import { auth } from "../services/authUtils";

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
    else if (isRegister && form.password.length < 6) e.password = "Password must be at least 6 characters";
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

      // Save token and user details
      auth.save(res.token, { userId: res.userId, name: res.name, email: res.email });
      addToast(isRegister ? "Account created successfully!" : "Welcome back!", "success");
      
      if (onAuthSuccess) {
        onAuthSuccess({ id: res.userId, name: res.name, email: res.email });
      } else {
        navigate("/");
      }
    } catch (err) {
      const msg = err.message?.includes("400") ? "Email already registered."
                : err.message?.includes("401") ? "Invalid email or password."
                : err.message || "Could not connect to server.";
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

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      {/* Left Form Side */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>Boardly</span>
          </div>

        <h1 className="auth-title">{isRegister ? "Create an account" : "Welcome back"}</h1>
        <p className="auth-subtitle">{isRegister ? "Sign up for your free workspace" : "Sign in to your workspace"}</p>

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

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Name Field (Register Only) */}
          {isRegister && (
            <div className={`auth-field${errors.name ? " auth-field--error" : ""}`}>
              <label className="auth-label" htmlFor="name">Full Name</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="name"
                  type="text"
                  className="auth-input"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={handleChange("name")}
                  autoComplete="name"
                  autoFocus
                />
              </div>
              {errors.name && <span className="auth-field-error">{errors.name}</span>}
            </div>
          )}

          {/* Email */}
          <div className={`auth-field${errors.email ? " auth-field--error" : ""}`}>
            <label className="auth-label" htmlFor="email">Email</label>
            <div className="auth-input-wrap">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                id="email"
                type="email"
                className="auth-input"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange("email")}
                autoComplete="email"
                autoFocus={!isRegister}
              />
            </div>
            {errors.email && <span className="auth-field-error">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className={`auth-field${errors.password ? " auth-field--error" : ""}`}>
            <label className="auth-label" htmlFor="password">
              Password
              {!isRegister && <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>}
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
                value={form.password}
                onChange={handleChange("password")}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="auth-pass-toggle"
                onClick={() => setShowPass((s) => !s)}
                title={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="auth-field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem', fontSize: '1rem' }} disabled={loading}>
            {loading ? (
              <><span className="spinner spinner--sm" /> {isRegister ? "Creating account…" : "Signing in…"}</>
            ) : isRegister ? "Create Account" : "Sign in"}
          </button>
        </form>

        <div className="auth-divider"><span>or continue with</span></div>

        <div className="auth-oauth">
          <button className="btn btn--ghost btn--sm auth-oauth-btn" disabled>
            Google
          </button>
          <button className="btn btn--ghost btn--sm auth-oauth-btn" disabled>
            GitHub
          </button>
        </div>

        <p className="auth-switch">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <a href="#" onClick={toggleMode} className="auth-switch__link" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            {isRegister ? "Sign in instead" : "Create one free"}
          </a>
        </p>
        </div>
      </div>

      {/* Right Graphic Side */}
      <div className="hidden-mobile" style={{ flex: 1, background: 'var(--accent-glow)', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(var(--accent-light) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.1 }} />
        
        <div style={{ position: 'relative', background: 'var(--bg-surface)', padding: '3rem', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)', maxWidth: '500px', width: '100%' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Collaboration,<br/>reimagined.</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Boardly brings your entire team together on an infinite canvas. Brainstorm, design, and plan without boundaries.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${i*40}, 70%, 60%)`, border: '2px solid var(--bg-surface)', marginLeft: '-12px', zIndex: 5-i }} />
              ))}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Join 10,000+ teams</span>
          </div>
        </div>
      </div>
    </div>
  );
}
