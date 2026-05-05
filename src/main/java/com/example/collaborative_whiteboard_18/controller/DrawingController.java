package com.example.collaborative_whiteboard_18.controller;

import com.example.collaborative_whiteboard_18.model.DrawingEvent;
import com.example.collaborative_whiteboard_18.service.DrawingService;
import com.example.collaborative_whiteboard_18.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drawing")
@RequiredArgsConstructor
public class DrawingController {

    private final DrawingService drawingService;
    private final SessionService sessionService;

    @PostMapping("/event")
    public ResponseEntity<?> saveEvent(@RequestBody DrawingEvent event) {

        // 🔒 Role-based access check
        if (!sessionService.canEdit(event.getSessionId(), event.getUserId())) {
            return ResponseEntity.status(403).body("You are not allowed to draw");
        }

        return ResponseEntity.ok(drawingService.saveEvent(event));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<List<DrawingEvent>> getEvents(@PathVariable String sessionId) {
        return ResponseEntity.ok(drawingService.getSessionEvents(sessionId));
    }
}