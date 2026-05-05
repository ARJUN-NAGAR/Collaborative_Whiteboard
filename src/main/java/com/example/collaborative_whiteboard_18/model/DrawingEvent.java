package com.example.collaborative_whiteboard_18.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "drawing_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrawingEvent {

    @Id
    private String id;

    private String sessionId;

    private String userId;

    private String type; // DRAW / ERASE / TEXT / SHAPE

    private Map<String, Object> data; // flexible JSON

    private LocalDateTime timestamp;
}
