import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, Send } from 'lucide-react';

function ChatPanel({ messages, currentUserId, onSendChat }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    onSendChat(text.trim());
    setText('');
  };

  const fmt = (ts) => {
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:'0.75rem' }}>
      <div className="chat-messages" style={{ flex:1, overflowY:'auto' }}>
        {messages.length === 0 && <div className="empty-state">No messages yet.<br/>Start the conversation!</div>}
        {messages.map((msg, i) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div key={msg.id || i} className={`chat-msg ${isOwn ? 'own' : ''}`}>
              <div className="chat-msg-header">
                <div className="chat-msg-avatar" style={{ background: msg.senderColor || '#8b5cf6', color:'white' }}>
                  {(msg.senderName || 'U')[0].toUpperCase()}
                </div>
                <span className="chat-msg-sender" style={{ color: msg.senderColor || '#8b5cf6' }}>
                  {isOwn ? 'You' : msg.senderName}
                </span>
                <span className="chat-msg-time">{fmt(msg.timestamp)}</span>
              </div>
              <div className="chat-msg-body">{msg.content}</div>
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
        <button id="btn-send-chat" className="btn btn-primary btn-sm" onClick={send} disabled={!text.trim()}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

function UsersPanel({ users }) {
  return (
    <div className="users-list">
      {users.map(u => (
        <div key={u.id} className="user-item">
          <div className="user-avatar" style={{ background: u.color, color:'white' }}>
            {(u.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="user-name">{u.name}</div>
            <div className="user-status">● Online</div>
          </div>
          {u.isYou && <span className="you-badge">You</span>}
        </div>
      ))}
    </div>
  );
}

export default function Sidebar({ open, tab, setTab, messages, users, currentUserId, onSendChat }) {
  return (
    <div className={`sidebar ${open ? '' : 'collapsed'}`}>
      <div className="sidebar-tabs">
        <button className={`sidebar-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
          <MessageSquare size={16} />
          Chat
        </button>
        <button className={`sidebar-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <Users size={16} />
          Users ({users.length})
        </button>
      </div>
      <div className="sidebar-content">
        {tab === 'chat' && (
          <ChatPanel messages={messages} currentUserId={currentUserId} onSendChat={onSendChat} />
        )}
        {tab === 'users' && (
          <UsersPanel users={users} />
        )}
      </div>
    </div>
  );
}
