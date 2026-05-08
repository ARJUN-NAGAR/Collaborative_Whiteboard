package com.example.collaborative_whiteboard_18.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

/** Body for PUT /api/sessions/{id}/elements */
@Data
public class UpdateElementsRequest {
    private List<Map<String, Object>> elements;
}