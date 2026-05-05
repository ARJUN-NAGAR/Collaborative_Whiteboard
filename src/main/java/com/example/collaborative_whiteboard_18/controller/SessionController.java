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
 * REST endpoints that match frontend api.js exactly:
 *
 *  POST   /api/sessions                  → create
 *  GET    /api/sessions                  → getAll
 *  GET    /api/sessions/active           → getActive
 *  GET    /api/sessions/analytics        → analytics (moved here from AnalyticsController)
 *  GET    /api/sessions/{id}             → getById
 *  PUT    /api/sessions/{id}/elements    → updateElements (canvas auto-save)
 *  DELETE /api/sessions/{id}             → delete
 *  GET    /api/sessions/{id}/users       → getUsers
 *  PUT    /api/sessions/{id}/toggle      → toggle active/inactive
 *  POST   /api/sessions/join             → join by shareCode
 *  POST   /api/sessions/{id}/leave       → leave
 */
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    // ── Create ──────────────────────────────────────────────────────────────
    // BUG FIX: was @RequestParam; frontend sends JSON body → use @RequestBody + DTO
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

    // Analytics moved here so frontend path /api/sessions/analytics works
    // (was at /api/analytics — path mismatch)
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        Map<String, Object> data = sessionService.getAnalytics();
        return ResponseEntity.ok(data);
    }

    // NOTE: specific paths (active, analytics) MUST be declared before /{id}
    // otherwise Spring maps them as IDs
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
            WhiteboardSession updated = sessionService.updateElements(id, req.getElementsJson());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggleSession(@PathVariable String id,
                                           @RequestBody ToggleRequest req) {
        try {
            WhiteboardSession updated = sessionService.toggleSession(id, req.isActive());
            return ResponseEntity.ok(updated);
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

    // ── Session Participation ─────────────────────────────────────────────────
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