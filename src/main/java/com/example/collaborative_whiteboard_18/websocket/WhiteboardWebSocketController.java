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

@Controller
@RequiredArgsConstructor
public class WhiteboardWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final DrawingService drawingService;
    private final ChatService chatService;

    /**
     * 🎨 Drawing events (ELEMENT_ADD, ELEMENT_DELETE, CLEAR)
     *
     * Frontend sends to:   /app/draw
     * Frontend listens on: /topic/board/{sessionId}   ← BUG FIX: was /topic/session/
     */
    @MessageMapping("/draw")
    public void handleDrawing(@Payload WebSocketMessage message) {

        // Persist non-cursor events
        if (message.getType() != null && !message.getType().equals("CURSOR_MOVE")) {
            DrawingEvent event = DrawingEvent.builder()
                    .sessionId(message.getSessionId())
                    .userId(message.getUserId())
                    .type(message.getType())
                    .data(message.getData())
                    .timestamp(LocalDateTime.now())
                    .build();
            drawingService.saveEvent(event);
        }

        // BUG FIX: broadcast to /topic/board/{sessionId} (frontend subscribes here)
        messagingTemplate.convertAndSend(
                "/topic/board/" + message.getSessionId(),
                message
        );
    }

    /**
     * 🖱️ Cursor position events
     *
     * Frontend sends to:   /app/cursor
     * Frontend listens on: /topic/board/{sessionId}
     * BUG FIX: this handler was completely missing — cursor updates were never broadcast
     */
    @MessageMapping("/cursor")
    public void handleCursor(@Payload WebSocketMessage message) {
        // Not persisted — real-time only
        messagingTemplate.convertAndSend(
                "/topic/board/" + message.getSessionId(),
                message
        );
    }

    /**
     * 👤 User join event
     *
     * Frontend sends to:   /app/join
     * Frontend listens on: /topic/board/{sessionId}
     * BUG FIX: this handler was completely missing
     */
    @MessageMapping("/join")
    public void handleJoin(@Payload WebSocketMessage message) {
        messagingTemplate.convertAndSend(
                "/topic/board/" + message.getSessionId(),
                message
        );
    }

    /**
     * 🚪 User leave event
     *
     * Frontend sends to:   /app/leave
     * Frontend listens on: /topic/board/{sessionId}
     * BUG FIX: this handler was completely missing
     */
    @MessageMapping("/leave")
    public void handleLeave(@Payload WebSocketMessage message) {
        messagingTemplate.convertAndSend(
                "/topic/board/" + message.getSessionId(),
                message
        );
    }

    /**
     * 💬 Chat messages
     *
     * Frontend sends to:   /app/chat
     * Frontend listens on: /topic/chat/{sessionId}   ← BUG FIX: was /topic/session/
     */
    @MessageMapping("/chat")
    public void handleChat(@Payload WebSocketMessage message) {

        // BUG FIX: field mapping updated to match new ChatMessage model
        // (senderId/senderName/senderColor/content instead of userId/message)
        String content = message.getData() != null
                ? (String) message.getData().get("content")
                : null;

        ChatMessage chat = ChatMessage.builder()
                .sessionId(message.getSessionId())
                .senderId(message.getUserId())
                .senderName((String) (message.getData() != null ? message.getData().get("senderName") : null))
                .senderColor((String) (message.getData() != null ? message.getData().get("senderColor") : null))
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();

        chatService.sendMessage(chat);

        // BUG FIX: broadcast to /topic/chat/{sessionId}
        messagingTemplate.convertAndSend(
                "/topic/chat/" + message.getSessionId(),
                message
        );
    }
}