import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { sessionAPI } from "../services/api";
import { useToast } from "./ToastSystem";
import { auth } from "../services/authUtils";
import {
  Search, Home, Clock, Star, LayoutTemplate, Users, Trash2,
  Folder, Plus, Settings, MoreHorizontal,
  TrendingUp, Activity, Zap, Grid, List, ArrowRight,
  Moon, Sun, Bell,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

/* ─────────────────── Helpers ─────────────────── */
function timeAgo(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const BG_PATTERNS = [
  'radial-gradient(ellipse at 30% 40%, #6366f128 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, #06b6d420 0%, transparent 60%)',
  'radial-gradient(ellipse at 70% 30%, #ec489928 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #10b98120 0%, transparent 60%)',
  'radial-gradient(ellipse at 50% 20%, #f59e0b28 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #6366f120 0%, transparent 60%)',
  'radial-gradient(ellipse at 20% 50%, #06b6d428 0%, transparent 60%), radial-gradient(ellipse at 90% 30%, #ec489920 0%, transparent 60%)',
  'radial-gradient(ellipse at 60% 60%, #10b98128 0%, transparent 60%), radial-gradient(ellipse at 10% 20%, #f59e0b20 0%, transparent 60%)',
];

function BoardCard({ session, onOpen, onDelete, index }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div
      className="board-card"
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen()}
      role="button"
    >
      {/* Thumbnail */}
      <div className="board-card-thumb" style={{ background: BG_PATTERNS[index % BG_PATTERNS.length] }}>
        <div className="board-card-thumb-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="board-card-thumb-element" style={{
              opacity: 0.25 + i * 0.15,
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>
        <div className={`board-status-badge ${session.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
          <span className="board-status-dot" />
          {session.status === 'ACTIVE' ? 'Live' : session.status || 'Draft'}
        </div>
      </div>

      {/* Info */}
      <div className="board-card-info">
        <div className="board-card-title">{session.name || 'Untitled Board'}</div>
        <div className="board-card-meta">
          <span className="board-card-time">{timeAgo(session.createdAt)}</span>
          {session.ownerName && (
            <span className="board-card-owner">
              <div className="board-card-avatar">{session.ownerName[0]?.toUpperCase()}</div>
              {session.ownerName}
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="board-card-menu" ref={menuRef} onClick={e => e.stopPropagation()}>
        <button className="board-menu-btn" onClick={() => setMenuOpen(s => !s)}>
          <MoreHorizontal size={15} />
        </button>
        {menuOpen && (
          <div className="board-dropdown">
            <button className="board-dropdown-item" onClick={() => { setMenuOpen(false); onOpen(); }}>
              <ArrowRight size={12} /> Open
            </button>
            <button className="board-dropdown-item board-dropdown-item--danger" onClick={() => { setMenuOpen(false); onDelete(); }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Main ─────────────────── */
export default function AdminDashboard() {
  const navigate  = useNavigate();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const currentUser = auth.getUser();

  const [sessions,   setSessions]   = useState([]);
  const [analytics,  setAnalytics]  = useState({ totalSessions: 0, activeSessions: 0, totalActiveUsers: 0 });
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [activeTab,  setActiveTab]  = useState('Home');
  const [viewMode,   setViewMode]   = useState('grid');
  const [creating,   setCreating]   = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [data, stats] = await Promise.all([
        sessionAPI.getAll(),
        sessionAPI.getAnalytics().catch(() => ({})),
      ]);
      setSessions(Array.isArray(data) ? data : []);
      setAnalytics(prev => ({ ...prev, ...stats }));
    } catch {
      addToast('Failed to load boards', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = sessions.filter(s =>
    !search || (s.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    setCreating(true);
    try {
      const session = await sessionAPI.create({
        name:      'Untitled Board',
        ownerName: currentUser?.name || 'You',
        ownerId:   currentUser?.userId || '',
      });
      navigate(`/board/${session.id}`, { state: { sessionData: session } });
    } catch {
      addToast('Could not create board', 'error');
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this board permanently?')) return;
    try {
      await sessionAPI.delete(id);
      setSessions(s => s.filter(b => b.id !== id));
      addToast('Board deleted', 'success');
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  const NAV_ITEMS = [
    { name: 'Home',           icon: Home },
    { name: 'Recent',         icon: Clock },
    { name: 'Starred',        icon: Star },
    { name: 'Templates',      icon: LayoutTemplate },
    { name: 'Shared with me', icon: Users },
    { name: 'Trash',          icon: Trash2 },
  ];

  const STAT_CARDS = [
    { label: 'Total Boards',  value: analytics.totalSessions  || sessions.length, color: 'var(--accent-light)', icon: <Zap size={16} /> },
    { label: 'Active Now',    value: analytics.activeSessions || 0,               color: 'var(--green)',        icon: <Activity size={16} /> },
    { label: 'Collaborators', value: analytics.totalActiveUsers || 0,             color: 'var(--cyan)',         icon: <TrendingUp size={16} /> },
  ];

  const initials = (currentUser?.name || 'U')[0].toUpperCase();

  return (
    <div className="dashboard-shell">

      {/* ── Sidebar ── */}
      <aside className="dashboard-sidebar">
        <div className="dash-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="dash-brand-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
            </svg>
          </div>
          <span className="dash-brand-name">Boardly</span>
        </div>

        <button className="dash-create-btn" onClick={handleCreate} disabled={creating}>
          <Plus size={14} />
          {creating ? 'Creating…' : 'New board'}
        </button>

        <nav className="dash-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.name}
              className={`dash-nav-item${activeTab === item.name ? ' active' : ''}`}
              onClick={() => setActiveTab(item.name)}
            >
              <item.icon size={15} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="dash-nav-section">Projects</div>
        {['Design Team', 'Marketing', 'Product', 'Personal'].map(name => (
          <button key={name} className="dash-nav-item">
            <Folder size={15} /> {name}
          </button>
        ))}

        {/* Bottom nav */}
        <div className="dash-sidebar-footer">
          <button className="dash-nav-item" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="dash-nav-item" onClick={() => navigate('/settings')}>
            <Settings size={15} /> Settings
          </button>

          {currentUser && (
            <div
              className="dash-user-chip"
              onClick={() => navigate('/settings')}
              style={{ cursor: 'pointer' }}
            >
              <div className="dash-user-av">{initials}</div>
              <div className="dash-user-info">
                <div className="dash-user-name">{currentUser.name}</div>
                <div className="dash-user-email">{currentUser.email}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dashboard-main">

        {/* Header */}
        <div className="dashboard-topbar">
          <div className="dash-search-wrap">
            <Search size={15} className="dash-search-icon" />
            <input
              className="dash-search"
              placeholder="Search boards, projects, people…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="dash-search-clear" onClick={() => setSearch('')}>×</button>
            )}
          </div>

          <div className="dash-topbar-actions">
            <button
              className={`dash-view-btn${viewMode === 'grid' ? ' active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Grid size={15} />
            </button>
            <button
              className={`dash-view-btn${viewMode === 'list' ? ' active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={15} />
            </button>

            {/* Notification bell */}
            <button
              className="dash-view-btn"
              onClick={() => navigate('/notifications')}
              title="Notifications"
              style={{ position: 'relative' }}
            >
              <Bell size={15} />
              {/* unread dot */}
              <span style={{
                position: 'absolute', top: 5, right: 5,
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent)',
                border: '1.5px solid var(--bg-surface)',
              }} />
            </button>

            {/* User avatar shortcut to settings */}
            {currentUser && (
              <button
                className="dash-view-btn"
                onClick={() => navigate('/settings')}
                title="Profile settings"
                style={{
                  width: 30, height: 30,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '.75rem',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {initials}
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="dashboard-body">

          {/* Welcome banner */}
          <div className="dash-welcome">
            <div>
              <h1 className="dash-welcome-title">
                Welcome back, {currentUser?.name?.split(' ')[0] || 'there'}! 👋
              </h1>
              <p className="dash-welcome-sub">
                {filtered.length > 0
                  ? `You have ${filtered.length} board${filtered.length !== 1 ? 's' : ''}. Pick up where you left off.`
                  : 'Create your first board to get started.'}
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
              <Plus size={14} /> New board
            </button>
          </div>

          {/* Stats row */}
          <div className="dash-stats-row">
            {STAT_CARDS.map(card => (
              <div key={card.label} className="dash-stat-card">
                <div className="dash-stat-icon" style={{ color: card.color, background: `${card.color}18` }}>
                  {card.icon}
                </div>
                <div>
                  <div className="dash-stat-value" style={{ color: card.color }}>{card.value}</div>
                  <div className="dash-stat-label">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Section header */}
          <div className="dash-section-header">
            <div>
              <h2 className="dash-section-title">{activeTab}</h2>
              <p className="dash-section-sub">{filtered.length} board{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Boards */}
          {loading ? (
            <div className="dash-loading">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="board-card-skeleton" style={{ animationDelay: `${i * 0.07}s` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon">✦</div>
              <h3>No boards yet</h3>
              <p>{search ? `No results for "${search}"` : 'Create your first collaborative board to get started.'}</p>
              {!search && (
                <button className="btn btn-primary" onClick={handleCreate} style={{ marginTop: 16 }}>
                  <Plus size={14} /> Create board
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="boards-grid">
              {filtered.map((session, i) => (
                <BoardCard
                  key={session.id}
                  session={session}
                  index={i}
                  onOpen={() => navigate(`/board/${session.id}`)}
                  onDelete={() => handleDelete(session.id)}
                />
              ))}
              {/* New board card */}
              <div
                className="board-card board-card--new"
                onClick={handleCreate}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                role="button"
              >
                <Plus size={22} style={{ opacity: .4 }} />
                <span>New board</span>
              </div>
            </div>
          ) : (
            <div className="boards-list">
              {filtered.map((session, i) => (
                <div
                  key={session.id}
                  className="board-list-row"
                  onClick={() => navigate(`/board/${session.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="board-list-thumb" style={{ background: BG_PATTERNS[i % BG_PATTERNS.length] }} />
                  <div className="board-list-info">
                    <div className="board-list-name">{session.name || 'Untitled Board'}</div>
                    <div className="board-list-meta">{timeAgo(session.createdAt)}</div>
                  </div>
                  <div className={`status-badge ${session.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                    {session.status || 'Draft'}
                  </div>
                  <button
                    className="board-menu-btn"
                    onClick={e => { e.stopPropagation(); handleDelete(session.id); }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        .dash-welcome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .dash-welcome-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .dash-welcome-sub {
          font-size: .875rem;
          color: var(--text-secondary);
        }
        .board-card--new {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 2px dashed var(--border-default) !important;
          background: transparent !important;
          color: var(--text-muted);
          font-size: .85rem;
          font-weight: 500;
          min-height: 160px;
          cursor: pointer;
          transition: border-color .15s, color .15s;
        }
        .board-card--new:hover {
          border-color: var(--accent) !important;
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}