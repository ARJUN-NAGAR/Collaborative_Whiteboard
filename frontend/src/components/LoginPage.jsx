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
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg__blob auth-bg__blob--1" />
        <div className="auth-bg__blob auth-bg__blob--2" />
      </div>

      <button className="auth-theme-btn" onClick={toggleTheme} title="Toggle theme">
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="auth-card">
        <div className="auth-logo">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--accent)" />
            <rect x="7" y="7" width="8" height="8" rx="2" fill="white" opacity=".9" />
            <rect x="17" y="7" width="8" height="8" rx="2" fill="white" opacity=".6" />
            <rect x="7" y="17" width="8" height="8" rx="2" fill="white" opacity=".6" />
            <rect x="17" y="17" width="8" height="8" rx="2" fill="white" opacity=".3" />
          </svg>
          <span className="auth-logo__name">CollabBoard</span>
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

          <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading}>
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
          <a href="#" onClick={toggleMode} className="auth-switch__link">
            {isRegister ? "Sign in instead" : "Create one free"}
          </a>
        </p>
      </div>
    </div>
  );
}