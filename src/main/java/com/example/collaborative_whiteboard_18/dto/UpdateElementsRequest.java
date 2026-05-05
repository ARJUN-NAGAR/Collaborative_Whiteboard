package com.example.collaborative_whiteboard_18.dto;

import lombok.Data;

/** Body for PUT /api/sessions/{id}/elements */
@Data
public class UpdateElementsRequest {
    private String elementsJson;
}