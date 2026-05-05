package com.example.collaborative_whiteboard_18.dto;

import lombok.Data;

@Data
public class ExportRequest {
    private String sessionId;
    private String imageBase64;
}