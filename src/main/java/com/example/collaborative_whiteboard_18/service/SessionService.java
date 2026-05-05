package com.example.collaborative_whiteboard_18.service;

import com.example.collaborative_whiteboard_18.model.Participant;
import com.example.collaborative_whiteboard_18.model.WhiteboardSession;
import com.example.collaborative_whiteboard_18.repository.WhiteboardSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final WhiteboardSessionRepository sessionRepository;

    // ✅ Create Session
    public WhiteboardSession createSession(String name, String ownerName, String ownerId) {

        WhiteboardSession session = WhiteboardSession.builder()
                .name(name)
                .ownerName(ownerName)
                .createdBy(ownerId)
                .createdAt(LocalDateTime.now())
                .active(true)
                .shareCode(UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .participants(new ArrayList<>())
                .elementsJson("[]")
                .build();

        session.getParticipants().add(
                Participant.builder()
                        .userId(ownerId)
                        .role("OWNER")
                        .isOnline(true)
                        .build()
        );

        return sessionRepository.save(session);
    }

    // ✅ Get All Sessions
    public List<WhiteboardSession> getAllSessions() {
        return sessionRepository.findAll();
    }

    // ✅ Get Active Sessions
    public List<WhiteboardSession> getActiveSessions() {
        // BUG FIX: was findByIsActiveTrue() — field renamed to "active" so method is findByActiveTrue()
        return sessionRepository.findByActiveTrue();
    }

    // ✅ Get Session by ID
    public Optional<WhiteboardSession> getSession(String sessionId) {
        return sessionRepository.findById(sessionId);
    }

    // ✅ Update Canvas Elements (auto-save from frontend every 10s)
    public WhiteboardSession updateElements(String sessionId, String elementsJson) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        session.setElementsJson(elementsJson);
        return sessionRepository.save(session);
    }

    // ✅ Delete Session
    public void deleteSession(String sessionId) {
        sessionRepository.deleteById(sessionId);
    }

    // ✅ Toggle Active/Inactive (Admin Dashboard)
    public WhiteboardSession toggleSession(String sessionId, boolean active) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        session.setActive(active);
        return sessionRepository.save(session);
    }

    // ✅ Analytics
    public Map<String, Object> getAnalytics() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalSessions", sessionRepository.count());
        data.put("activeSessions", sessionRepository.countByActiveTrue());
        // Count unique online participants across active sessions
        long onlineUsers = sessionRepository.findByActiveTrue().stream()
                .flatMap(s -> s.getParticipants().stream())
                .filter(p -> Boolean.TRUE.equals(p.getIsOnline()))
                .map(Participant::getUserId)
                .distinct()
                .count();
        data.put("totalActiveUsers", onlineUsers);
        return data;
    }

    // ✅ Join Session by share code
    public Optional<WhiteboardSession> joinSession(String shareCode, String userId) {

        Optional<WhiteboardSession> optionalSession = sessionRepository.findByShareCode(shareCode);
        if (optionalSession.isEmpty()) return Optional.empty();

        WhiteboardSession session = optionalSession.get();

        boolean exists = session.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(userId));

        if (!exists) {
            session.getParticipants().add(
                    Participant.builder()
                            .userId(userId)
                            .role("EDITOR")
                            .isOnline(true)
                            .build()
            );
        }

        return Optional.of(sessionRepository.save(session));
    }

    // 🔒 Role check — used by DrawingController
    public boolean canEdit(String sessionId, String userId) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        return session.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(userId) &&
                        (p.getRole().equals("OWNER") || p.getRole().equals("EDITOR")));
    }

    // 🛑 Remove User
    public void removeUser(String sessionId, String userId) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.getParticipants().removeIf(p -> p.getUserId().equals(userId));
        sessionRepository.save(session);
    }

    // 🔁 Update Role
    public void updateRole(String sessionId, String userId, String role) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.getParticipants().forEach(p -> {
            if (p.getUserId().equals(userId)) p.setRole(role);
        });
        sessionRepository.save(session);
    }

    // 🔒 Lock (deactivate) Session
    public void lockSession(String sessionId) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setActive(false);
        sessionRepository.save(session);
    }

    // 🚪 Leave Session
    public void leaveSession(String sessionId, String userId) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.getParticipants().removeIf(p -> p.getUserId().equals(userId));
        sessionRepository.save(session);
    }
}