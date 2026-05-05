package com.example.collaborative_whiteboard_18.controller;

import com.example.collaborative_whiteboard_18.repository.UserRepository;
import com.example.collaborative_whiteboard_18.repository.WhiteboardSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final WhiteboardSessionRepository sessionRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAnalytics() {

        Map<String, Object> data = new HashMap<>();

        data.put("totalSessions", sessionRepository.count());
        data.put("totalUsers", userRepository.count());

        return ResponseEntity.ok(data);
    }
}