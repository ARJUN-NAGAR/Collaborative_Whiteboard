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

        // ✅ Board events
        client.subscribe(`/topic/board/${sessionId}`, (msg) => {
          try {
            onBoardEvent && onBoardEvent(JSON.parse(msg.body));
          } catch (err) {
            console.error('Board event parse error:', err);
          }
        });

        // ✅ Chat events
        client.subscribe(`/topic/chat/${sessionId}`, (msg) => {
          try {
            onChatEvent && onChatEvent(JSON.parse(msg.body));
          } catch (err) {
            console.error('Chat event parse error:', err);
          }
        });
      },

      onDisconnect: () => {
        connectedRef.current = false;
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      }
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      connectedRef.current = false;
    };

  }, [sessionId, onBoardEvent, onChatEvent]);

  /**
   * ✅ Generic sender
   */
  const send = useCallback((destination, payload) => {

    if (clientRef.current?.connected) {

      clientRef.current.publish({
        destination,
        body: JSON.stringify(payload),
      });

    } else {
      console.warn('WebSocket not connected');
    }

  }, []);

  /**
   * 🎨 Drawing
   */
  const sendDraw = useCallback((event) => {
    send('/app/draw', event);
  }, [send]);

  /**
   * 🖱 Cursor
   */
  const sendCursor = useCallback((event) => {
    send('/app/cursor', event);
  }, [send]);

  /**
   * 👤 Join
   */
  const sendJoin = useCallback((event) => {
    send('/app/join', event);
  }, [send]);

  /**
   * 🚪 Leave
   */
  const sendLeave = useCallback((event) => {
    send('/app/leave', event);
  }, [send]);

  /**
   * 💬 Chat
   */
  const sendChat = useCallback((msg) => {

    send('/app/chat', {
      ...msg,
      data: {
        content: msg.content,
        senderName: msg.senderName,
        senderColor: msg.senderColor,
      },
    });

  }, [send]);

  /**
   * ✋ Hand Raise
   */
  const sendHandRaise = useCallback((event) => {

    send('/app/handraise', {
      ...event,
      type: 'HAND_RAISE',
    });

  }, [send]);

  /**
   * 📡 WebRTC Signaling
   */
  const sendWebrtcSignal = useCallback((signalData) => {
    send('/app/draw', {
      type: 'WEBRTC_SIGNAL',
      sessionId,
      ...signalData
    });
  }, [send, sessionId]);

  return {
    sendDraw,
    sendCursor,
    sendJoin,
    sendLeave,
    sendChat,
    sendHandRaise,
    sendWebrtcSignal,
    isConnected: () => connectedRef.current,
  };
}