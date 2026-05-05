package com.example.collaborative_whiteboard_18.controller;

import com.example.collaborative_whiteboard_18.model.User;
import com.example.collaborative_whiteboard_18.security.JwtUtil;
import com.example.collaborative_whiteboard_18.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User saved = userService.register(user);
            String token = jwtUtil.generateToken(saved.getId());
            // Return token + user info so frontend can store everything in one shot
            return ResponseEntity.ok(Map.of(
                    "token",  token,
                    "userId", saved.getId(),
                    "name",   saved.getName() != null ? saved.getName() : "",
                    "email",  saved.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {

        Optional<User> existing = userService.findByEmail(user.getEmail());

        if (existing.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }

        // BUG FIX: use BCrypt matches, not .equals()
        boolean passwordMatches = passwordEncoder.matches(
                user.getPassword(),
                existing.get().getPassword()
        );

        if (!passwordMatches) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }

        String token = jwtUtil.generateToken(existing.get().getId());
        return ResponseEntity.ok(Map.of(
                "token",  token,
                "userId", existing.get().getId(),
                "name",   existing.get().getName() != null ? existing.get().getName() : "",
                "email",  existing.get().getEmail()
        ));
    }
}