package com.example.collaborative_whiteboard_18.dto;

import lombok.Data;

/** Body sent by frontend when creating a new session. */
@Data
public class CreateSessionRequest {
    private String name;       // board display name
    private String ownerName;  // creator's display name
    private String ownerId;    // creator's user id (generated on frontend)
}