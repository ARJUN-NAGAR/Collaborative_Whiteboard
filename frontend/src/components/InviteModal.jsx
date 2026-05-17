import { useState } from 'react';
import { X, Copy, Check, Link, Hash, Users, ChevronDown, Globe } from 'lucide-react';
import { useToast } from './ToastSystem';

const ROLE_OPTIONS = [
  { value: 'edit',    label: 'Can edit' },
  { value: 'comment', label: 'Can comment' },
  { value: 'view',    label: 'Can view' },
];

function RoleDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = ROLE_OPTIONS.find(r => r.value === value) || ROLE_OPTIONS[0];
  return (
    <div style={{ position: 'relative' }}>
      <button
        className="invite-role-btn"
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        {current.label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="invite-role-dropdown">
          {ROLE_OPTIONS.map(r => (
            <button
              key={r.value}
              className={`invite-role-option${value === r.value ? ' active' : ''}`}
              onClick={() => { onChange(r.value); setOpen(false); }}
            >
              {r.label}
              {value === r.value && <Check size={11} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Existing collaborators mock
const EXISTING = [
  { id: '1', name: 'Alex Tho', email: 'alex@example.com', role: 'edit',    avatar: 'A', color: '#8b5cf6', isOwner: true },
  { id: '2', name: 'Emma',     email: 'emma@example.com', role: 'edit',    avatar: 'E', color: '#06b6d4' },
  { id: '3', name: 'Liam',     email: 'liam@example.com', role: 'comment', avatar: 'L', color: '#f59e0b' },
  { id: '4', name: 'Sophie',   email: 'sophie@example.com', role: 'view', avatar: 'S', color: '#10b981' },
];

export default function InviteModal({ session, onClose }) {
  const toast = useToast();
  const [emailInput, setEmailInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inviteRole, setInviteRole] = useState('edit');
  const [collaborators, setCollaborators] = useState(EXISTING);
  const [linkRole, setLinkRole] = useState('view');

  const roomCode = session.shareCode || session.id?.slice(0, 6).toUpperCase() || '------';
  const shareUrl = `${window.location.origin}${window.location.pathname}?shareCode=${roomCode}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const email = emailInput.trim();
    const name = email.split('@')[0];
    const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f97316'];
    setCollaborators(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        email,
        role: inviteRole,
        avatar: name[0].toUpperCase(),
        color: colors[prev.length % colors.length],
      },
    ]);
    toast.success(`Invite sent to ${email}`);
    setEmailInput('');
  };

  const updateRole = (id, role) => {
    setCollaborators(cs => cs.map(c => c.id === id ? { ...c, role } : c));
  };

  const removeCollab = (id) => {
    setCollaborators(cs => cs.filter(c => c.id !== id));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="invite-modal-inner" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Share &ldquo;{session.name}&rdquo;</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Invite by email */}
        <form className="invite-email-row" onSubmit={handleInvite}>
          <input
            className="invite-email-input"
            type="email"
            placeholder="Add people or email…"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
          />
          <RoleDropdown value={inviteRole} onChange={setInviteRole} />
          <button type="submit" className="invite-send-btn">Invite</button>
        </form>

        {/* Collaborator list */}
        <div className="invite-collab-list">
          {collaborators.map(c => (
            <div key={c.id} className="invite-collab-row">
              <div className="invite-collab-avatar" style={{ background: c.color }}>
                {c.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="invite-collab-name">
                  {c.name}
                  {c.isOwner && <span className="invite-owner-badge">Owner</span>}
                </div>
                <div className="invite-collab-email">{c.email}</div>
              </div>
              {c.isOwner ? (
                <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', paddingRight: 4 }}>Owner</span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RoleDropdown value={c.role} onChange={role => updateRole(c.id, role)} />
                  <button
                    className="invite-remove-btn"
                    onClick={() => removeCollab(c.id)}
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="invite-divider" />

        {/* Share link */}
        <div className="invite-section-label">
          <Globe size={11} /> Share link
        </div>
        <div className="invite-link-box">
          <span className="invite-link-text">{shareUrl}</span>
          <RoleDropdown value={linkRole} onChange={setLinkRole} />
          <button className="btn btn-sm btn-secondary" onClick={copyLink} style={{ flexShrink: 0 }}>
            {copiedLink ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy link</>}
          </button>
        </div>

        {/* Room code */}
        <div className="invite-section-label" style={{ marginTop: 12 }}>
          <Hash size={11} /> Room code
        </div>
        <div className="room-code-box">
          <div className="room-code">{roomCode}</div>
          <div className="room-code-label">Share this code to join without a link</div>
        </div>
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 6 }} onClick={copyCode}>
          {copiedCode ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Room Code</>}
        </button>

        {/* Footer note */}
        <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--bg-hover)', borderRadius: 'var(--r-md)', display: 'flex', gap: 7, alignItems: 'center' }}>
          <Users size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Anyone with the link — <strong>{linkRole === 'edit' ? 'Can edit' : linkRole === 'comment' ? 'Can comment' : 'Can view'}</strong>
          </p>
          <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto', fontSize: '.7rem' }}>
            Copy link
          </button>
        </div>

        <div className="modal-actions">
          <button className="btn btn-sm btn-secondary" onClick={onClose}>Done</button>
        </div>
      </div>

      <style>{`
        .invite-modal-inner {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--r-xl);
          padding: 1.5rem;
          width: 100%;
          max-width: 480px;
          box-shadow: var(--shadow-lg);
        }

        .invite-email-row {
          display: flex;
          gap: 6px;
          margin-bottom: 1rem;
          align-items: center;
        }
        .invite-email-input {
          flex: 1;
          background: var(--bg-base);
          border: 1px solid var(--border-default);
          border-radius: var(--r-md);
          padding: .5rem .85rem;
          color: var(--text-primary);
          font-size: .875rem;
          font-family: var(--font);
          outline: none;
        }
        .invite-email-input:focus { border-color: var(--accent); }
        .invite-send-btn {
          padding: .5rem .9rem;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: var(--r-md);
          font-size: .8rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .invite-role-btn {
          display: flex; align-items: center; gap: 4px;
          padding: .45rem .75rem;
          background: var(--bg-hover);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          border-radius: var(--r-md);
          font-size: .78rem; font-weight: 500;
          cursor: pointer; white-space: nowrap;
        }
        .invite-role-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--r-md);
          box-shadow: var(--shadow-lg);
          z-index: 200;
          min-width: 130px;
          overflow: hidden;
        }
        .invite-role-option {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px;
          padding: .5rem .85rem;
          background: none; border: none;
          font-size: .8rem; font-weight: 500;
          color: var(--text-primary); cursor: pointer;
          width: 100%; text-align: left;
          transition: background .1s;
        }
        .invite-role-option:hover { background: var(--bg-hover); }
        .invite-role-option.active { color: var(--accent); }

        .invite-collab-list {
          display: flex; flex-direction: column; gap: 0;
          margin-bottom: .5rem;
        }
        .invite-collab-row {
          display: flex; align-items: center; gap: 10px;
          padding: .6rem 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .invite-collab-row:last-child { border-bottom: none; }
        .invite-collab-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          color: #fff; display: flex; align-items: center;
          justify-content: center;
          font-size: .75rem; font-weight: 700; flex-shrink: 0;
        }
        .invite-collab-name {
          font-size: .85rem; font-weight: 600;
          color: var(--text-primary);
          display: flex; align-items: center; gap: 6px;
        }
        .invite-collab-email { font-size: .72rem; color: var(--text-muted); }
        .invite-owner-badge {
          font-size: .65rem; font-weight: 700;
          background: rgba(99,102,241,.12); color: var(--accent);
          padding: 1px 7px; border-radius: 999px;
        }
        .invite-remove-btn {
          width: 22px; height: 22px;
          border-radius: var(--r-sm); border: none;
          background: none; color: var(--text-muted);
          cursor: pointer; display: flex;
          align-items: center; justify-content: center;
        }
        .invite-remove-btn:hover { background: var(--bg-hover); color: #ef4444; }

        .invite-divider { height: 1px; background: var(--border-subtle); margin: .75rem 0; }
        .invite-section-label {
          display: flex; align-items: center; gap: 4px;
          font-size: .68rem; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .06em;
          margin-bottom: 6px;
        }
        .invite-link-box {
          display: flex; align-items: center; gap: 6px;
          background: var(--bg-base);
          border: 1px solid var(--border-default);
          border-radius: var(--r-md);
          padding: 6px 10px;
        }
        .invite-link-text {
          flex: 1; font-size: .78rem;
          color: var(--text-muted);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}