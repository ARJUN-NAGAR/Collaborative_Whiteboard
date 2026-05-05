import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

export function useWebSocket({ sessionId, onBoardEvent, onChatEvent }) {
  const clientRef = useRef(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;

    const client = new Client({
      webSocketFactory: () => new window.SockJS(WS_URL),
      reconnectDelay: 3000,

      onConnect: () => {
        connectedRef.current = true;

        // Board events: drawing, cursor, join, leave
        // BUG FIX: backend now publishes to /topic/board/{id} (was /topic/session/{id})
        client.subscribe(`/topic/board/${sessionId}`, (msg) => {
          try { onBoardEvent && onBoardEvent(JSON.parse(msg.body)); } catch {}
        });

        // Chat events on separate topic
        // BUG FIX: backend now publishes to /topic/chat/{id} (was /topic/session/{id})
        client.subscribe(`/topic/chat/${sessionId}`, (msg) => {
          try { onChatEvent && onChatEvent(JSON.parse(msg.body)); } catch {}
        });
      },

      onDisconnect: () => { connectedRef.current = false; },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      connectedRef.current = false;
    };
  }, [sessionId]);

  const send = useCallback((destination, payload) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(payload),
      });
    }
  }, []);

  const sendDraw   = useCallback((event) => send('/app/draw',   event), [send]);
  const sendCursor = useCallback((event) => send('/app/cursor', event), [send]);
  const sendJoin   = useCallback((event) => send('/app/join',   event), [send]);
  const sendLeave  = useCallback((event) => send('/app/leave',  event), [send]);

  // BUG FIX: include senderName + senderColor inside data{} so backend can
  // persist them in ChatMessage (chatService reads them from data map)
  const sendChat = useCallback((msg) => {
    send('/app/chat', {
      ...msg,
      data: {
        content:     msg.content,
        senderName:  msg.senderName,
        senderColor: msg.senderColor,
      },
    });
  }, [send]);

  return {
    sendDraw,
    sendCursor,
    sendChat,
    sendJoin,
    sendLeave,
    isConnected: () => connectedRef.current,
  };
}