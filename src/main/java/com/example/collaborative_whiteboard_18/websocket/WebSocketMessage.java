package com.example.collaborative_whiteboard_18.websocket;

import lombok.*;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebSocketMessage {

    private String sessionId;

    private String userId;

    private String type; // DRAW, ERASE, TEXT, CHAT

    private Map<String, Object> data;
}