import React, { useState } from 'react';
import {
  Settings, Users, Shield, History, LayoutTemplate,
  Puzzle, Trash2, X, ChevronRight, Check
} from 'lucide-react';

const SETTINGS_NAV = [
  { id: 'general',    label: 'General',           icon: Settings },
  { id: 'collab',     label: 'Collaborators',      icon: Users },
  { id: 'perms',      label: 'Permissions',        icon: Shield },
  { id: 'history',    label: 'Version history',    icon: History },
  { id: 'templates',  label: 'Custom templates',   icon: LayoutTemplate },
  { id: 'integrations', label: 'Integrations',     icon: Puzzle },
  { id: 'trash',      label: 'Trash',              icon: Trash2 },
];

const BG_OPTIONS = [
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'gray',  label: 'Gray',  value: '#f8fafc' },
  { id: 'dark',  label: 'Dark',  value: '#1e293b' },
  { id: 'blue',  label: 'Blue',  value: '#dbeafe' },
  { id: 'green', label: 'Green', value: '#d1fae5' },
];

export default function BoardSettings({ session, onClose, onUpdate }) {
  const [activeSection, setActiveSection] = useState('general');
  const [boardName, setBoardName] = useState(session?.name || 'Product Roadmap');
  const [description, setDescription] = useState(session?.description || '');
  const [selectedBg, setSelectedBg] = useState('white');
  const [showGrid, setShowGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate?.({ name: boardName, description });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bsettings-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="bsettings-modal" role="dialog" aria-modal="true">
        {/* Sidebar */}
        <aside className="bsettings-sidebar">
          <div className="bsettings-sidebar-title">Board Settings</div>
          <nav className="bsettings-nav">
            {SETTINGS_NAV.map(item => (
              <button
                key={item.id}
                className={`bsettings-nav-item${activeSection === item.id ? ' active' : ''}${item.id === 'trash' ? ' danger' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="bsettings-content">
          <div className="bsettings-content-header">
            <h2 className="bsettings-content-title">
              {SETTINGS_NAV.find(n => n.id === activeSection)?.label}
            </h2>
            <button className="bsettings-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          {activeSection === 'general' && (
            <div className="bsettings-body">
              {/* Board name */}
              <div className="bsettings-field">
                <label className="bsettings-label">Board name</label>
                <input
                  className="bsettings-input"
                  value={boardName}
                  onChange={e => setBoardName(e.target.value)}
                  placeholder="Enter board name"
                />
              </div>

              {/* Description */}
              <div className="bsettings-field">
                <label className="bsettings-label">Description</label>
                <textarea
                  className="bsettings-input bsettings-textarea"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Add a short description…"
                  rows={3}
                />
              </div>

              {/* Background */}
              <div className="bsettings-field">
                <label className="bsettings-label">Background</label>
                <div className="bsettings-bg-row">
                  {BG_OPTIONS.map(bg => (
                    <button
                      key={bg.id}
                      className={`bsettings-bg-swatch${selectedBg === bg.id ? ' selected' : ''}`}
                      style={{ background: bg.value, border: bg.value === '#ffffff' ? '1px solid var(--border-default)' : 'none' }}
                      onClick={() => setSelectedBg(bg.id)}
                      title={bg.label}
                    >
                      {selectedBg === bg.id && <Check size={12} color={bg.id === 'dark' ? '#fff' : '#1e293b'} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="bsettings-field">
                <label className="bsettings-label">Display</label>
                <div className="bsettings-toggles">
                  <BoardToggle
                    label="Grid"
                    desc="Show dot grid on canvas"
                    value={showGrid}
                    onChange={setShowGrid}
                  />
                  <BoardToggle
                    label="Show mini map"
                    desc="Navigation minimap in corner"
                    value={showMinimap}
                    onChange={setShowMinimap}
                  />
                </div>
              </div>

              <div className="bsettings-footer">
                <button className="bsettings-btn-ghost" onClick={onClose}>Cancel</button>
                <button className="bsettings-btn-primary" onClick={handleSave}>
                  {saved ? <><Check size={13} /> Saved</> : 'Save changes'}
                </button>
              </div>

              {/* Danger */}
              <div className="bsettings-danger">
                <div className="bsettings-danger-label">Delete board</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <p style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                    Once deleted, all content and collaborators will be permanently removed.
                  </p>
                  <button className="bsettings-btn-danger">Delete board</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'collab' && (
            <div className="bsettings-body">
              <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Manage who has access to this board.
              </p>
              <div className="bsettings-collab-row">
                <div className="bsettings-collab-avatar" style={{ background: '#8b5cf6' }}>A</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '.875rem' }}>You</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>alex@example.com</div>
                </div>
                <span className="bsettings-role-badge owner">Owner</span>
              </div>
              <div className="bsettings-collab-row">
                <div className="bsettings-collab-avatar" style={{ background: '#06b6d4' }}>E</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '.875rem' }}>Emma</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>emma@example.com</div>
                </div>
                <span className="bsettings-role-badge editor">Can edit</span>
                <button className="bsettings-remove-btn" title="Remove"><X size={12} /></button>
              </div>
              <div className="bsettings-collab-row">
                <div className="bsettings-collab-avatar" style={{ background: '#f59e0b' }}>L</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '.875rem' }}>Liam</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>liam@example.com</div>
                </div>
                <span className="bsettings-role-badge viewer">Can view</span>
                <button className="bsettings-remove-btn" title="Remove"><X size={12} /></button>
              </div>
            </div>
          )}

          {activeSection === 'perms' && (
            <div className="bsettings-body">
              <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Control what collaborators can do on this board.
              </p>
              <div className="bsettings-toggles">
                <BoardToggle label="Editors can invite" desc="Allow editors to invite new collaborators" defaultOn />
                <BoardToggle label="Anyone with link can view" desc="Public view link enabled" defaultOn />
                <BoardToggle label="Allow comments" desc="Collaborators can leave comments" defaultOn />
                <BoardToggle label="Allow exports" desc="Collaborators can export the board" />
              </div>
            </div>
          )}

          {(activeSection === 'history' || activeSection === 'templates' || activeSection === 'integrations' || activeSection === 'trash') && (
            <div className="bsettings-body bsettings-coming-soon">
              <div className="bsettings-coming-icon">✦</div>
              <h3>Coming soon</h3>
              <p>This feature is under development and will be available soon.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function BoardToggle({ label, desc, value, onChange, defaultOn = false }) {
  const [on, setOn] = useState(value !== undefined ? value : defaultOn);
  const toggle = () => {
    const next = !on;
    setOn(next);
    onChange?.(next);
  };
  return (
    <div className="bsettings-toggle-row">
      <div>
        <div className="bsettings-toggle-label">{label}</div>
        {desc && <div className="bsettings-toggle-desc">{desc}</div>}
      </div>
      <label className="bsettings-toggle-switch">
        <input type="checkbox" checked={on} onChange={toggle} />
        <div className="bsettings-track" />
        <div className="bsettings-thumb" />
      </label>
    </div>
  );
}