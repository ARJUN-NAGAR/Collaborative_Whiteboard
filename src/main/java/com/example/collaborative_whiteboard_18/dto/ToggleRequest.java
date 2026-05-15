package com.example.collaborative_whiteboard_18.dto;

import lombok.Data;

/**
 * Body for PUT /api/sessions/{id}/toggle
 *
 * Accepts either:
 *  { "status": "ACTIVE" }           — new lifecycle string
 *  { "active": true/false }          — legacy boolean (converted internally)
 */
@Data
public class ToggleRequest {

    /** Lifecycle status string: ACTIVE, INACTIVE, PAUSED, ENDED */
    private String status;

    /** Legacy boolean field — if status is absent, derive from this */
    private Boolean active;

    /**
     * Resolve to a canonical status string.
     * Prefers explicit `status`; falls back to `active` boolean.
     */
    public String resolvedStatus() {
        if (status != null && !status.isBlank()) return status;
        if (active != null) return active ? "ACTIVE" : "INACTIVE";
        return "ACTIVE";
    }
}