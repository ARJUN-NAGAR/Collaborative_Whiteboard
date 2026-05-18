import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Users, Edit3, Zap, Star } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'collab',
    icon: Users,
    color: '#6366f1',
    title: 'Emma commented on your board',
    detail: 'emma@example.com',
    body: '"Great layout — love the research section!"',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'edit',
    icon: Edit3,
    color: '#06b6d4',
    title: 'Liam mentioned you in Product Roadmap',
    detail: 'liam@example.com',
    body: '@you — can you add the Q4 milestones?',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'invite',
    icon: Star,
    color: '#f59e0b',
    title: 'Sophie shared a board with you',
    detail: 'sophie@example.com',
    body: 'Design Sprint — Can view',
    time: '3 days ago',
    read: true,
  },
  {
    id: '4',
    type: 'system',
    icon: Zap,
    color: '#10b981',
    title: 'Your export is ready',
    detail: 'System',
    body: 'Product Roadmap.png has been exported successfully.',
    time: '5 days ago',
    read: true,
  },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const dismiss = (id) => {
    setNotifications(ns => ns.filter(n => n.id !== id));
  };

  const markRead = (id) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const visible = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="notif-root">
      {/* Header */}
      <div className="notif-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={20} />
          <h1 className="notif-title">Notifications</h1>
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount}</span>
          )}
        </div>
        <button className="notif-mark-all" onClick={markAllRead} disabled={unreadCount === 0}>
          <Check size={13} /> Mark all as read
        </button>
      </div>

      {/* Filters */}
      <div className="notif-filters">
        {['all', 'unread'].map(f => (
          <button
            key={f}
            className={`notif-filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="notif-list">
        {visible.length === 0 ? (
          <div className="notif-empty">
            <Bell size={28} style={{ opacity: .3 }} />
            <p>No {filter === 'unread' ? 'unread ' : ''}notifications</p>
          </div>
        ) : (
          visible.map(n => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className={`notif-item${!n.read ? ' notif-item--unread' : ''}`}
                onClick={() => markRead(n.id)}
              >
                <div className="notif-icon-wrap" style={{ background: `${n.color}18`, color: n.color }}>
                  <Icon size={15} />
                </div>
                <div className="notif-content">
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-detail">{n.detail}</div>
                  {n.body && <div className="notif-item-body">{n.body}</div>}
                </div>
                <div className="notif-meta">
                  <span className="notif-time">{n.time}</span>
                  {!n.read && <span className="notif-unread-dot" />}
                </div>
                <button
                  className="notif-dismiss"
                  onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                  title="Dismiss"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {notifications.length > 0 && (
        <div style={{ textAlign: 'center', paddingBottom: '1.5rem' }}>
          <button
            className="notif-clear-btn"
            onClick={() => setNotifications([])}
          >
            Clear all notifications
          </button>
          <button
            className="notif-view-all"
            onClick={() => navigate('/settings/notifications')}
          >
            View all notifications →
          </button>
        </div>
      )}

      <style>{`
        .notif-root {
          background: var(--bg-base);
          min-height: 100vh;
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }
        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          gap: 1rem;
        }
        .notif-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .notif-badge {
          background: var(--accent);
          color: #fff;
          font-size: .7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
        }
        .notif-mark-all {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: .8rem;
          font-weight: 600;
          color: var(--accent);
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px 10px;
          border-radius: var(--r-md);
          transition: background .12s;
          white-space: nowrap;
        }
        .notif-mark-all:hover { background: var(--bg-hover); }
        .notif-mark-all:disabled { color: var(--text-muted); cursor: default; }

        .notif-filters {
          display: flex;
          gap: 6px;
          margin-bottom: 1.25rem;
        }
        .notif-filter-btn {
          padding: .35rem .9rem;
          border-radius: 999px;
          border: 1px solid var(--border-default);
          background: transparent;
          color: var(--text-secondary);
          font-size: .8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all .12s;
        }
        .notif-filter-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }

        .notif-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--r-xl);
          overflow: hidden;
          margin-bottom: 1.25rem;
        }
        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 3rem;
          color: var(--text-muted);
          font-size: .9rem;
        }
        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: background .12s;
          position: relative;
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: var(--bg-hover); }
        .notif-item--unread { background: var(--accent-glow, rgba(99,102,241,.04)); }

        .notif-icon-wrap {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .notif-content { flex: 1; min-width: 0; }
        .notif-item-title {
          font-size: .875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .notif-item-detail {
          font-size: .75rem;
          color: var(--text-muted);
          margin-bottom: 3px;
        }
        .notif-item-body {
          font-size: .8rem;
          color: var(--text-secondary);
          font-style: italic;
        }
        .notif-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
        }
        .notif-time {
          font-size: .72rem;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .notif-unread-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }
        .notif-dismiss {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--r-sm);
          opacity: 0;
          transition: opacity .12s, background .12s;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .notif-item:hover .notif-dismiss { opacity: 1; }
        .notif-dismiss:hover { background: var(--bg-hover); color: var(--text-primary); }

        .notif-clear-btn {
          font-size: .8rem;
          color: #ef4444;
          background: none;
          border: none;
          cursor: pointer;
          margin-right: 1rem;
          padding: 4px 8px;
          border-radius: var(--r-sm);
        }
        .notif-clear-btn:hover { background: rgba(239,68,68,.08); }
        .notif-view-all {
          font-size: .8rem;
          color: var(--accent);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--r-sm);
        }
        .notif-view-all:hover { background: var(--bg-hover); }
      `}</style>
    </div>
  );
}