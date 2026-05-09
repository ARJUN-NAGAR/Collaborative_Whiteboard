package com.example.collaborative_whiteboard_18.websocket;

import com.example.collaborative_whiteboard_18.model.ChatMessage;
import com.example.collaborative_whiteboard_18.model.DrawingEvent;
import com.example.collaborative_whiteboard_18.service.ChatService;
import com.example.collaborative_whiteboard_18.service.DrawingService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class WhiteboardWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final DrawingService drawingService;
    private final ChatService chatService;
    private final com.example.collaborative_whiteboard_18.service.SessionService sessionService;

    /**
     * Drawing events: ELEMENT_ADD, ELEMENT_UPDATE, ELEMENT_DELETE, CLEAR, ELEMENTS_SYNC
     * Frontend sends to:   /app/draw
     * Frontend listens on: /topic/board/{sessionId}
     */
    @MessageMapping("/draw")
    public void handleDrawing(@Payload WebSocketMessage message) {
        String type = message.getType();

        if (type != null && !type.equals("CURSOR_MOVE") && !type.equals("WEBRTC_SIGNAL")) {
            DrawingEvent event = DrawingEvent.builder()
                    .sessionId(message.getSessionId())
                    .userId(message.getUserId())
                    .type(type)
                    .data(message.getData())
                    .timestamp(LocalDateTime.now())
                    .build();
            drawingService.saveEvent(event);

            if (type.equals("ELEMENT_ADD") || type.equals("ELEMENT_UPDATE")) {
                Object elementObj = message.getAdditionalProperties().get("element");
                if (elementObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> element = (Map<String, Object>) elementObj;
                    sessionService.upsertElement(message.getSessionId(), element);
                }
            } else if (type.equals("CLEAR")) {
                sessionService.updateElements(message.getSessionId(), new java.util.ArrayList<>());
            } else if (type.equals("ELEMENTS_SYNC")) {
                // Undo/Redo full-state sync — overwrite persisted elements
                Object elementsObj = message.getAdditionalProperties().get("elements");
                if (elementsObj instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> elements = (List<Map<String, Object>>) elementsObj;
                    sessionService.updateElements(message.getSessionId(), elements);
                }
            }
        }

        messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), message);
    }

    /** Hand raise */
    @MessageMapping("/handraise")
    public void handleHandRaise(@Payload WebSocketMessage message) {
        messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), message);
    }

    /** Cursor — real-time only, not persisted */
    @MessageMapping("/cursor")
    public void handleCursor(@Payload WebSocketMessage message) {
        messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), message);
    }

    /** User join */
    @MessageMapping("/join")
    public void handleJoin(@Payload WebSocketMessage message) {
        messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), message);
    }

    /** User leave */
    @MessageMapping("/leave")
    public void handleLeave(@Payload WebSocketMessage message) {
        messagingTemplate.convertAndSend("/topic/board/" + message.getSessionId(), message);
    }

    /**
     * Chat messages
     * Frontend sends to:   /app/chat
     * Frontend listens on: /topic/chat/{sessionId}
     */
    @MessageMapping("/chat")
    public void handleChat(@Payload WebSocketMessage message) {
        String content = null;
        String senderName = null;
        String senderColor = null;

        // Data payload takes priority; fall back to top-level fields via @JsonAnyGetter
        if (message.getData() != null) {
            content = (String) message.getData().get("content");
            senderName = (String) message.getData().get("senderName");
            senderColor = (String) message.getData().get("senderColor");
        }
        if (content == null) content = (String) message.getAdditionalProperties().get("content");
        if (senderName == null) senderName = (String) message.getAdditionalProperties().get("senderName");
        if (senderColor == null) senderColor = (String) message.getAdditionalProperties().get("senderColor");

        ChatMessage chat = ChatMessage.builder()
                .sessionId(message.getSessionId())
                .senderId(message.getUserId())
                .senderName(senderName)
                .senderColor(senderColor)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();

        ChatMessage saved = chatService.sendMessage(chat);

        // Re-broadcast the fully-hydrated saved message so clients get the real id + senderName
        messagingTemplate.convertAndSend("/topic/chat/" + message.getSessionId(), saved);
    }
}