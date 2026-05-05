package com.example.collaborative_whiteboard_18.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "snapshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhiteboardSnapshot {

    @Id
    private String id;

    private String sessionId;

    private String fileUrl;

    private LocalDateTime createdAt;
}
