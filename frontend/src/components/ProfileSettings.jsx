import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Settings, Bell, CreditCard, Shield, Code2,
  ChevronRight, Camera, LogOut, Trash2
} from 'lucide-react';
import { auth } from '../services/authUtils';

const NAV_ITEMS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'preferences',   label: 'Preferences',   icon: Settings },
  { id: 'security',      label: 'Security',       icon: Shield },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'billing',       label: 'Billing',        icon: CreditCard },
  { id: 'api',           label: 'API',            icon: Code2 },
];

export default function ProfileSettings({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [form, setForm] = useState({
    name:     currentUser?.name  || '',
    email:    currentUser?.email || '',
    bio:      'Product designer & team collaborator',
    role:     'Designer',
    company:  'Boardly Inc.',
    website:  '',
    avatar:   null,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = (form.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="settings-shell">
      {/* Sidebar */}
      <aside className="settings-sidebar">
        <div className="settings-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="lp-logo-icon" style={{ width: 28, height: 28 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '.95rem' }}>Boardly</span>
        </div>

        <div className="settings-user-chip">
          <div className="settings-avatar-sm" style={{ background: currentUser?.color || 'var(--accent)' }}>
            {initials}
          </div>
          <div>
            <div className="settings-user-name">{form.name || 'User'}</div>
            <div className="settings-user-email">{form.email}</div>
          </div>
        </div>

        <nav className="settings-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`settings-nav-item${activeSection === item.id ? ' active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="settings-nav-footer">
          <button className="settings-nav-item" onClick={() => navigate('/dashboard')}>
            <ChevronRight size={15} style={{ transform: 'rotate(180deg)' }} />
            Back to dashboard
          </button>
          <button className="settings-nav-item settings-nav-item--danger" onClick={onLogout}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="settings-main">
        {activeSection === 'profile' && (
          <form onSubmit={handleSave} className="settings-form">
            <div className="settings-section-header">
              <h1 className="settings-section-title">Profile</h1>
              <p className="settings-section-sub">Manage your personal information and how others see you.</p>
            </div>

            {/* Avatar */}
            <div className="settings-block">
              <label className="settings-label">Profile photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="settings-avatar-lg" style={{ background: currentUser?.color || 'var(--accent)' }}>
                  {initials}
                  <button type="button" className="settings-avatar-overlay">
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <button type="button" className="btn-settings-secondary">Change photo</button>
                  <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="settings-block">
              <div className="settings-field-row">
                <div className="settings-field">
                  <label className="settings-label" htmlFor="s-name">Full name</label>
                  <input id="s-name" className="settings-input" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                </div>
                <div className="settings-field">
                  <label className="settings-label" htmlFor="s-role">Role</label>
                  <input id="s-role" className="settings-input" value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Designer" />
                </div>
              </div>

              <div className="settings-field" style={{ marginTop: 16 }}>
                <label className="settings-label" htmlFor="s-email">Email address</label>
                <input id="s-email" type="email" className="settings-input" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              <div className="settings-field-row" style={{ marginTop: 16 }}>
                <div className="settings-field">
                  <label className="settings-label" htmlFor="s-company">Company</label>
                  <input id="s-company" className="settings-input" value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Your company" />
                </div>
                <div className="settings-field">
                  <label className="settings-label" htmlFor="s-website">Website</label>
                  <input id="s-website" className="settings-input" value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://" />
                </div>
              </div>

              <div className="settings-field" style={{ marginTop: 16 }}>
                <label className="settings-label" htmlFor="s-bio">Bio</label>
                <textarea id="s-bio" className="settings-input settings-textarea" value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                  placeholder="Tell your team a bit about yourself" />
              </div>
            </div>

            <div className="settings-actions">
              <button type="submit" className="btn-settings-primary">
                {saved ? '✓ Saved!' : 'Save changes'}
              </button>
            </div>

            {/* Danger zone */}
            <div className="settings-danger-zone">
              <div className="settings-danger-header">
                <Trash2 size={15} />
                Danger zone
              </div>
              <div className="settings-danger-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.875rem' }}>Delete account</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                    Permanently delete your account and all boards.
                  </div>
                </div>
                <button type="button" className="btn-settings-danger">Delete account</button>
              </div>
            </div>
          </form>
        )}

        {activeSection === 'preferences' && (
          <div className="settings-form">
            <div className="settings-section-header">
              <h1 className="settings-section-title">Preferences</h1>
              <p className="settings-section-sub">Customize your Boardly experience.</p>
            </div>
            <div className="settings-block">
              <ToggleRow label="Dark mode" desc="Use dark theme across the app" defaultOn />
              <ToggleRow label="Compact sidebar" desc="Reduce sidebar padding for more space" />
              <ToggleRow label="Show grid by default" desc="Display dot grid when opening a board" defaultOn />
              <ToggleRow label="Show mini map" desc="Show minimap navigator on boards" defaultOn />
              <ToggleRow label="Snap to grid" desc="Automatically snap shapes to grid lines" />
            </div>
            <div className="settings-actions">
              <button className="btn-settings-primary">Save preferences</button>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="settings-form">
            <div className="settings-section-header">
              <h1 className="settings-section-title">Security</h1>
              <p className="settings-section-sub">Manage your password and account security settings.</p>
            </div>
            <div className="settings-block">
              <label className="settings-label">Change password</label>
              <div className="settings-field">
                <input className="settings-input" type="password" placeholder="Current password" style={{ marginBottom: 10 }} />
                <input className="settings-input" type="password" placeholder="New password" style={{ marginBottom: 10 }} />
                <input className="settings-input" type="password" placeholder="Confirm new password" />
              </div>
            </div>
            <div className="settings-actions">
              <button className="btn-settings-primary">Update password</button>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="settings-form">
            <div className="settings-section-header">
              <h1 className="settings-section-title">Notifications</h1>
              <p className="settings-section-sub">Choose what you want to be notified about.</p>
            </div>
            <div className="settings-block">
              <ToggleRow label="Board invites" desc="When someone invites you to a board" defaultOn />
              <ToggleRow label="Comments & mentions" desc="When someone @mentions you or comments" defaultOn />
              <ToggleRow label="Board updates" desc="When a shared board is modified" />
              <ToggleRow label="Weekly digest" desc="A weekly summary of your boards' activity" defaultOn />
              <ToggleRow label="Product updates" desc="New features and announcements from Boardly" />
            </div>
            <div className="settings-actions">
              <button className="btn-settings-primary">Save preferences</button>
            </div>
          </div>
        )}

        {activeSection === 'billing' && (
          <div className="settings-form">
            <div className="settings-section-header">
              <h1 className="settings-section-title">Billing</h1>
              <p className="settings-section-sub">Manage your subscription and payment methods.</p>
            </div>
            <div className="settings-block">
              <div className="settings-plan-card">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Free plan</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: 3 }}>3 boards · Basic shapes · PNG export</div>
                </div>
                <button className="btn-settings-primary" onClick={() => navigate('/pricing')}>Upgrade</button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'api' && (
          <div className="settings-form">
            <div className="settings-section-header">
              <h1 className="settings-section-title">API</h1>
              <p className="settings-section-sub">Manage API keys to integrate Boardly with your tools.</p>
            </div>
            <div className="settings-block">
              <label className="settings-label">API Key</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="settings-input" value="sk-••••••••••••••••••••••••" readOnly style={{ flex: 1, fontFamily: 'monospace' }} />
                <button className="btn-settings-secondary">Copy</button>
                <button className="btn-settings-secondary">Regenerate</button>
              </div>
              <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Keep your API key secret. It provides full access to your account.
              </p>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .settings-shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg-base);
        }
        .settings-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: var(--bg-surface);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          padding: 1.25rem 1rem;
          gap: 0;
        }
        .settings-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.5rem;
          padding: 0 4px;
        }
        .settings-user-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 8px;
          background: var(--bg-hover);
          border-radius: var(--r-md);
          margin-bottom: 1.25rem;
        }
        .settings-avatar-sm {
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          font-size: .75rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .settings-user-name { font-size: .8rem; font-weight: 600; color: var(--text-primary); }
        .settings-user-email { font-size: .7rem; color: var(--text-muted); }
        .settings-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 10px;
          border-radius: var(--r-md);
          border: none;
          background: none;
          color: var(--text-secondary);
          font-size: .85rem;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all .12s;
        }
        .settings-nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
        .settings-nav-item.active { background: var(--accent-glow); color: var(--accent); font-weight: 600; }
        .settings-nav-item--danger { color: var(--red, #ef4444) !important; margin-top: 4px; }
        .settings-nav-item--danger:hover { background: rgba(239,68,68,.1) !important; }
        .settings-nav-footer { margin-top: auto; border-top: 1px solid var(--border-subtle); padding-top: 10px; display: flex; flex-direction: column; gap: 2px; }

        .settings-main {
          flex: 1;
          overflow-y: auto;
          padding: 2.5rem 3rem;
          max-width: 720px;
        }
        .settings-form { display: flex; flex-direction: column; gap: 0; }
        .settings-section-header { margin-bottom: 2rem; }
        .settings-section-title { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: .35rem; }
        .settings-section-sub { font-size: .9rem; color: var(--text-secondary); }

        .settings-block {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--r-xl);
          padding: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .settings-label {
          display: block;
          font-size: .8rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: .05em;
          margin-bottom: 10px;
        }
        .settings-input {
          width: 100%;
          background: var(--bg-base);
          border: 1px solid var(--border-default);
          border-radius: var(--r-md);
          padding: .55rem .85rem;
          color: var(--text-primary);
          font-size: .9rem;
          font-family: var(--font);
          outline: none;
          box-sizing: border-box;
          transition: border-color .15s;
        }
        .settings-input:focus { border-color: var(--accent); }
        .settings-textarea { resize: vertical; line-height: 1.5; }
        .settings-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .settings-field { display: flex; flex-direction: column; }

        .settings-avatar-lg {
          width: 68px; height: 68px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          font-size: 1.4rem;
          font-weight: 800;
          position: relative;
          cursor: pointer;
          flex-shrink: 0;
        }
        .settings-avatar-overlay {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(0,0,0,.45);
          display: flex; align-items: center; justify-content: center;
          border: none; cursor: pointer; color: #fff;
          opacity: 0;
          transition: opacity .15s;
        }
        .settings-avatar-lg:hover .settings-avatar-overlay { opacity: 1; }

        .settings-actions { display: flex; justify-content: flex-end; margin-bottom: 1.5rem; }
        .btn-settings-primary {
          padding: .55rem 1.25rem;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: var(--r-md);
          font-size: .875rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity .15s;
        }
        .btn-settings-primary:hover { opacity: .88; }
        .btn-settings-secondary {
          padding: .5rem 1rem;
          background: var(--bg-hover);
          color: var(--text-primary);
          border: 1px solid var(--border-default);
          border-radius: var(--r-md);
          font-size: .875rem;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-settings-secondary:hover { background: var(--bg-elevated); }
        .btn-settings-danger {
          padding: .5rem 1rem;
          background: transparent;
          color: #ef4444;
          border: 1px solid rgba(239,68,68,.35);
          border-radius: var(--r-md);
          font-size: .875rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .btn-settings-danger:hover { background: rgba(239,68,68,.1); }

        .settings-danger-zone {
          border: 1px solid rgba(239,68,68,.3);
          border-radius: var(--r-xl);
          padding: 1.25rem 1.5rem;
          margin-bottom: 2rem;
        }
        .settings-danger-header {
          display: flex; align-items: center; gap: 7px;
          font-size: .8rem; font-weight: 700;
          color: #ef4444;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 1rem;
        }
        .settings-danger-row {
          display: flex; align-items: center;
          justify-content: space-between; gap: 1rem;
          flex-wrap: wrap;
        }

        .settings-plan-card {
          display: flex; align-items: center;
          justify-content: space-between;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--r-md);
          padding: 1rem 1.25rem;
          gap: 1rem;
        }

        /* Toggle row */
        .toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .toggle-row:last-child { border-bottom: none; }
        .toggle-row-text > div:first-child { font-size: .875rem; font-weight: 600; color: var(--text-primary); }
        .toggle-row-text > div:last-child { font-size: .78rem; color: var(--text-muted); margin-top: 2px; }
        .toggle-switch {
          position: relative;
          width: 38px; height: 22px;
          cursor: pointer;
        }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-track {
          position: absolute; inset: 0;
          background: var(--bg-hover);
          border-radius: 999px;
          border: 1px solid var(--border-default);
          transition: all .2s;
        }
        .toggle-switch input:checked + .toggle-track { background: var(--accent); border-color: var(--accent); }
        .toggle-thumb {
          position: absolute;
          top: 3px; left: 3px;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #fff;
          transition: transform .2s;
          box-shadow: 0 1px 3px rgba(0,0,0,.2);
        }
        .toggle-switch input:checked ~ .toggle-thumb { transform: translateX(16px); }
      `}</style>
    </div>
  );
}

function ToggleRow({ label, desc, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="toggle-row">
      <div className="toggle-row-text">
        <div>{label}</div>
        <div>{desc}</div>
      </div>
      <label className="toggle-switch">
        <input type="checkbox" checked={on} onChange={() => setOn(v => !v)} />
        <div className="toggle-track" />
        <div className="toggle-thumb" />
      </label>
    </div>
  );
}