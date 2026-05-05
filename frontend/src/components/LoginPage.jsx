import { useState } from 'react';
import { authAPI } from '../services/api';
import { auth } from '../services/authUtils';
import { LogIn, UserPlus, Eye, EyeOff, Pencil } from 'lucide-react';

export default function LoginPage({ onAuthSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!form.email.trim() || !form.password.trim()) return setError('Email and password are required.');
    if (tab === 'register' && !form.name.trim())       return setError('Name is required.');
    if (form.password.length < 6)                       return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      const payload = tab === 'register'
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = tab === 'register'
        ? await authAPI.register(payload)
        : await authAPI.login(payload);

      // Backend returns { token, userId, name, email }
      auth.save(res.token, { userId: res.userId, name: res.name, email: res.email });
      onAuthSuccess({ id: res.userId, name: res.name, email: res.email });

    } catch (err) {
      // Try to parse JSON error body
      const msg = err.message?.includes('400') ? 'Email already registered.'
                : err.message?.includes('401') ? 'Invalid email or password.'
                : 'Could not connect to server. Is the backend running?';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing" style={{ alignItems: 'center', justifyContent: 'center' }}>

      {/* background glow — inherited from .landing::before */}

      <div style={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: 420, padding: '2rem' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <div className="nav-logo-icon">
            <Pencil size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            CollabBoard
          </span>
        </div>

        {/* Card */}
        <div className="hero-card" style={{ width: '100%', padding: '2rem' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: '1.75rem', gap: 4 }}>
            {[['login', LogIn, 'Sign In'], ['register', UserPlus, 'Register']].map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => { setTab(id); setError(''); }}
                style={{
                  flex: 1, padding: '0.55rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font)', fontSize: '0.85rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  transition: 'all 0.2s',
                  background: tab === id ? 'rgba(139,92,246,0.25)' : 'transparent',
                  color: tab === id ? 'var(--purple-light)' : 'var(--text-muted)',
                  boxShadow: tab === id ? 'inset 0 0 0 1px rgba(139,92,246,0.4)' : 'none',
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <form className="form-group" onSubmit={handleSubmit} autoComplete="off">

            {/* Name — register only */}
            {tab === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 500 }}>
                  Full Name
                </label>
                <input
                  className="form-input"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={set('name')}
                  autoFocus={tab === 'register'}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 500 }}>
                Email Address
              </label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoFocus={tab === 'login'}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 500 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder={tab === 'register' ? 'Min. 6 characters' : '••••••••'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.65rem 0.9rem', color: '#f87171', fontSize: '0.82rem' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className={`btn ${tab === 'register' ? 'btn-cyan' : 'btn-primary'} btn-full`}
              disabled={loading}
              style={{ marginTop: '0.25rem' }}
            >
              {loading ? (
                <><svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> {tab === 'register' ? 'Creating account…' : 'Signing in…'}</>
              ) : tab === 'register' ? (
                <><UserPlus size={15} /> Create Account</>
              ) : (
                <><LogIn size={15} /> Sign In</>
              )}
            </button>
          </form>

          {/* Switch tab hint */}
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--purple-light)', fontWeight: 500, fontSize: '0.8rem', padding: 0 }}
            >
              {tab === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}