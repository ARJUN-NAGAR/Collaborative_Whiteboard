package com.example.collaborative_whiteboard_18.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    private String name;

    private String email;

    private String password;

    private String role; // USER / ADMIN

    // BUG FIX: was primitive boolean — Jackson cannot map null → boolean
    // when the field is absent from the request body (register sends only name/email/password).
    // Using the Boolean wrapper allows null safely.
    private Boolean isActive;

    private LocalDateTime createdAt;
}