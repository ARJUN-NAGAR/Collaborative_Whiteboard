import { useState, useEffect, useRef, useCallback } from 'react';
import { sessionAPI, chatAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from './ToastSystem';
import WhiteboardCanvas from './WhiteboardCanvas';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import ExportModal from './ExportModal';
import VideoOverlay from './VideoOverlay';
import RecordingControls from './RecordingControls';
import ZoomControls from './ZoomControls';
import TemplateLibrary from './TemplateLibrary';
import InviteModal from './InviteModal';
import { LogOut, Download, Users, UserPlus } from 'lucide-react';

export default function WhiteboardApp({ session, user, onLeave }) {
  /* ── Tool state ── */
  const [tool, setTool]               = useState('pen');
  const [color, setColor]             = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(3);

  /* ── Canvas elements ── */
  const [elements, setElements] = useState(() => session.elements || []);
  const elementsRef = useRef(elements);
  useEffect(() => { elementsRef.current = elements; }, [elements]);

  /* ── Undo / Redo ── */
  const historyRef = useRef({ past: [], future: [] });
  const [, forceHistoryRender] = useState(0);
  const bumpHistory = () => forceHistoryRender(n => n + 1);

  const saveSnapshot = useCallback(() => {
    historyRef.current.past.push([...elementsRef.current]);
    if (historyRef.current.past.length > 80) historyRef.current.past.shift();
    historyRef.current.future = [];
    bumpHistory();
  }, []);

  /* ── Remote users ── */
  const [remoteUsers, setRemoteUsers] = useState({});

  /* ── Raise Hand — local toggle ── */
  const [handRaised, setHandRaised] = useState(false);

  /* ── Chat & typing ── */
  const [messages, setMessages]     = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimers = useRef({});
  const [unreadCount, setUnreadCount] = useState(0);

  /* ── Sidebar ── */
  const [activePanel, setActivePanel] = useState(null); // 'chat' | 'users' | null

  /* ── Modals ── */
  const [showExport,    setShowExport]    = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInvite,    setShowInvite]    = useState(false);

  /* ── Connection ── */
  const [connected, setConnected] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState(session.status || 'ACTIVE');

  const canvasRef = useRef(null);
  const toast     = useToast();

  /* ── Current user role ── */
  const currentUserRole = session.participants?.find(
    p => String(p.userId) === String(user.id)
  )?.role || 'EDITOR';

  /* ── Load chat history ── */
  useEffect(() => {
    chatAPI.getHistory(session.id)
      .then(msgs => setMessages(msgs))
      .catch(() => {});
  }, [session.id]);

  /* ── Board events ── */
  const handleBoardEvent = useCallback((event) => {
    switch (event.type) {
      case 'ELEMENT_ADD':
        setElements(prev => [...prev, event.element]);
        break;
      case 'ELEMENT_UPDATE':
        setElements(prev => prev.map(e => e.id === event.element?.id ? event.element : e));
        break;
      case 'ELEMENT_DELETE':
        setElements(prev => prev.filter(e => e.id !== event.element?.id));
        break;
      case 'ELEMENTS_SYNC':
        if (String(event.userId) !== String(user.id) && Array.isArray(event.elements)) {
          setElements(event.elements);
        }
        break;
      case 'CLEAR':
        setElements([]);
        break;
      case 'CURSOR_MOVE':
        if (String(event.userId) !== String(user.id)) {
          setRemoteUsers(prev => ({
            ...prev,
            [event.userId]: {
              ...prev[event.userId],
              name: event.userName, color: event.userColor,
              x: event.cursorX, y: event.cursorY,
            },
          }));
        }
        break;
      case 'USER_JOIN':
        if (String(event.userId) !== String(user.id)) {
          setRemoteUsers(prev => ({
            ...prev,
            [event.userId]: { name: event.userName, color: event.userColor, x: 0, y: 0, handRaised: false },
          }));
          toast.info(`${event.userName} joined`);
        }
        break;
      case 'USER_LEAVE':
        setRemoteUsers(prev => { const n = { ...prev }; delete n[event.userId]; return n; });
        if (String(event.userId) !== String(user.id)) toast.info(`${event.userName} left`);
        break;
      case 'HAND_RAISE':
        // Toggle for remote users
        if (String(event.userId) !== String(user.id)) {
          setRemoteUsers(prev => {
            const u = prev[event.userId] || {};
            const nowRaised = !u.handRaised;
            if (nowRaised) toast.info(`✋ ${event.userName} raised their hand`);
            return { ...prev, [event.userId]: { ...u, handRaised: nowRaised } };
          });
        }
        break;
      case 'TYPING_START':
        if (String(event.userId) !== String(user.id) && event.userName) {
          setTypingUsers(prev => prev.includes(event.userName) ? prev : [...prev, event.userName]);
          clearTimeout(typingTimers.current[event.userId]);
          typingTimers.current[event.userId] = setTimeout(() => {
            setTypingUsers(prev => prev.filter(n => n !== event.userName));
          }, 3000);
        }
        break;
      case 'TYPING_STOP':
        if (String(event.userId) !== String(user.id)) {
          setTypingUsers(prev => prev.filter(n => n !== event.userName));
          clearTimeout(typingTimers.current[event.userId]);
        }
        break;
      case 'MEETING_PAUSED':
        setMeetingStatus('PAUSED');
        toast.warning('Host disconnected — meeting paused');
        break;
      case 'MEETING_ENDED':
        setMeetingStatus('ENDED');
        toast.error('This session has ended');
        break;
      default: break;
    }
  }, [user.id, toast]);

  /* ── Chat events — normalize + deduplicate ── */
  const handleChatEvent = useCallback((msg) => {
    const normalized = {
      id:          msg.id || crypto.randomUUID(),
      sessionId:   msg.sessionId,
      senderId:    msg.senderId || msg.userId,
      senderName:  msg.senderName  || msg.data?.senderName  || 'Unknown',
      senderColor: msg.senderColor || msg.data?.senderColor || '#8b5cf6',
      content:     msg.content     || msg.data?.content     || '',
      timestamp:   msg.timestamp   || new Date().toISOString(),
    };
    setMessages(prev => {
      if (normalized.id && prev.some(m => m.id === normalized.id)) return prev;
      return [...prev, normalized];
    });
    if (!activePanel || activePanel !== 'chat') {
      setUnreadCount(n => n + 1);
    }
  }, [activePanel]);

  // Clear unread when chat is opened
  useEffect(() => {
    if (activePanel === 'chat') setUnreadCount(0);
  }, [activePanel]);

  const [incomingSignals, setIncomingSignals] = useState(null);

  const handleBoardEventWithRTC = useCallback((event) => {
    if (event.type === 'WEBRTC_SIGNAL') { setIncomingSignals(event); return; }
    handleBoardEvent(event);
  }, [handleBoardEvent]);

  /* ── WebSocket ── */
  const {
    sendDraw, sendCursor, sendChat, sendJoin, sendLeave,
    sendHandRaise, sendWebrtcSignal, sendTyping, isConnected,
  } = useWebSocket({
    sessionId: session.id,
    onBoardEvent: handleBoardEventWithRTC,
    onChatEvent:  handleChatEvent,
    onConnectionChange: (connected) => {
      setConnected(connected);
      if (!connected) toast.warning('Connection lost — reconnecting…');
    },
  });

  // Sync connection state
  useEffect(() => { setConnected(isConnected); }, [isConnected]);

  /* ── Announce join ── */
  useEffect(() => {
    const t = setTimeout(() => {
      sendJoin({ type: 'USER_JOIN', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
      setConnected(true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Undo / Redo ── */
  const handleUndo = useCallback(() => {
    if (!historyRef.current.past.length) return;
    historyRef.current.future.push([...elementsRef.current]);
    const prev = historyRef.current.past.pop();
    setElements(prev); bumpHistory();
    sendDraw({ type: 'ELEMENTS_SYNC', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, elements: prev });
  }, [sendDraw, session, user]);

  const handleRedo = useCallback(() => {
    if (!historyRef.current.future.length) return;
    historyRef.current.past.push([...elementsRef.current]);
    const next = historyRef.current.future.pop();
    setElements(next); bumpHistory();
    sendDraw({ type: 'ELEMENTS_SYNC', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, elements: next });
  }, [sendDraw, session, user]);

  /* ── Element CRUD ── */
  const handleAddElement = useCallback((el) => {
    saveSnapshot();
    setElements(prev => [...prev, el]);
    sendDraw({ type: 'ELEMENT_ADD', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, element: el });
  }, [saveSnapshot, sendDraw, session, user]);

  const handleUpdateElement = useCallback((el) => {
    saveSnapshot();
    setElements(prev => prev.map(e => e.id === el.id ? el : e));
    sendDraw({ type: 'ELEMENT_UPDATE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, element: el });
  }, [saveSnapshot, sendDraw, session, user]);

  const handleDeleteElement = useCallback((elId) => {
    saveSnapshot();
    setElements(prev => prev.filter(e => e.id !== elId));
    sendDraw({ type: 'ELEMENT_DELETE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, element: { id: elId } });
  }, [saveSnapshot, sendDraw, session, user]);

  const handleClear = useCallback(() => {
    if (!window.confirm('Clear the entire board?')) return;
    saveSnapshot();
    setElements([]);
    sendDraw({ type: 'CLEAR', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
  }, [saveSnapshot, sendDraw, session, user]);

  /* ── Z-Index ── */
  const handleBringToFront = useCallback((id) => {
    saveSnapshot();
    setElements(prev => {
      const el = prev.find(e => e.id === id); if (!el) return prev;
      const next = [...prev.filter(e => e.id !== id), el];
      sendDraw({ type: 'ELEMENTS_SYNC', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, elements: next });
      return next;
    });
    bumpHistory();
  }, [saveSnapshot, sendDraw, session, user]);

  const handleSendToBack = useCallback((id) => {
    saveSnapshot();
    setElements(prev => {
      const el = prev.find(e => e.id === id); if (!el) return prev;
      const next = [el, ...prev.filter(e => e.id !== id)];
      sendDraw({ type: 'ELEMENTS_SYNC', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, elements: next });
      return next;
    });
    bumpHistory();
  }, [saveSnapshot, sendDraw, session, user]);

  /* ── Raise Hand — proper toggle ── */
  const handleHandRaise = useCallback(() => {
    const next = !handRaised;
    setHandRaised(next);
    sendHandRaise({ type: 'HAND_RAISE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
    toast.info(next ? '✋ Hand raised — others can see' : 'Hand lowered');
  }, [handRaised, sendHandRaise, session, user, toast]);

  /* ── Chat ── */
  const handleSendChat = useCallback((content) => {
    const optimistic = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      senderId: user.id,
      senderName: user.name,
      senderColor: user.color,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    sendChat({ sessionId: session.id, senderId: user.id, senderName: user.name, senderColor: user.color, content });
  }, [sendChat, session, user]);

  const handleChatTyping = useCallback(() => {
    sendTyping({ sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
  }, [sendTyping, session, user]);

  /* ── Moderation ── */
  const handleKickUser = useCallback(async (userId) => {
    if (!window.confirm('Remove this user from the session?')) return;
    try {
      await sessionAPI.removeUser(session.id, userId);
      toast.success('User removed');
    } catch { toast.error('Failed to remove user'); }
  }, [session, toast]);

  const handlePromoteUser = useCallback(async (userId, role) => {
    if (!window.confirm(`Promote to ${role}?`)) return;
    try {
      await sessionAPI.updateRole(session.id, userId, role);
      toast.success(`Role updated to ${role}`);
    } catch { toast.error('Failed to update role'); }
  }, [session, toast]);

  /* ── Leave ── */
  const handleLeave = () => {
    sendLeave({ type: 'USER_LEAVE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
    onLeave();
  };

  const allUsers = [
    { id: String(user.id), name: user.name, color: user.color, isYou: true, role: currentUserRole },
    ...Object.entries(remoteUsers).map(([id, u]) => ({
      id,
      ...u,
      isYou: false,
      role: session.participants?.find(p => String(p.userId) === String(id))?.role || 'EDITOR',
    })),
  ];

  const raisedHands = [
    ...(handRaised ? [String(user.id)] : []),
    ...Object.entries(remoteUsers).filter(([, u]) => u.handRaised).map(([id]) => id),
  ];

  return (
    <div className="whiteboard-app">
      {/* ─── Header ─────────────────────────────────────── */}
      <header className="whiteboard-header">
        <div className="header-left">
          <div className="header-logo">CollabBoard</div>
          <div className="session-name" title={session.name}>{session.name}</div>
        </div>

        <div className="header-center">
          <div className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
            <span className="conn-dot" />
            {connected ? 'Live' : 'Reconnecting…'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Users size={12} /> {allUsers.length}
          </span>
        </div>

        <div className="header-right">
          {/* Raise Hand toggle */}
          <button
            className={`btn btn-sm ${handRaised ? 'btn-secondary' : 'btn-ghost'}`}
            style={handRaised ? { borderColor: 'var(--amber)', color: 'var(--amber)', borderWidth: 1, borderStyle: 'solid' } : {}}
            onClick={handleHandRaise}
            title={handRaised ? 'Lower hand' : 'Raise hand'}
          >
            ✋ {handRaised ? 'Lower' : 'Raise'}
          </button>

          <button className="btn btn-sm btn-secondary" onClick={() => setShowInvite(true)}>
            <UserPlus size={12} /> Invite
          </button>

          <button className="btn btn-sm btn-secondary" onClick={() => setShowExport(true)}>
            <Download size={12} /> Export
          </button>

          <button className="btn btn-sm btn-danger" onClick={handleLeave}>
            <LogOut size={12} /> Leave
          </button>
        </div>
      </header>

      {/* ─── Body ──────────────────────────────────────── */}
      <div className="whiteboard-body">
        {/* Meeting paused / ended overlay */}
        {meetingStatus !== 'ACTIVE' && (
          <div className="meeting-overlay">
            <h2>{meetingStatus === 'PAUSED' ? '⏸ Host Disconnected' : '🔴 Session Ended'}</h2>
            <p>
              {meetingStatus === 'PAUSED'
                ? 'Waiting for the host to reconnect. Your work is safe.'
                : 'This collaboration session has been closed by the owner.'}
            </p>
            {meetingStatus === 'ENDED' && (
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleLeave}>
                Return to Lobby
              </button>
            )}
          </div>
        )}

        {/* Draggable video */}
        <VideoOverlay
          isHost={String(user.id) === String(session.createdBy)}
          currentUserId={user.id}
          remoteUsers={remoteUsers}
          sendWebrtcSignal={sendWebrtcSignal}
          incomingSignals={incomingSignals}
        />

        <div className="canvas-container">
          <div className="canvas-grid canvas-layer" style={{ pointerEvents: 'none' }} />

          {/* Recording controls — top-right of canvas */}
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
            onCursorMove={(x, y) =>
              sendCursor({ type: 'CURSOR_MOVE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color, cursorX: x, cursorY: y })
            }
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
            onOpenTemplates={() => setShowTemplates(true)}
            canUndo={historyRef.current.past.length > 0}
            canRedo={historyRef.current.future.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </div>

        {/* New rail + sliding panel sidebar */}
        <Sidebar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          messages={messages}
          users={allUsers}
          currentUserId={String(user.id)}
          currentUserRole={currentUserRole}
          onSendChat={handleSendChat}
          onTyping={handleChatTyping}
          raisedHands={raisedHands}
          typingUsers={typingUsers}
          unreadCount={unreadCount}
          onKickUser={handleKickUser}
          onPromoteUser={handlePromoteUser}
        />
      </div>

      {/* ─── Modals ── */}
      {showExport && (
        <ExportModal isOpen={showExport} canvasRef={canvasRef} sessionName={session.name} elements={elements} onClose={() => setShowExport(false)} />
      )}
      {showTemplates && (
        <TemplateLibrary onClose={() => setShowTemplates(false)} onAddElement={handleAddElement} userId={user.id} />
      )}
      {showInvite && (
        <InviteModal session={session} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}