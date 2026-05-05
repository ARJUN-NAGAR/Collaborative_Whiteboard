package com.example.collaborative_whiteboard_18.model;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Participant {

    private String userId;

    private String role; // OWNER / EDITOR / VIEWER

    // BUG FIX: same as User.isActive — Boolean wrapper prevents null-mapping crash
    private Boolean isOnline;
}