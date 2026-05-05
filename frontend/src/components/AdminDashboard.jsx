import { useState, useEffect, useCallback } from 'react';
import { sessionAPI } from '../services/api';
import { ArrowLeft, RefreshCw, Trash2, ToggleLeft, ToggleRight, Users, Activity, BarChart3 } from 'lucide-react';

export default function AdminDashboard({ onBack }) {
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, analyt] = await Promise.all([sessionAPI.getAll(), sessionAPI.getAnalytics()]);
      setSessions(all);
      setAnalytics(analyt);
    } catch { setSessions([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    await sessionAPI.delete(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleToggle = async (session) => {
    const updated = await sessionAPI.toggle(session.id, !session.active);
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const fmt = (ts) => { try { return new Date(ts).toLocaleDateString(); } catch { return '—'; } };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            <ArrowLeft size={14}/> Back
          </button>
          <div>
            <div className="admin-title">Admin Dashboard</div>
            <div className="admin-subtitle">Manage whiteboard sessions and users</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
        </button>
      </header>

      <div className="admin-body">
        {/* Analytics */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-card-label"><BarChart3 size={12} style={{display:'inline',marginRight:4}}/>Total Sessions</div>
            <div className="analytics-card-value purple">{analytics.totalSessions ?? '—'}</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card-label"><Activity size={12} style={{display:'inline',marginRight:4}}/>Active Sessions</div>
            <div className="analytics-card-value cyan">{analytics.activeSessions ?? '—'}</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card-label"><Users size={12} style={{display:'inline',marginRight:4}}/>Online Users</div>
            <div className="analytics-card-value green">{analytics.totalActiveUsers ?? '—'}</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card-label">Boards in List</div>
            <div className="analytics-card-value purple">{sessions.length}</div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="sessions-table-wrap">
          <div className="table-header">
            <h3>All Sessions</h3>
            <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{sessions.length} total</span>
          </div>
          {loading ? (
            <div className="empty-state" style={{ padding:'3rem' }}>
              <RefreshCw size={24} className="spinner" style={{ margin:'0 auto 1rem', display:'block', color:'var(--purple)' }} />
              Loading sessions…
            </div>
          ) : sessions.length === 0 ? (
            <div className="empty-state" style={{ padding:'3rem' }}>No sessions found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Owner</th>
                  <th>Session ID</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{s.name}</td>
                    <td>{s.ownerName || '—'}</td>
                    <td style={{ fontFamily:'monospace', fontSize:'0.75rem', color:'var(--text-muted)' }}>{s.id.slice(0,12)}…</td>
                    <td>{fmt(s.createdAt)}</td>
                    <td>
                      <span className={`status-badge ${s.active ? 'active' : 'inactive'}`}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block' }}/>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:'0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(s)} title={s.active ? 'Deactivate' : 'Activate'}>
                          {s.active ? <ToggleRight size={14}/> : <ToggleLeft size={14}/>}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)} title="Delete">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
