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

    private String name;        // board display name

    private String ownerName;   // display name of owner

    private String createdBy;   // userId of owner

    private String shareCode;   // short join code

    /**
     * Session lifecycle state.
     * Values: CREATED, ACTIVE, PAUSED, INACTIVE, ENDED, ARCHIVED
     *
     * NOTE: We also expose a synthetic `active` getter for backward compat
     * with any frontend code that still reads session.active.
     */
    private String status;

    private LocalDateTime createdAt;

    private List<Participant> participants;

    private List<Map<String, Object>> elements;  // persisted canvas elements

    /**
     * Convenience boolean for frontend and repository queries.
     * Returns true when status is ACTIVE or CREATED.
     */
    public boolean isActive() {
        return "ACTIVE".equals(status) || "CREATED".equals(status);
    }
}