package com.example.collaborative_whiteboard_18.websocket;

import com.example.collaborative_whiteboard_18.model.ChatMessage;
import com.example.collaborative_whiteboard_18.model.DrawingEvent;
import com.example.collaborative_whiteboard_18.service.ChatService;
import com.example.collaborative_whiteboard_18.service.DrawingService;
import com.example.collaborative_whiteboard_18.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@Controller
@RequiredArgsConstructor
public class WhiteboardWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final DrawingService drawingService;
    private final ChatService chatService;
    private final SessionService sessionService;

    /**
     * Maps STOMP session id → [boardRoomId, userId]
     * Populated on /join so we know which user owned which socket.
     */
    private final Map<String, String[]> stompToApp = new ConcurrentHashMap<>();

    /**
     * Maps boardRoomId → ScheduledFuture for owner-disconnect grace timer.
     * Cancelled if the owner reconnects within 60 s.
     */
    private final Map<String, ScheduledFuture<?>> graceTimers = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    // ─── WebSocket lifecycle events ──────────────────────────────────────────

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String stompId = sha.getSessionId();
        String[] info  = stompToApp.remove(stompId);
        if (info == null) return;

        String roomId = info[0];
        String userId = info[1];

        sessionService.getSession(roomId).ifPresent(session -> {
            boolean isOwner = session.getParticipants().stream()
                    .anyMatch(p -> p.getUserId().equals(userId) && "OWNER".equals(p.getRole()));
            if (isOwner) {
                // Start a 60-second grace period before pausing the meeting
                ScheduledFuture<?> future = scheduler.schedule(() -> {
                    sessionService.toggleSession(roomId, "PAUSED");
                    WebSocketMessage msg = WebSocketMessage.builder()
                            .type("MEETING_PAUSED")
                            .sessionId(roomId)
                            .build();
                    messagingTemplate.convertAndSend("/topic/board/" + roomId, msg);
                }, 60, TimeUnit.SECONDS);
                graceTimers.put(roomId, future);
            }
        });
    }

    // ─── Drawing ─────────────────────────────────────────────────────────────

    /**
     * /app/draw handles: ELEMENT_CREATE, ELEMENT_UPDATE, ELEMENT_DELETE,
     *                    CLEAR, ELEMENTS_SYNC, WEBRTC_SIGNAL,
     *                    TYPING_START, TYPING_STOP
     */
    @MessageMapping("/draw")
    public void handleDraw(@Payload WebSocketMessage message) {
        String type = message.getType();

        // Passthrough types that skip persistence / RBAC
        boolean skipPersist = type == null
                || type.equals("CURSOR_MOVE")
                || type.equals("SELECTION_UPDATE")
                || type.equals("VIEWPORT_UPDATE")
                || type.equals("REACTION")
                || type.equals("WEBRTC_SIGNAL")
                || type.equals("TYPING_START")
                || type.equals("TYPING_STOP");

        if (!skipPersist) {
            // RBAC: only editors and above may mutate canvas
            if (!sessionService.canEdit(message.getSessionId(), message.getUserId())) {
                return; // silently drop
            }

            DrawingEvent event = DrawingEvent.builder()
                    .sessionId(message.getSessionId())
                    .userId(message.getUserId())
                    .type(type)
                    .data(message.getData())
                    .timestamp(LocalDateTime.now())
                    .build();
            drawingService.saveEvent(event);

            if ("ELEMENT_CREATE".equals(type) || "ELEMENT_ADD".equals(type) || "ELEMENT_UPDATE".equals(type)) {
                Object el = message.getAdditionalProperties().get("element");
                if (el == null && message.getData() != null) {
                    el = message.getData().get("element");
                }
                if (el instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> element = (Map<String, Object>) el;
                    sessionService.upsertElement(message.getSessionId(), element);
                }
            } else if ("ELEMENT_DELETE".equals(type)) {
                Object ids = message.getAdditionalProperties().get("elementIds");
                if (ids == null && message.getData() != null) {
                    ids = message.getData().get("elementIds");
                }
                if (ids instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<String> elementIds = (List<String>) ids;
                    sessionService.deleteElements(message.getSessionId(), elementIds);
                }
            } else if ("CLEAR".equals(type)) {
                sessionService.updateElements(message.getSessionId(), new java.util.ArrayList<>());
            } else if ("ELEMENTS_SYNC".equals(type)) {
                Object els = message.getAdditionalProperties().get("elements");
                if (els == null && message.getData() != null) {
                    els = message.getData().get("elements");
                }
                if (els instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> elements = (List<Map<String, Object>>) els;
                    sessionService.updateElements(message.getSessionId(), elements);
                }
            }
        }

        messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), message);
    }

    // ─── Cursor (real-time only) ──────────────────────────────────────────────

    @MessageMapping("/cursor")
    public void handleCursor(@Payload WebSocketMessage message) {
        messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), message);
    }

    // ─── Join ────────────────────────────────────────────────────────────────

    @MessageMapping("/join")
    public void handleJoin(@Payload WebSocketMessage message, StompHeaderAccessor sha) {
        String stompId = sha.getSessionId();
        if (stompId != null) {
            stompToApp.put(stompId, new String[]{ message.getSessionId(), message.getUserId() });
        }

        // If the owner is returning, cancel the grace timer
        ScheduledFuture<?> timer = graceTimers.remove(message.getSessionId());
        if (timer != null) {
            timer.cancel(false);
            // Restore to ACTIVE if it was PAUSED
            sessionService.getSession(message.getSessionId()).ifPresent(s -> {
                if ("PAUSED".equals(s.getStatus())) {
                    sessionService.toggleSession(message.getSessionId(), "ACTIVE");
                    WebSocketMessage resume = WebSocketMessage.builder()
                            .type("MEETING_RESUMED")
                            .sessionId(message.getSessionId())
                            .build();
                    messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), resume);
                }
            });
        }

        messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), message);
    }

    // ─── Leave ───────────────────────────────────────────────────────────────

    @MessageMapping("/leave")
    public void handleLeave(@Payload WebSocketMessage message) {
        messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), message);
    }

    // ─── Hand Raise ──────────────────────────────────────────────────────────

    @MessageMapping("/handraise")
    public void handleHandRaise(@Payload WebSocketMessage message) {
        messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), message);
    }

    // ─── Chat ────────────────────────────────────────────────────────────────

    @MessageMapping("/chat")
    public void handleChat(@Payload WebSocketMessage message) {
        String content     = null;
        String senderName  = null;
        String senderColor = null;

        if (message.getData() != null) {
            content     = (String) message.getData().get("content");
            senderName  = (String) message.getData().get("senderName");
            senderColor = (String) message.getData().get("senderColor");
        }
        // Fallback to top-level fields via @JsonAnyGetter
        if (content     == null) content     = (String) message.getAdditionalProperties().get("content");
        if (senderName  == null) senderName  = (String) message.getAdditionalProperties().get("senderName");
        if (senderColor == null) senderColor = (String) message.getAdditionalProperties().get("senderColor");

        ChatMessage chat = ChatMessage.builder()
                .sessionId(message.getSessionId())
                .senderId(message.getUserId())
                .senderName(senderName)
                .senderColor(senderColor)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();

        // Persist and re-broadcast the saved entity (includes DB-assigned id)
        ChatMessage saved = chatService.sendMessage(chat);
        messagingTemplate.convertAndSend("/topic/chat/" + message.getSessionId(), saved);
    }
}
