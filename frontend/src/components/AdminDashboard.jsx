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

/* ─── Helpers ─────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const BG_PATTERNS = [
  "radial-gradient(ellipse at 30% 40%, rgba(196,255,51,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(62,166,255,0.12) 0%, transparent 60%)",
  "radial-gradient(ellipse at 70% 30%, rgba(255,94,66,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(0,221,179,0.12) 0%, transparent 60%)",
  "radial-gradient(ellipse at 50% 20%, rgba(255,176,32,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(155,127,255,0.12) 0%, transparent 60%)",
  "radial-gradient(ellipse at 20% 50%, rgba(62,166,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 90% 30%, rgba(255,94,66,0.12) 0%, transparent 60%)",
  "radial-gradient(ellipse at 60% 60%, rgba(0,221,179,0.15) 0%, transparent 60%), radial-gradient(ellipse at 10% 20%, rgba(196,255,51,0.12) 0%, transparent 60%)",
];

/* ─── Board Card ──────────────────────────────────────── */
function BoardCard({ session, onOpen, onDelete, index }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div
      className="board-card"
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      role="button"
      aria-label={`Open board ${session.name || "Untitled"}`}
    >
      {/* Thumbnail */}
      <div className="board-card-thumb" style={{ background: BG_PATTERNS[index % BG_PATTERNS.length] }}>
        <div className="board-card-thumb-grid">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="board-card-thumb-element"
              style={{ opacity: 0.3 + i * 0.12, animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
        <div className={`board-status-badge ${session.status === "ACTIVE" ? "active" : "inactive"}`}>
          <span className="board-status-dot" />
          {session.status === "ACTIVE" ? "Live" : session.status || "Draft"}
        </div>
      </div>

      {/* Info */}
      <div className="board-card-info">
        <div className="board-card-title">{session.name || "Untitled Board"}</div>
        <div className="board-card-meta">
          <span className="board-card-time">{timeAgo(session.createdAt)}</span>
          {session.ownerName && (
            <span className="board-card-owner">
              <div className="board-card-avatar">
                {session.ownerName[0]?.toUpperCase()}
              </div>
              {session.ownerName}
            </span>
          )}
        </div>
      </div>

      {/* 3-dot menu */}
      <div className="board-card-menu" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button className="board-menu-btn" onClick={() => setMenuOpen((s) => !s)} aria-label="Board options">
          <MoreHorizontal size={15} />
        </button>
        {menuOpen && (
          <div className="board-dropdown">
            <button className="board-dropdown-item" onClick={() => { setMenuOpen(false); onOpen(); }}>
              <ArrowRight size={12} /> Open
            </button>
            <button
              className="board-dropdown-item board-dropdown-item--danger"
              onClick={() => { setMenuOpen(false); onDelete(); }}
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const currentUser = auth.getUser();

  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState({ totalSessions: 0, activeSessions: 0, totalActiveUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Home");
  const [viewMode, setViewMode] = useState("grid");
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [data, stats] = await Promise.all([
        sessionAPI.getAll(),
        sessionAPI.getAnalytics().catch(() => ({})),
      ]);
      setSessions(Array.isArray(data) ? data : []);
      setAnalytics((prev) => ({ ...prev, ...stats }));
    } catch {
      addToast("Failed to load boards", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = sessions.filter(
    (s) => !search || (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    setCreating(true);
    try {
      const session = await sessionAPI.create({
        name: "Untitled Board",
        ownerName: currentUser?.name || "You",
        ownerId: currentUser?.userId || "",
      });
      navigate(`/board/${session.id}`, { state: { sessionData: session } });
    } catch {
      addToast("Could not create board", "error");
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this board permanently?")) return;
    try {
      await sessionAPI.delete(id);
      setSessions((s) => s.filter((b) => b.id !== id));
      addToast("Board deleted", "success");
    } catch {
      addToast("Delete failed", "error");
    }
  };

  const NAV_ITEMS = [
    { name: "Home", icon: Home },
    { name: "Recent", icon: Clock },
    { name: "Starred", icon: Star },
    { name: "Templates", icon: LayoutTemplate },
    { name: "Shared with me", icon: Users },
    { name: "Trash", icon: Trash2 },
  ];

  const STAT_CARDS = [
    { label: "Total Boards", value: analytics.totalSessions || sessions.length, color: "var(--lime)", bg: "var(--lime-muted)", icon: <Zap size={16} /> },
    { label: "Active Now", value: analytics.activeSessions || 0, color: "var(--green)", bg: "rgba(34,221,101,0.1)", icon: <Activity size={16} /> },
    { label: "Collaborators", value: analytics.totalActiveUsers || 0, color: "var(--sky)", bg: "rgba(62,166,255,0.1)", icon: <TrendingUp size={16} /> },
  ];

  const initials = (currentUser?.name || "U")[0].toUpperCase();

  return (
    <div className="dashboard-shell">

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="dashboard-sidebar">
        <div className="dash-brand" onClick={() => navigate("/")}>
          <div className="dash-brand-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A0A14">
              <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
            </svg>
          </div>
          <span className="dash-brand-name">CollabBoard</span>
        </div>

        <button className="dash-create-btn" onClick={handleCreate} disabled={creating}>
          <Plus size={14} />
          {creating ? "Creating…" : "New board"}
        </button>

        <nav className="dash-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.name}
              className={`dash-nav-item${activeTab === item.name ? " active" : ""}`}
              onClick={() => setActiveTab(item.name)}
            >
              <item.icon size={15} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="dash-nav-section">Projects</div>
        {[
          { name: "Design Team", color: "var(--lime)" },
          { name: "Marketing", color: "var(--sky)" },
          { name: "Product", color: "var(--purple)" },
          { name: "Personal", color: "var(--amber)" },
        ].map(({ name, color }) => (
          <button key={name} className="dash-nav-item">
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: color, flexShrink: 0,
            }} />
            {name}
          </button>
        ))}

        {/* Footer */}
        <div className="dash-sidebar-footer">
          <button className="dash-nav-item" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button className="dash-nav-item" onClick={() => navigate("/settings")}>
            <Settings size={15} /> Settings
          </button>
          {currentUser && (
            <div className="dash-user-chip" onClick={() => navigate("/settings")}>
              <div className="dash-user-av">{initials}</div>
              <div className="dash-user-info">
                <div className="dash-user-name">{currentUser.name}</div>
                <div className="dash-user-email">{currentUser.email}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <main className="dashboard-main">

        {/* Topbar */}
        <div className="dashboard-topbar">
          <div className="dash-search-wrap">
            <Search size={15} className="dash-search-icon" />
            <input
              className="dash-search"
              placeholder="Search boards, projects, people…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="dash-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          <div className="dash-topbar-actions">
            <button
              className={`dash-view-btn${viewMode === "grid" ? " active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <Grid size={15} />
            </button>
            <button
              className={`dash-view-btn${viewMode === "list" ? " active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List size={15} />
            </button>
            <button
              className="dash-view-btn"
              onClick={() => navigate("/notifications")}
              title="Notifications"
              style={{ position: "relative" }}
            >
              <Bell size={15} />
              <span style={{
                position: "absolute", top: 5, right: 5,
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--lime)", border: "1.5px solid var(--bg-surface)",
              }} />
            </button>
            {currentUser && (
              <button
                className="dash-view-btn"
                onClick={() => navigate("/settings")}
                title="Profile settings"
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "var(--lime)", color: "#0A0A14",
                  fontWeight: 800, fontSize: ".72rem", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 800,
                color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4,
              }}>
                Welcome back, {currentUser?.name?.split(" ")[0] || "there"} 👋
              </h1>
              <p style={{ fontSize: ".875rem", color: "var(--text-secondary)" }}>
                {filtered.length > 0
                  ? `You have ${filtered.length} board${filtered.length !== 1 ? "s" : ""}. Pick up where you left off.`
                  : "Create your first board to get started."}
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={creating}>
              <Plus size={14} /> New board
            </button>
          </div>

          {/* Stats */}
          <div className="dash-stats-row">
            {STAT_CARDS.map((card) => (
              <div key={card.label} className="dash-stat-card">
                <div className="dash-stat-icon" style={{ color: card.color, background: card.bg }}>
                  {card.icon}
                </div>
                <div>
                  <div className="dash-stat-value" style={{ color: card.color }}>
                    {card.value}
                  </div>
                  <div className="dash-stat-label">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Section header */}
          <div className="dash-section-header">
            <div>
              <h2 className="dash-section-title">{activeTab}</h2>
              <p className="dash-section-sub">
                {filtered.length} board{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Content */}
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
              <p>
                {search
                  ? `No results for "${search}"`
                  : "Create your first collaborative board to get started."}
              </p>
              {!search && (
                <button className="btn btn-primary" onClick={handleCreate} style={{ marginTop: 16 }}>
                  <Plus size={14} /> Create board
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
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
                className="board-card"
                onClick={handleCreate}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                role="button"
                aria-label="Create new board"
                style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 10, minHeight: 165,
                  border: "1px dashed var(--border-default)",
                  background: "transparent", color: "var(--text-muted)",
                  fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                  transition: "all var(--dur-slow)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--lime-border)";
                  e.currentTarget.style.color = "var(--lime)";
                  e.currentTarget.style.background = "var(--lime-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Plus size={22} style={{ opacity: 0.5 }} />
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
                  <div
                    className="board-list-thumb"
                    style={{ background: BG_PATTERNS[i % BG_PATTERNS.length] }}
                  />
                  <div className="board-list-info">
                    <div className="board-list-name">{session.name || "Untitled Board"}</div>
                    <div className="board-list-meta">{timeAgo(session.createdAt)}</div>
                  </div>
                  <div className={`status-badge ${session.status === "ACTIVE" ? "active" : "inactive"}`}>
                    {session.status || "Draft"}
                  </div>
                  <button
                    className="board-menu-btn"
                    onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                    title="Delete"
                    style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}