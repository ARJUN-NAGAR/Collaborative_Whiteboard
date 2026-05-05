package com.example.collaborative_whiteboard_18.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    private String id;

    private String sessionId;

    // BUG FIX: renamed userId → senderId, message → content
    // to match frontend WebSocket payload and Sidebar.jsx rendering
    private String senderId;

    private String senderName;

    private String senderColor;

    private String content;

    private LocalDateTime timestamp;
}