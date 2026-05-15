import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../services/api';
import { useToast } from './ToastSystem';

import { WhiteboardProvider, useWhiteboard } from '../contexts/WhiteboardContext';
import { ToolProvider } from '../contexts/ToolContext';
import { CollaborationProvider, useCollaboration } from '../contexts/CollaborationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAutoSave } from '../hooks/useAutoSave';

import WhiteboardCanvas from './WhiteboardCanvas';
import Toolbar from './Toolbar';
import BottomToolbar from './BottomToolbar';
import Sidebar from './Sidebar';
import ExportModal from './ExportModal';
import VideoOverlay from './VideoOverlay';
import RecordingControls from './RecordingControls';
import TemplateLibrary from './TemplateLibrary';
import InviteModal from './InviteModal';
import { Download, Hand, LayoutTemplate, LogOut, Moon, Sun } from 'lucide-react';

function WhiteboardAppInner({ session, user, onLeave }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  // Modals
  const [showExport, setShowExport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  const canvasRef = useRef(null);

  const {
    remoteUsers,
    messages,
    typingUsers,
    incomingSignals,
    isConnected,
    meetingStatus,
    localHandRaised,
    toggleHandRaise,
    sendWebrtcSignal,
    sendChat,
    sendTyping,
    sendJoin,
    sendLeave,
    publishElementCreate,
    publishElementUpdate
  } = useCollaboration();

  const {
    setElements,
    elements,
    selectedIds,
    setSelectedIds,
    updateElement,
    addElement,
    saveSnapshot
  } = useWhiteboard();
  const { status: saveStatus, lastSavedAt } = useAutoSave({ sessionId: session.id, elements });

  // Load initial session elements
  useEffect(() => {
    if (session.elements) {
      setElements(session.elements);
    }
  }, [session.elements, setElements]);

  const currentUserRole = session.participants?.find(
    p => String(p.userId) === String(user.id)
  )?.role || 'EDITOR';

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

  const handleLeave = () => {
    sendLeave({ type: 'USER_LEAVE', sessionId: session.id, userId: user.id, userName: user.name, userColor: user.color });
    onLeave();
  };

  const handleInsertTemplateElement = useCallback((element) => {
    addElement(element);
    publishElementCreate(element);
  }, [addElement, publishElementCreate]);

  const toggleLayerFlag = useCallback((element, key) => {
    const next = { ...element, [key]: !element[key] };
    saveSnapshot();
    updateElement(next);
    publishElementUpdate(next);
  }, [publishElementUpdate, saveSnapshot, updateElement]);

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
    ...(localHandRaised ? [String(user.id)] : []),
    ...Object.entries(remoteUsers).filter(([, u]) => u.handRaised).map(([id]) => id),
  ];

  return (
    <div className="whiteboard-app">
      {/* ─── Header ─────────────────────────────────────── */}
      <header className="whiteboard-header">
        <div className="header-left">
          <div className="header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>
            </div>
            <span>Boardly</span>
          </div>
          <div className="session-name" title={session.name}>{session.name}</div>
        </div>

        <div className="header-center">
          <div className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="conn-dot" />
            {isConnected ? 'Live' : 'Reconnecting…'}
          </div>
          <div className={`save-badge ${saveStatus}`}>
            {saveStatus === 'saving'
              ? 'Saving'
              : saveStatus === 'error'
                ? 'Save failed'
                : lastSavedAt
                  ? 'Saved'
                  : 'Ready'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 16 }}>
             {allUsers.slice(0, 4).map((u, i) => (
                <div key={u.id} style={{ width: 28, height: 28, borderRadius: '50%', background: u.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, border: '2px solid var(--bg-surface)', marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i }} title={u.name}>
                   {u.name.charAt(0).toUpperCase()}
                </div>
             ))}
             {allUsers.length > 4 && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-hover)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, border: '2px solid var(--bg-surface)', marginLeft: -8 }}>
                   +{allUsers.length - 4}
                </div>
             )}
          </div>
        </div>

        <div className="header-right">
          <button
            className={`btn btn-sm ${localHandRaised ? 'btn-secondary' : 'btn-ghost'}`}
            style={localHandRaised ? { borderColor: 'var(--amber)', color: 'var(--amber)', borderWidth: 1, borderStyle: 'solid' } : {}}
            onClick={toggleHandRaise}
            title={localHandRaised ? 'Lower hand' : 'Raise hand'}
          >
            <Hand size={15} />
          </button>

          <button className="btn btn-sm btn-primary" onClick={() => setShowInvite(true)}>
            Share
          </button>

          <button className="btn btn-sm btn-secondary" onClick={() => setShowTemplates(true)}>
            <LayoutTemplate size={12} /> Templates
          </button>

          <button className="btn btn-sm btn-secondary" onClick={() => setShowExport(true)}>
            <Download size={12} /> Export
          </button>

          <button className="btn btn-sm btn-ghost" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', margin: '0 4px' }} />

          <button className="btn btn-sm btn-ghost" onClick={handleLeave} style={{ color: 'var(--text-secondary)' }} title="Leave Board">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ─── Body ──────────────────────────────────────── */}
      <div className="whiteboard-body">
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

        <VideoOverlay
          isHost={String(user.id) === String(session.createdBy)}
          currentUserId={user.id}
          remoteUsers={remoteUsers}
          sendWebrtcSignal={sendWebrtcSignal}
          incomingSignals={incomingSignals}
        />

        <div className="canvas-container">
          <RecordingControls canvasRef={{ current: canvasRef.current?.getCanvas?.() }} />

          <WhiteboardCanvas ref={canvasRef} />
          
          <Toolbar />
          <BottomToolbar />
        </div>

        <Sidebar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          messages={messages}
          users={allUsers}
          currentUserId={String(user.id)}
          currentUserRole={currentUserRole}
          onSendChat={sendChat}
          onTyping={sendTyping}
          raisedHands={raisedHands}
          typingUsers={typingUsers}
          unreadCount={0}
          onKickUser={handleKickUser}
          onPromoteUser={handlePromoteUser}
          elements={elements}
          selectedIds={selectedIds}
          onSelectLayer={(id) => setSelectedIds(new Set([id]))}
          onToggleLayerHidden={(element) => toggleLayerFlag(element, 'hidden')}
          onToggleLayerLocked={(element) => toggleLayerFlag(element, 'locked')}
        />
      </div>

      {showExport && (
        <ExportModal isOpen={showExport} canvasRef={canvasRef} sessionName={session.name} elements={elements} onClose={() => setShowExport(false)} />
      )}
      {showTemplates && (
        <TemplateLibrary onClose={() => setShowTemplates(false)} onAddElement={handleInsertTemplateElement} userId={user.id} />
      )}
      {showInvite && (
        <InviteModal session={session} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}

export default function WhiteboardApp({ session, user, onLeave }) {
  return (
    <WhiteboardProvider>
      <ToolProvider>
        <CollaborationProvider session={session} user={user}>
          <WhiteboardAppInner session={session} user={user} onLeave={onLeave} />
        </CollaborationProvider>
      </ToolProvider>
    </WhiteboardProvider>
  );
}
