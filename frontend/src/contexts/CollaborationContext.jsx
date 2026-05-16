import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../components/ToastSystem';
import { chatAPI } from '../services/api';
import { useWhiteboard } from './WhiteboardContext';

const CollaborationContext = createContext();

export function CollaborationProvider({ children, session, user, onConnectionChange }) {
  const toast = useToast();
  const [remoteUsers, setRemoteUsers] = useState({});
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [incomingSignals, setIncomingSignals] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState(session?.status || 'ACTIVE');
  const { setElements, elementsRef } = useWhiteboard();
  
  const typingTimers = useRef({});

  const handleBoardEvent = useCallback((event) => {
    switch (event.type) {
      case 'CURSOR_MOVE':
        if (String(event.userId) !== String(user.id)) {
          setRemoteUsers(prev => ({
            ...prev,
            [event.userId]: {
              ...prev[event.userId],
              name: event.userName, 
              color: event.userColor,
              x: event.cursorX, 
              y: event.cursorY,
            },
          }));
        }
        break;
      case 'SELECTION_UPDATE':
        if (String(event.userId) !== String(user.id)) {
          setRemoteUsers(prev => ({
            ...prev,
            [event.userId]: {
              ...prev[event.userId],
              name: event.userName,
              color: event.userColor,
              selectedElementIds: event.selectedElementIds || [],
            },
          }));
        }
        break;
      case 'USER_JOIN':
        if (String(event.userId) !== String(user.id)) {
          setRemoteUsers(prev => ({
            ...prev,
            [event.userId]: { 
              name: event.userName, 
              color: event.userColor, 
              x: 0, 
              y: 0, 
              handRaised: false 
            },
          }));
          toast.info(`${event.userName} joined`);
        }
        break;
      case 'USER_LEAVE':
        setRemoteUsers(prev => { 
          const n = { ...prev }; 
          delete n[event.userId]; 
          return n; 
        });
        if (String(event.userId) !== String(user.id)) {
          toast.info(`${event.userName} left`);
        }
        break;
      case 'HAND_RAISE':
        if (String(event.userId) !== String(user.id)) {
          setRemoteUsers(prev => {
            const u = prev[event.userId] || {};
            const isRaised = event.state !== undefined ? event.state : !u.handRaised;
            if (isRaised && !u.handRaised) {
              toast.info(`✋ ${event.userName} raised their hand`);
            }
            return { ...prev, [event.userId]: { ...u, handRaised: isRaised } };
          });
        }
        break;
      case 'MEETING_RESUMED':
        setMeetingStatus('ACTIVE');
        toast.success('Host reconnected - session resumed');
        break;
      case 'ELEMENT_CREATE':
      case 'ELEMENT_ADD': {
        if (String(event.userId) === String(user.id)) break;
        const element = event.element || event.data?.element;
        if (!element?.id) break;
        setElements(prev => prev.some(el => el.id === element.id) ? prev : [...prev, element]);
        break;
      }
      case 'ELEMENT_UPDATE': {
        if (String(event.userId) === String(user.id)) break;
        const element = event.element || event.data?.element;
        if (!element?.id) break;
        setElements(prev => prev.map(el => el.id === element.id ? element : el));
        break;
      }
      case 'ELEMENT_DELETE': {
        if (String(event.userId) === String(user.id)) break;
        const ids = event.elementIds || event.data?.elementIds || [];
        const idSet = new Set(ids);
        setElements(prev => prev.filter(el => !idSet.has(el.id)));
        break;
      }
      case 'CLEAR':
      case 'ELEMENTS_SYNC': {
        if (String(event.userId) === String(user.id)) break;
        const nextElements = event.elements || event.data?.elements || [];
        setElements(Array.isArray(nextElements) ? nextElements : []);
        break;
      }
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
      case 'WEBRTC_SIGNAL':
        setIncomingSignals(event);
        break;
      default:
        break;
    }
  }, [user.id, toast, setElements]);

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
  }, []);

  const {
    sendDraw, 
    sendCursor, 
    sendChat, 
    sendJoin, 
    sendLeave,
    sendHandRaise, 
    sendWebrtcSignal, 
    sendTyping,
  } = useWebSocket({
    sessionId: session?.id,
    onBoardEvent: handleBoardEvent,
    onChatEvent: handleChatEvent,
    onConnectionChange: (connected) => {
      setIsConnected(connected);
      if (onConnectionChange) onConnectionChange(connected);
      if (!connected) toast.warning('Connection lost — reconnecting…');
    },
  });

  const [localHandRaised, setLocalHandRaised] = useState(false);

  useEffect(() => {
    if (!session?.id) return;
    chatAPI.getHistory(session.id).then(setMessages).catch(() => {});
  }, [session?.id]);

  useEffect(() => {
    if (!isConnected || !session?.id) return;
    sendJoin({
      type: 'USER_JOIN',
      sessionId: session.id,
      userId: String(user.id),
      userName: user.name,
      userColor: user.color,
    });
  }, [isConnected, sendJoin, session?.id, user]);
  
  const toggleHandRaise = useCallback(() => {
    const nextState = !localHandRaised;
    setLocalHandRaised(nextState);
    if (session) {
      sendHandRaise({ 
        type: 'HAND_RAISE', 
        sessionId: session.id, 
        userId: user.id, 
        userName: user.name, 
        userColor: user.color,
        state: nextState 
      });
    }
    toast.info(nextState ? '✋ Hand raised — others can see' : 'Hand lowered');
  }, [localHandRaised, sendHandRaise, session, user, toast]);

  const publishElementCreate = useCallback((element) => {
    if (!session?.id || !element) return;
    sendDraw({
      type: 'ELEMENT_CREATE',
      sessionId: session.id,
      userId: String(user.id),
      userName: user.name,
      userColor: user.color,
      element,
    });
  }, [sendDraw, session?.id, user]);

  const publishElementUpdate = useCallback((element) => {
    if (!session?.id || !element) return;
    sendDraw({
      type: 'ELEMENT_UPDATE',
      sessionId: session.id,
      userId: String(user.id),
      userName: user.name,
      userColor: user.color,
      element,
    });
  }, [sendDraw, session?.id, user]);

  const publishElementDelete = useCallback((elementIds) => {
    if (!session?.id || !elementIds?.length) return;
    sendDraw({
      type: 'ELEMENT_DELETE',
      sessionId: session.id,
      userId: String(user.id),
      userName: user.name,
      userColor: user.color,
      elementIds,
    });
  }, [sendDraw, session?.id, user]);

  const publishElementsSync = useCallback((nextElements = elementsRef.current) => {
    if (!session?.id) return;
    sendDraw({
      type: 'ELEMENTS_SYNC',
      sessionId: session.id,
      userId: String(user.id),
      userName: user.name,
      userColor: user.color,
      elements: nextElements,
    });
  }, [sendDraw, elementsRef, session?.id, user]);

  const sendChatMessage = useCallback((content) => {
    if (!session?.id || !content?.trim()) return;
    sendChat({
      sessionId: session.id,
      userId: String(user.id),
      senderId: String(user.id),
      senderName: user.name,
      senderColor: user.color,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    });
  }, [sendChat, session?.id, user]);

  const sendCursorPresence = useCallback(({ cursorX, cursorY }) => {
    if (!session?.id) return;
    sendCursor({
      type: 'CURSOR_MOVE',
      sessionId: session.id,
      userId: String(user.id),
      userName: user.name,
      userColor: user.color,
      cursorX,
      cursorY,
    });
  }, [sendCursor, session?.id, user]);

  const sendTypingPresence = useCallback(() => {
    if (!session?.id) return;
    sendTyping({
      sessionId: session.id,
      userId: String(user.id),
      userName: user.name,
      userColor: user.color,
    });
  }, [sendTyping, session?.id, user]);

  const sendSelectionPresence = useCallback((selectedElementIds) => {
    if (!session?.id) return;
    sendDraw({
      type: 'SELECTION_UPDATE',
      sessionId: session.id,
      userId: String(user.id),
      userName: user.name,
      userColor: user.color,
      selectedElementIds,
    });
  }, [sendDraw, session?.id, user]);

  const value = {
    remoteUsers,
    messages,
    setMessages, // For initial load
    typingUsers,
    incomingSignals,
    isConnected,
    meetingStatus,
    localHandRaised,
    toggleHandRaise,
    
    // Sockets Actions
    sendDraw,
    sendChat: sendChatMessage,
    sendJoin,
    sendLeave,
    sendWebrtcSignal,
    sendTyping: sendTypingPresence,
    sendCursor: sendCursorPresence,
    sendSelection: sendSelectionPresence,
    publishElementCreate,
    publishElementUpdate,
    publishElementDelete,
    publishElementsSync
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export const useCollaboration = () => useContext(CollaborationContext);
