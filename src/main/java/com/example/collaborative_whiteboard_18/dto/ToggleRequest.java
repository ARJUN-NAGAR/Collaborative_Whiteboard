package com.example.collaborative_whiteboard_18.dto;

import lombok.Data;

/** Body for PUT /api/sessions/{id}/toggle */
@Data
public class ToggleRequest {
    private boolean active;
}