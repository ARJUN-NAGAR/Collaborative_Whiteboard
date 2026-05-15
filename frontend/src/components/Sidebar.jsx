import { useEffect, useRef, useState } from 'react';
import { Hand, Layers, MessageSquare, Send, Settings, Users, X } from 'lucide-react';
import LayersPanel from './LayersPanel';

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function ChatPanel({ messages, currentUserId, onSendChat, onTyping, typingUsers = [] }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typingUsers]);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    onSendChat(content);
    setText('');
  };

  return (
    <div className="chat-wrap">
      <div className="chat-msgs" aria-live="polite">
        {messages.length === 0 && (
          <div className="empty-state">No messages yet.<br />Start the conversation.</div>
        )}
        {messages.map((msg, index) => {
          const senderId = String(msg.senderId || msg.userId || '');
          const isOwn = senderId === String(currentUserId);
          const name = msg.senderName || msg.userName || 'Unknown';
          const color = msg.senderColor || msg.userColor || '#4f46e5';
          const content = msg.content || msg.message || '';

          return (
            <div key={msg.id || `${senderId}-${index}`} className={`msg-group ${isOwn ? 'own' : ''}`}>
              {!isOwn && (
                <div className="msg-group-header">
                  <div className="msg-avatar" style={{ background: color }}>{name[0]?.toUpperCase() || 'U'}</div>
                  <span className="msg-sender" style={{ color }}>{name}</span>
                  <span className="msg-time">{formatTime(msg.timestamp)}</span>
                </div>
              )}
              <div className="msg-bubble">{content}</div>
              {isOwn && <div className="msg-own-time">{formatTime(msg.timestamp)}</div>}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="typing-row">
        {typingUsers.length > 0 && (
          <>
            <span>{typingUsers.join(', ')} typing</span>
            <span className="typing-dots"><span /><span /><span /></span>
          </>
        )}
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          rows={1}
          placeholder="Message the board"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button className="tool-btn active" onClick={send} disabled={!text.trim()} title="Send message">
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

function UsersPanel({ users, raisedHands, currentUserRole, onKickUser, onPromoteUser }) {
  return (
    <div className="users-list">
      {users.map((user) => {
        const role = (user.role || 'EDITOR').toLowerCase();
        const canModerate = !user.isYou && ['OWNER', 'ADMIN'].includes(currentUserRole) && user.role !== 'OWNER';

        return (
          <div key={user.id} className="user-row">
            <div className="user-av" style={{ background: user.color || '#4f46e5' }}>
              {(user.name || '?')[0].toUpperCase()}
              <span className="user-av-dot" />
            </div>
            <div className="user-info">
              <div className="user-name-row">
                <span>{user.name}</span>
                {raisedHands.includes(user.id) && <Hand className="hand-wave" size={14} />}
                {user.isYou && <span className="you-chip">You</span>}
              </div>
              <div className="user-online">
                <span className={`user-role-tag ${role}`}>{user.role || 'EDITOR'}</span>
                Online
              </div>
            </div>
            {canModerate && (
              <div style={{ display: 'flex', gap: 4 }}>
                {currentUserRole === 'OWNER' && user.role !== 'ADMIN' && (
                  <button className="btn btn-xs btn-secondary" onClick={() => onPromoteUser(user.id, 'ADMIN')}>Admin</button>
                )}
                <button className="btn btn-xs btn-danger" onClick={() => onKickUser(user.id)}>Kick</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Sidebar({
  activePanel,
  setActivePanel,
  messages,
  users,
  currentUserId,
  currentUserRole,
  onSendChat,
  onTyping,
  elements = [],
  selectedIds = new Set(),
  onSelectLayer = () => {},
  onToggleLayerHidden = () => {},
  onToggleLayerLocked = () => {},
  raisedHands = [],
  typingUsers = [],
  unreadCount = 0,
  onKickUser,
  onPromoteUser
}) {
  const open = Boolean(activePanel);
  const title = activePanel === 'chat' ? 'Chat' : activePanel === 'users' ? 'Participants' : 'Layers';

  return (
    <aside className="sidebar-shell" aria-label="Collaboration tools">
      <div className={`sidebar-panel ${open ? 'open' : ''}`}>
        {open && (
          <>
            <div className="panel-header">
              <div className="panel-title">{title}</div>
              <button className="tool-btn" onClick={() => setActivePanel(null)} title="Close panel">
                <X size={15} />
              </button>
            </div>
            <div className="panel-body">
              {activePanel === 'chat' && (
                <ChatPanel
                  messages={messages}
                  currentUserId={currentUserId}
                  onSendChat={onSendChat}
                  onTyping={onTyping}
                  typingUsers={typingUsers}
                />
              )}
              {activePanel === 'users' && (
                <UsersPanel
                  users={users}
                  raisedHands={raisedHands}
                  currentUserRole={currentUserRole}
                  onKickUser={onKickUser}
                  onPromoteUser={onPromoteUser}
                />
              )}
              {activePanel === 'layers' && (
                <LayersPanel
                  elements={elements}
                  selectedIds={selectedIds}
                  onSelect={onSelectLayer}
                  onToggleHidden={onToggleLayerHidden}
                  onToggleLocked={onToggleLayerLocked}
                />
              )}
            </div>
          </>
        )}
      </div>

      <nav className="sidebar-rail">
        <button
          className={`rail-btn ${activePanel === 'chat' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
          title="Chat"
        >
          <MessageSquare size={17} />
          {unreadCount > 0 && <span className="rail-badge">{unreadCount}</span>}
        </button>
        <button
          className={`rail-btn ${activePanel === 'users' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'users' ? null : 'users')}
          title="Participants"
        >
          <Users size={17} />
        </button>
        <button
          className={`rail-btn ${activePanel === 'layers' ? 'active' : ''}`}
          onClick={() => setActivePanel(activePanel === 'layers' ? null : 'layers')}
          title="Layers"
        >
          <Layers size={17} />
        </button>
        <div className="rail-sep" />
        <button className="rail-btn" title="Board settings">
          <Settings size={17} />
        </button>
      </nav>
    </aside>
  );
}
