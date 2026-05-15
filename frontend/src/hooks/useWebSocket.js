import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
const TYPING_DEBOUNCE = 1500;

export function useWebSocket({ sessionId, onBoardEvent, onChatEvent, onConnectionChange }) {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;

    const client = new Client({
      webSocketFactory: () => new window.SockJS(WS_URL),
      reconnectDelay: 4000,
      onConnect: () => {
        setIsConnected(true);
        onConnectionChange?.(true);

        client.subscribe(`/topic/board/${sessionId}`, (msg) => {
          try { onBoardEvent?.(JSON.parse(msg.body)); }
          catch (err) { console.error('Board parse error:', err); }
        });

        client.subscribe(`/topic/chat/${sessionId}`, (msg) => {
          try { onChatEvent?.(JSON.parse(msg.body)); }
          catch (err) { console.error('Chat parse error:', err); }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
        onConnectionChange?.(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;
    return () => { client.deactivate(); };
  }, [sessionId]);

  const send = useCallback((destination, payload) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination, body: JSON.stringify(payload) });
    } else {
      console.warn('WS not connected');
    }
  }, []);

  const sendDraw        = useCallback((e) => send('/app/draw', e), [send]);
  const sendCursor      = useCallback((e) => send('/app/cursor', e), [send]);
  const sendJoin        = useCallback((e) => send('/app/join', e), [send]);
  const sendLeave       = useCallback((e) => send('/app/leave', e), [send]);
  const sendHandRaise   = useCallback((e) => send('/app/handraise', { ...e, type: 'HAND_RAISE' }), [send]);
  const sendWebrtcSignal = useCallback((d) => send('/app/draw', { type: 'WEBRTC_SIGNAL', sessionId, ...d }), [send, sessionId]);

  const sendChat = useCallback((msg) => {
    send('/app/chat', {
      ...msg,
      type: 'CHAT',
      data: { content: msg.content, senderName: msg.senderName, senderColor: msg.senderColor },
    });
  }, [send]);

  const sendTyping = useCallback(({ sessionId: sid, userId, userName, userColor }) => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      send('/app/draw', { type: 'TYPING_START', sessionId: sid, userId, userName, userColor });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      send('/app/draw', { type: 'TYPING_STOP', sessionId: sid, userId, userName });
    }, TYPING_DEBOUNCE);
  }, [send]);

  return { sendDraw, sendCursor, sendJoin, sendLeave, sendChat, sendHandRaise, sendWebrtcSignal, sendTyping, isConnected };
}