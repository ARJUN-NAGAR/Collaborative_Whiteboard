package com.example.collaborative_whiteboard_18.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Participant {

    private String userId;

    private String role; // OWNER / EDITOR / VIEWER


    private boolean isOnline;
}
