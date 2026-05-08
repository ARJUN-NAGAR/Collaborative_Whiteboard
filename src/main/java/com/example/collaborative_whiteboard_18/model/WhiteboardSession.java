package com.example.collaborative_whiteboard_18.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhiteboardSession {

    @Id
    private String id;

    private String name;          // board display name (frontend uses "name")

    private String ownerName;     // display name of owner

    private String createdBy;     // userId of owner (a.k.a. ownerId from frontend)

    private String shareCode;     // short join code

    private boolean active;       // NOTE: field named "active" → JSON key "active" ✓

    private LocalDateTime createdAt;

    private List<Participant> participants;

    private List<Map<String, Object>> elements;  // persisted canvas state (delta-sync)
}