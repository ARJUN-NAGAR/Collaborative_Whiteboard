import { useState, useEffect, useRef } from 'react';
import { sessionAPI, chatAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import WhiteboardCanvas from './WhiteboardCanvas';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import ExportModal from './ExportModal';
import { LogOut, Download, Users, PanelRight, Wifi, WifiOff, Copy, Check } from 'lucide-react';

export default function WhiteboardApp({ session, user, onLeave }) {
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [elements, setElements] = useState(() => {
    try { return JSON.parse(session.elementsJson || '[]'); } catch { return []; }
  });
  const [remoteUsers, setRemoteUsers] = useState({});
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chat');
  const [showExport, setShowExport] = useState(false);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Load chat history
  useEffect(() => {
    chatAPI.getHistory(session.id).then(msgs => {
      setMessages(msgs.map(m => ({ ...m, timestamp: m.timestamp })));
    }).catch(() => {});
  }, [session.id]);

  const handleBoardEvent = (event) => {
    switch (event.type) {
      case 'ELEMENT_ADD':
        setElements(prev => [...prev, event.element]);
        break;
      case 'ELEMENT_DELETE':
        setElements(prev => prev.filter(el => el.id !== event.element?.id));
        break;
      case 'CLEAR':
        setElements([]);
        break;
      case 'CURSOR_MOVE':
        if (event.userId !== user.id) {
          setRemoteUsers(prev => ({
            ...prev,
            [event.userId]: { ...prev[event.userId], name: event.userName, color: event.userColor, x: event.cursorX, y: event.cursorY }
          }));
        }
        break;
      case 'USER_JOIN':
        if (event.userId !== user.id) {
          setRemoteUsers(prev => ({ ...prev, [event.userId]: { name: event.userName, color: event.userColor, x: 0, y: 0 } }));
          setConnected(true);
        }
        break;
      case 'USER_LEAVE':
        setRemoteUsers(prev => { const n = { ...prev }; delete n[event.userId]; return n; });
        break;
      default: break;
    }
  };

  const handleChatEvent = (msg) => {
    setMessages(prev => [...prev, msg]);
  };

  const { sendDraw, sendCursor, sendChat, sendJoin, sendLeave } = useWebSocket({
    sessionId: session.id,
    onBoardEvent: handleBoardEvent,
    onChatEvent: handleChatEvent,
  });

  // Announce join after short delay (WebSocket connection needs time)
  useEffect(() => {
    const timer = setTimeout(() => {
      sendJoin({ type: 'USER_JOIN', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
      setConnected(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Auto-save elements every 10s
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      sessionAPI.updateElements(session.id, JSON.stringify(elements)).catch(() => {});
    }, 10000);
    return () => clearTimeout(saveTimerRef.current);
  }, [elements]);

  const handleAddElement = (el) => {
    setElements(prev => [...prev, el]);
    sendDraw({ type: 'ELEMENT_ADD', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, element: el });
  };

  const handleClear = () => {
    setElements([]);
    sendDraw({ type: 'CLEAR', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
  };

  const handleCursorMove = (x, y) => {
    sendCursor({ type: 'CURSOR_MOVE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, cursorX: x, cursorY: y });
  };

  const handleSendChat = (content) => {
    sendChat({ sessionId: session.id, senderId: user.id, senderName: user.name, senderColor: user.color, content });
  };

  const handleLeave = () => {
    sendLeave({ type: 'USER_LEAVE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
    sessionAPI.updateElements(session.id, JSON.stringify(elements)).catch(() => {});
    onLeave();
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(session.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allUsers = [
    { id: user.id, name: user.name, color: user.color, isYou: true },
    ...Object.entries(remoteUsers).map(([id, u]) => ({ id, ...u, isYou: false }))
  ];

  return (
    <div className="whiteboard-app">
      {/* Header */}
      <header className="whiteboard-header">
        <div className="header-left">
          <div className="header-logo">CollabBoard</div>
          <div className="session-name" title={session.name}>{session.name}</div>
          <button className="btn btn-secondary btn-sm" onClick={copySessionId} title="Copy session ID">
            {copied ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> {session.id.slice(0,8)}…</>}
          </button>
        </div>

        <div className="header-center" style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>
          <Users size={14} /> &nbsp;{allUsers.length} online
        </div>

        <div className="header-right">
          <div className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
            <span className="conn-dot" />
            {connected ? 'Live' : 'Connecting…'}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowExport(true)}>
            <Download size={14}/> Export
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setSidebarOpen(o => !o)}>
            <PanelRight size={14}/>
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleLeave}>
            <LogOut size={14}/> Leave
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="whiteboard-body">
        <div className="canvas-container">
          <div className="canvas-grid canvas-layer" style={{ pointerEvents:'none' }} />
          <WhiteboardCanvas
            ref={canvasRef}
            elements={elements}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            user={user}
            remoteUsers={remoteUsers}
            onAddElement={handleAddElement}
            onCursorMove={handleCursorMove}
            onClear={handleClear}
          />
          <Toolbar
            tool={tool} setTool={setTool}
            color={color} setColor={setColor}
            strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
            onClear={handleClear}
          />
        </div>

        <Sidebar
          open={sidebarOpen}
          tab={sidebarTab}
          setTab={setSidebarTab}
          messages={messages}
          users={allUsers}
          currentUserId={user.id}
          onSendChat={handleSendChat}
        />
      </div>

      {showExport && (
        <ExportModal
          canvasRef={canvasRef}
          sessionName={session.name}
          elements={elements}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
