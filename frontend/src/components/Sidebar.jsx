import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, Send, Hand } from 'lucide-react';

function ChatPanel({ messages, currentUserId, onSendChat }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    onSendChat(text.trim());
    setText('');
  };

  const fmt = (ts) => {
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div className="empty-state">No messages yet.<br />Start the conversation!</div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.senderId === currentUserId;
          // Resolve name: use senderName if available, fallback to 'Unknown'
          const displayName = msg.senderName || msg.userName || 'Unknown';
          const displayColor = msg.senderColor || msg.userColor || '#8b5cf6';

          return (
            <div key={msg.id || i} className={`chat-msg ${isOwn ? 'own' : ''}`}>
              <div className="chat-msg-header">
                <div
                  className="chat-msg-avatar"
                  style={{ background: displayColor, color: 'white' }}
                >
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
                <span className="chat-msg-sender" style={{ color: displayColor }}>
                  {displayName}
                  {isOwn && (
                    <span style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: '0.35rem' }}>(you)</span>
                  )}
                </span>
                <span className="chat-msg-time">{fmt(msg.timestamp)}</span>
              </div>
              <div className="chat-msg-body">
                {msg.content || msg.message || ''}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          id="chat-input"
          className="chat-input"
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
        />
        <button
          id="btn-send-chat"
          className="btn btn-primary btn-sm"
          onClick={send}
          disabled={!text.trim()}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

function UsersPanel({ users, raisedHands }) {
  return (
    <div className="users-list">
      {users.map(u => {
        const isHandRaised = raisedHands.includes(u.id);
        return (
          <div key={u.id} className="user-item">
            <div className="user-avatar" style={{ background: u.color, color: 'white' }}>
              {(u.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {u.name}
                {isHandRaised && (
                  <span title="Hand Raised" style={{ display: 'flex', alignItems: 'center', color: '#fbbf24' }}>
                    <Hand size={14} />
                  </span>
                )}
              </div>
              <div className="user-status">● Online</div>
            </div>
            {u.isYou && <span className="you-badge">You</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function Sidebar({ open, tab, setTab, messages, users, currentUserId, onSendChat, raisedHands = [] }) {
  return (
    <div className={`sidebar ${open ? '' : 'collapsed'}`}>
      <div className="sidebar-tabs">
        <button className={`sidebar-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
          <MessageSquare size={16} /> Chat
        </button>
        <button className={`sidebar-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <Users size={16} /> Users ({users.length})
        </button>
      </div>
      <div className="sidebar-content">
        {tab === 'chat' && (
          <ChatPanel messages={messages} currentUserId={currentUserId} onSendChat={onSendChat} />
        )}
        {tab === 'users' && (
          <UsersPanel users={users} raisedHands={raisedHands} />
        )}
      </div>
    </div>
  );
}