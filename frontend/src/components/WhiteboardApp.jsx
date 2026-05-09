import { useState, useEffect, useRef, useCallback } from 'react';
import { sessionAPI, chatAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import WhiteboardCanvas from './WhiteboardCanvas';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import ExportModal from './ExportModal';
import VideoOverlay from './VideoOverlay';
import RecordingControls from './RecordingControls';
import ZoomControls from './ZoomControls';
import TemplateLibrary from './TemplateLibrary';
import { LogOut, Download, Users, PanelRight, Copy, Check } from 'lucide-react';

export default function WhiteboardApp({ session, user, onLeave }) {
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [elements, setElements] = useState(() => session.elements || []);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chat');
  const [showExport, setShowExport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  // ── Undo / Redo history ──────────────────────────────────────────────────
  const historyRef = useRef({ past: [], future: [] });
  const elementsRef = useRef(elements);
  useEffect(() => { elementsRef.current = elements; }, [elements]);

  const saveSnapshot = useCallback(() => {
    historyRef.current.past.push([...elementsRef.current]);
    if (historyRef.current.past.length > 60) historyRef.current.past.shift();
    historyRef.current.future = [];
  }, []);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;
  // We need a state tick to re-render toolbar after undo/redo
  const [historyTick, setHistoryTick] = useState(0);

  // Load chat history
  useEffect(() => {
    chatAPI.getHistory(session.id).then(msgs => {
      setMessages(msgs.map(m => ({ ...m, timestamp: m.timestamp })));
    }).catch(() => {});
  }, [session.id]);

  // ── Board event handler ──────────────────────────────────────────────────
  const handleBoardEvent = (event) => {
    switch (event.type) {
      case 'ELEMENT_ADD':
        setElements(prev => [...prev, event.element]);
        break;
      case 'ELEMENT_UPDATE':
        setElements(prev => prev.map(e => e.id === event.element?.id ? event.element : e));
        break;
      case 'ELEMENT_DELETE':
        setElements(prev => prev.filter(el => el.id !== event.element?.id));
        break;
      case 'ELEMENTS_SYNC':
        // Full state sync from undo/redo broadcast
        if (event.userId !== user.id && Array.isArray(event.elements)) {
          setElements(event.elements);
        }
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
      case 'HAND_RAISE':
        if (event.userId !== user.id) {
          setRemoteUsers(prev => ({ ...prev, [event.userId]: { ...prev[event.userId], handRaised: true } }));
          setTimeout(() => {
            setRemoteUsers(prev => {
              if (!prev[event.userId]) return prev;
              return { ...prev, [event.userId]: { ...prev[event.userId], handRaised: false } };
            });
          }, 5000);
        }
        break;
      default: break;
    }
  };

  // ── Chat event handler — normalize WebSocket message shape ───────────────
  const handleChatEvent = (msg) => {
    const normalized = {
      id: msg.id || crypto.randomUUID(),
      sessionId: msg.sessionId,
      // senderId can come from top-level (via @JsonAnyGetter) or as userId
      senderId: msg.senderId || msg.userId,
      senderName: msg.senderName || msg.data?.senderName || 'Unknown',
      senderColor: msg.senderColor || msg.data?.senderColor || '#8b5cf6',
      content: msg.content || msg.data?.content || '',
      timestamp: msg.timestamp || new Date().toISOString(),
    };
    setMessages(prev => {
      // Deduplicate: if we already have a message with this id, skip
      if (normalized.id && prev.some(m => m.id === normalized.id)) return prev;
      return [...prev, normalized];
    });
  };

  const [incomingSignals, setIncomingSignals] = useState(null);

  const handleBoardEventWithWebRTC = (event) => {
    if (event.type === 'WEBRTC_SIGNAL') { setIncomingSignals(event); return; }
    handleBoardEvent(event);
  };

  const { sendDraw, sendCursor, sendChat, sendJoin, sendLeave, sendHandRaise, sendWebrtcSignal } = useWebSocket({
    sessionId: session.id,
    onBoardEvent: handleBoardEventWithWebRTC,
    onChatEvent: handleChatEvent,
  });

  // Announce join
  useEffect(() => {
    const timer = setTimeout(() => {
      sendJoin({ type: 'USER_JOIN', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
      setConnected(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // ── Undo / Redo ──────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (historyRef.current.past.length === 0) return;
    historyRef.current.future.push([...elementsRef.current]);
    const prev = historyRef.current.past.pop();
    setElements(prev);
    setHistoryTick(t => t + 1);
    sendDraw({ type: 'ELEMENTS_SYNC', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, elements: prev });
  }, [sendDraw, session, user]);

  const handleRedo = useCallback(() => {
    if (historyRef.current.future.length === 0) return;
    historyRef.current.past.push([...elementsRef.current]);
    const next = historyRef.current.future.pop();
    setElements(next);
    setHistoryTick(t => t + 1);
    sendDraw({ type: 'ELEMENTS_SYNC', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, elements: next });
  }, [sendDraw, session, user]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

  // ── Element handlers (all save to undo history) ──────────────────────────
  const handleAddElement = useCallback((el) => {
    saveSnapshot();
    setElements(prev => [...prev, el]);
    setHistoryTick(t => t + 1);
    sendDraw({ type: 'ELEMENT_ADD', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, element: el });
  }, [saveSnapshot, sendDraw, session, user]);

  const handleUpdateElement = useCallback((el) => {
    saveSnapshot();
    setElements(prev => prev.map(e => e.id === el.id ? el : e));
    setHistoryTick(t => t + 1);
    sendDraw({ type: 'ELEMENT_UPDATE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, element: el });
  }, [saveSnapshot, sendDraw, session, user]);

  const handleDeleteElement = useCallback((elId) => {
    saveSnapshot();
    setElements(prev => prev.filter(e => e.id !== elId));
    setHistoryTick(t => t + 1);
    sendDraw({ type: 'ELEMENT_DELETE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, element: { id: elId } });
  }, [saveSnapshot, sendDraw, session, user]);

  const handleClear = useCallback(() => {
    saveSnapshot();
    setElements([]);
    setHistoryTick(t => t + 1);
    sendDraw({ type: 'CLEAR', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
  }, [saveSnapshot, sendDraw, session, user]);

  // ── Z-Index controls ─────────────────────────────────────────────────────
  const handleBringToFront = useCallback((id) => {
    saveSnapshot();
    setElements(prev => {
      const el = prev.find(e => e.id === id);
      if (!el) return prev;
      const rest = prev.filter(e => e.id !== id);
      const next = [...rest, el];
      sendDraw({ type: 'ELEMENTS_SYNC', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, elements: next });
      return next;
    });
    setHistoryTick(t => t + 1);
  }, [saveSnapshot, sendDraw, session, user]);

  const handleSendToBack = useCallback((id) => {
    saveSnapshot();
    setElements(prev => {
      const el = prev.find(e => e.id === id);
      if (!el) return prev;
      const rest = prev.filter(e => e.id !== id);
      const next = [el, ...rest];
      sendDraw({ type: 'ELEMENTS_SYNC', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, elements: next });
      return next;
    });
    setHistoryTick(t => t + 1);
  }, [saveSnapshot, sendDraw, session, user]);

  const handleCursorMove = (x, y) => {
    sendCursor({ type: 'CURSOR_MOVE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, cursorX: x, cursorY: y });
  };

  const handleSendChat = (content) => {
    sendChat({ sessionId: session.id, senderId: user.id, senderName: user.name, senderColor: user.color, content });
  };

  const handleLeave = () => {
    sendLeave({ type: 'USER_LEAVE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
    onLeave();
  };

  const handleHandRaiseClick = () => {
    sendHandRaise({ type: 'HAND_RAISE', sessionId: session.id, userId: user.id, userName: user.name });
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
      {/* ── Header ── */}
      <header className="whiteboard-header">
        <div className="header-left">
          <div className="header-logo">CollabBoard</div>
          <div className="session-name" title={session.name}>{session.name}</div>
          <button className="btn btn-secondary btn-sm" onClick={copySessionId} title="Copy session ID">
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> {session.id.slice(0, 8)}…</>}
          </button>
        </div>

        <div className="header-center" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={14} /> {allUsers.length} online
        </div>

        <div className="header-right">
          <div className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
            <span className="conn-dot" />
            {connected ? 'Live' : 'Connecting…'}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleHandRaiseClick} title="Raise Hand">✋</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowExport(true)}>
            <Download size={14} /> Export
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setSidebarOpen(o => !o)}>
            <PanelRight size={14} />
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleLeave}>
            <LogOut size={14} /> Leave
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="whiteboard-body">
        {/* Video overlay at body level — needs position: relative on whiteboard-body */}
        <VideoOverlay
          isHost={user.id === session.createdBy}
          currentUserId={user.id}
          remoteUsers={remoteUsers}
          sendWebrtcSignal={sendWebrtcSignal}
          incomingSignals={incomingSignals}
        />

        <div className="canvas-container">
          <div className="canvas-grid canvas-layer" style={{ pointerEvents: 'none' }} />

          {/* RecordingControls now INSIDE canvas-container (has position:relative) */}
          <RecordingControls canvasRef={{ current: canvasRef.current?.getCanvas?.() }} />

          <WhiteboardCanvas
            ref={canvasRef}
            elements={elements}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            user={user}
            remoteUsers={remoteUsers}
            onAddElement={handleAddElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onCursorMove={handleCursorMove}
            onClear={handleClear}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
          />

          <ZoomControls canvasRef={canvasRef} />

          <Toolbar
            tool={tool} setTool={setTool}
            color={color} setColor={setColor}
            strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
            onClear={handleClear}
            sendHandRaise={sendHandRaise}
            sessionId={session.id}
            user={user}
            onOpenTemplates={() => setShowTemplates(true)}
            canUndo={historyRef.current.past.length > 0}
            canRedo={historyRef.current.future.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
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
          raisedHands={Object.entries(remoteUsers).filter(([, u]) => u.handRaised).map(([id]) => id)}
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
      {showTemplates && (
        <TemplateLibrary
          onClose={() => setShowTemplates(false)}
          onAddElement={handleAddElement}
          userId={user.id}
        />
      )}
    </div>
  );
}