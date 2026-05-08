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

    @com.fasterxml.jackson.annotation.JsonAnySetter
    private Map<String, Object> additionalProperties = new java.util.HashMap<>();

    @com.fasterxml.jackson.annotation.JsonAnyGetter
    public Map<String, Object> getAdditionalProperties() {
        return this.additionalProperties;
    }
}