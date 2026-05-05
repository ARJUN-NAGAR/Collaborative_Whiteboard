package com.example.collaborative_whiteboard_18.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

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

    private String elementsJson;  // persisted canvas state (JSON string from frontend)
}