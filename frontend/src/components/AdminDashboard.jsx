import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sessionAPI } from "../services/api";
import { useToast } from "./ToastSystem";

/**
 * AdminDashboard.jsx
 * Fixed: handleToggle now passes status string ("ACTIVE" / "PAUSED")
 * instead of boolean !session.active (which was removed in the status-string refactor).
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [togglingId, setTogglingId] = useState(null);

  /* ── Fetch sessions ── */
  const fetchSessions = useCallback(async () => {
    try {
      const data = await sessionAPI.getAllSessions();
      setSessions(data);
    } catch (err) {
      addToast("Failed to load sessions", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  /* ── Toggle session status ── */
  const handleToggle = async (session) => {
    // FIX: derive the target status from the string field, not the old boolean
    const nextStatus = session.status === "ACTIVE" ? "PAUSED" : "ACTIVE";

    setTogglingId(session.id);
    try {
      await sessionAPI.updateSessionStatus(session.id, nextStatus);
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, status: nextStatus } : s))
      );
      addToast(
        `Session ${nextStatus === "ACTIVE" ? "resumed" : "paused"}`,
        nextStatus === "ACTIVE" ? "success" : "info"
      );
    } catch (err) {
      addToast("Failed to update session", "error");
    } finally {
      setTogglingId(null);
    }
  };

  /* ── End / delete session ── */
  const handleEnd = async (sessionId) => {
    if (!window.confirm("End this session permanently?")) return;
    try {
      await sessionAPI.endSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      addToast("Session ended", "success");
    } catch {
      addToast("Failed to end session", "error");
    }
  };

  /* ── Filter + search ── */
  const filtered = sessions.filter((s) => {
    const matchStatus = filterStatus === "ALL" || s.status === filterStatus;
    const matchSearch =
      !search ||
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.ownerName || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  /* ── Stats ── */
  const stats = {
    total: sessions.length,
    active: sessions.filter((s) => s.status === "ACTIVE").length,
    paused: sessions.filter((s) => s.status === "PAUSED").length,
    ended: sessions.filter((s) => s.status === "ENDED").length,
  };

  return (
    <div className="admin">
      {/* ── Header ── */}
      <header className="admin-header">
        <div className="admin-header__left">
          <button className="btn btn--ghost btn--sm" onClick={() => navigate("/")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
          <h1 className="admin-title">Admin Dashboard</h1>
        </div>
        <button className="btn btn--primary btn--sm" onClick={fetchSessions}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </header>

      {/* ── Stats row ── */}
      <div className="admin-stats">
        {[
          { label: "Total", value: stats.total, color: "var(--text-primary)" },
          { label: "Active", value: stats.active, color: "var(--success)" },
          { label: "Paused", value: stats.paused, color: "var(--warning)" },
          { label: "Ended", value: stats.ended, color: "var(--text-tertiary)" },
        ].map((s) => (
          <div className="admin-stat-card" key={s.label}>
            <span className="admin-stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="admin-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="admin-filters">
        <div className="admin-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="admin-search"
            type="text"
            placeholder="Search sessions or owners…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>
        <div className="admin-filter-tabs">
          {["ALL", "CREATED", "ACTIVE", "PAUSED", "ENDED"].map((status) => (
            <button
              key={status}
              className={`admin-filter-tab${filterStatus === status ? " admin-filter-tab--active" : ""}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === "ALL" ? "All" : capitalize(status)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-empty">
            <span className="spinner" /> Loading sessions…
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            No sessions found.{" "}
            {search && <button className="btn-link" onClick={() => setSearch("")}>Clear search</button>}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Owner</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((session) => (
                <tr key={session.id} className={`admin-row admin-row--${(session.status || "").toLowerCase()}`}>
                  <td>
                    <div className="admin-session-name">
                      {session.name || `Session ${session.id.slice(-6)}`}
                    </div>
                    <div className="admin-session-id">{session.id}</div>
                  </td>
                  <td>{session.ownerName || "—"}</td>
                  <td>
                    <span className="admin-participants">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {session.participants?.length ?? 0}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={session.status} />
                  </td>
                  <td className="admin-date">
                    {session.createdAt
                      ? new Date(session.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td>
                    <div className="admin-actions">
                      {/* Open board */}
                      <button
                        className="btn btn--ghost btn--xs"
                        onClick={() => navigate(`/board/${session.id}`)}
                        title="Open board"
                      >
                        Open
                      </button>

                      {/* Toggle Active ↔ Paused — only for non-ENDED sessions */}
                      {session.status !== "ENDED" && (
                        <button
                          className={`btn btn--xs ${
                            session.status === "ACTIVE" ? "btn--warning" : "btn--primary"
                          }`}
                          onClick={() => handleToggle(session)}
                          disabled={togglingId === session.id}
                          title={session.status === "ACTIVE" ? "Pause session" : "Resume session"}
                        >
                          {togglingId === session.id ? (
                            <span className="spinner spinner--xs" />
                          ) : session.status === "ACTIVE" ? (
                            "Pause"
                          ) : (
                            "Resume"
                          )}
                        </button>
                      )}

                      {/* End session */}
                      {session.status !== "ENDED" && (
                        <button
                          className="btn btn--danger btn--xs"
                          onClick={() => handleEnd(session.id)}
                          title="End session"
                        >
                          End
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="admin-footer-note">
        Showing {filtered.length} of {sessions.length} sessions
      </p>
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }) {
  const map = {
    CREATED: { label: "Created", cls: "badge--neutral" },
    ACTIVE:  { label: "Active",  cls: "badge--success" },
    PAUSED:  { label: "Paused",  cls: "badge--warning" },
    ENDED:   { label: "Ended",   cls: "badge--muted" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "badge--neutral" };
  return <span className={`badge ${cls}`}>{label}</span>;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}