import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sessionAPI } from "../services/api";
import { useToast } from "./ToastSystem";
import { Search, Home, Clock, Star, LayoutTemplate, Users, Trash2, Folder, Plus } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Home");

  const fetchSessions = useCallback(async () => {
    try {
      const data = await sessionAPI.getAll();
      setSessions(data);
    } catch (err) {
      addToast("Failed to load boards", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const filtered = sessions.filter((s) => {
    if (!search) return true;
    return (s.name || "").toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = async () => {
    try {
      const session = await sessionAPI.create({
        name: "Untitled Board",
        ownerName: "User", // Ideally from context
      });
      navigate(`/board/${session.id}`);
    } catch (err) {
      addToast("Could not create board", "error");
    }
  };

  const navItems = [
    { name: "Home", icon: Home },
    { name: "Recent", icon: Clock },
    { name: "Starred", icon: Star },
    { name: "Templates", icon: LayoutTemplate },
    { name: "Shared with me", icon: Users },
    { name: "Trash", icon: Trash2 },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
        <div style={{ padding: '0 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 6 }} />
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Boardly</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                borderRadius: 'var(--r-md)', border: 'none',
                background: activeTab === item.name ? 'var(--bg-active)' : 'transparent',
                color: activeTab === item.name ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeTab === item.name ? 600 : 500,
                cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem'
              }}
            >
              <item.icon size={16} />
              {item.name}
            </button>
          ))}

          <div style={{ margin: '24px 0 8px 12px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Projects
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--r-md)', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>
            <Folder size={16} /> Product Launch
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--r-md)', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>
            <Folder size={16} /> Marketing Assets
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ height: 60, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-hover)', padding: '6px 12px', borderRadius: 'var(--r-md)', width: 400 }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              placeholder="Search boards, projects, people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Welcome back! 👋</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
              U
            </div>
          </div>
        </header>

        {/* Board Grid */}
        <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeTab}</h1>
            <button className="btn btn-primary" onClick={handleCreate}>
              <Plus size={16} /> New board
            </button>
          </div>

          {loading ? (
            <div>Loading boards...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              No boards found. Create a new one to get started!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {filtered.map(session => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/board/${session.id}`)}
                  style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-lg)',
                    overflow: 'hidden', cursor: 'pointer', transition: 'all var(--dur)', display: 'flex', flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ height: 140, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                     {/* Board Thumbnail Placeholder */}
                     <div style={{ width: 100, height: 60, border: '2px dashed var(--border-default)', borderRadius: 4 }} />
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {session.name || 'Untitled Board'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Edited {new Date(session.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}