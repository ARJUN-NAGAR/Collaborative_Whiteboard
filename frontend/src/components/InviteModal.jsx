import { useState } from 'react';
import { X, Copy, Check, Link, Hash, Users } from 'lucide-react';
import { useToast } from './ToastSystem';

export default function InviteModal({ session, onClose }) {
  const toast = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Invite to "{session.name}"</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={15} /></button>
        </div>
        <p className="modal-subtitle">Share a link or room code to let others join this board in real time.</p>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link size={9} /> Share Link
          </div>
          <div className="invite-link-box">
            <span className="invite-link-text">{shareUrl}</span>
            <button className="btn btn-sm btn-secondary" onClick={copyLink} style={{ flexShrink: 0 }}>
              {copiedLink ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Hash size={9} /> Room Code
          </div>
          <div className="room-code-box">
            <div className="room-code">{roomCode}</div>
            <div className="room-code-label">Share this code to join without a link</div>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={copyCode}>
            {copiedCode ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Room Code</>}
          </button>
        </div>

        <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--bg-hover)', borderRadius: 'var(--r-md)', display: 'flex', gap: 7, alignItems: 'center' }}>
          <Users size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Anyone with the link or code can join and collaborate on this board.
          </p>
        </div>

        <div className="modal-actions">
          <button className="btn btn-sm btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
