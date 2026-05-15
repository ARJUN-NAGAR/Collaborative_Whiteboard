package com.example.collaborative_whiteboard_18.controller;

import com.example.collaborative_whiteboard_18.dto.CreateSessionRequest;
import com.example.collaborative_whiteboard_18.dto.ToggleRequest;
import com.example.collaborative_whiteboard_18.dto.UpdateElementsRequest;
import com.example.collaborative_whiteboard_18.model.WhiteboardSession;
import com.example.collaborative_whiteboard_18.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * REST endpoints:
 *
 *  POST   /api/sessions
 *  GET    /api/sessions
 *  GET    /api/sessions/active
 *  GET    /api/sessions/analytics
 *  GET    /api/sessions/{id}
 *  PUT    /api/sessions/{id}/elements
 *  PUT    /api/sessions/{id}/toggle
 *  DELETE /api/sessions/{id}
 *  GET    /api/sessions/{id}/users
 *  POST   /api/sessions/join            (shareCode + userId params)
 *  POST   /api/sessions/{id}/leave
 *  POST   /api/sessions/{id}/remove-user
 *  PUT    /api/sessions/{id}/role
 *  POST   /api/sessions/{id}/lock
 */
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    // ── Create ──────────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createSession(@RequestBody CreateSessionRequest req) {
        WhiteboardSession session = sessionService.createSession(
                req.getName(), req.getOwnerName(), req.getOwnerId());
        return ResponseEntity.ok(session);
    }

    // ── Read ─────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<?> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveSessions() {
        return ResponseEntity.ok(sessionService.getActiveSessions());
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        return ResponseEntity.ok(sessionService.getAnalytics());
    }

    // IMPORTANT: /active and /analytics must be declared BEFORE /{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getSession(@PathVariable String id) {
        return sessionService.getSession(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Update ───────────────────────────────────────────────────────────────
    @PutMapping("/{id}/elements")
    public ResponseEntity<?> updateElements(@PathVariable String id,
                                            @RequestBody UpdateElementsRequest req) {
        try {
            return ResponseEntity.ok(sessionService.updateElements(id, req.getElements()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggleSession(@PathVariable String id,
                                           @RequestBody ToggleRequest req) {
        try {
            return ResponseEntity.ok(sessionService.toggleSession(id, req.resolvedStatus()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Delete ───────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSession(@PathVariable String id) {
        sessionService.deleteSession(id);
        return ResponseEntity.ok("Session deleted");
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    @GetMapping("/{id}/users")
    public ResponseEntity<?> getUsers(@PathVariable String id) {
        return sessionService.getSession(id)
                .map(s -> ResponseEntity.ok(Map.of(
                        "count", s.getParticipants().size(),
                        "users", s.getParticipants())))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Participation ─────────────────────────────────────────────────────────
    @PostMapping("/join")
    public ResponseEntity<?> joinSession(@RequestParam String shareCode,
                                         @RequestParam String userId) {
        Optional<WhiteboardSession> session = sessionService.joinSession(shareCode, userId);
        return session.map(ResponseEntity::ok)
                .orElse(ResponseEntity.badRequest().build());
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveSession(@PathVariable String id,
                                          @RequestParam String userId) {
        sessionService.leaveSession(id, userId);
        return ResponseEntity.ok("Left session");
    }

    @PostMapping("/{id}/remove-user")
    public ResponseEntity<?> removeUser(@PathVariable String id,
                                        @RequestParam String userId) {
        sessionService.removeUser(id, userId);
        return ResponseEntity.ok("User removed");
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable String id,
                                        @RequestParam String userId,
                                        @RequestParam String role) {
        sessionService.updateRole(id, userId, role);
        return ResponseEntity.ok("Role updated");
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<?> lockSession(@PathVariable String id) {
        sessionService.lockSession(id);
        return ResponseEntity.ok("Session locked");
    }
}