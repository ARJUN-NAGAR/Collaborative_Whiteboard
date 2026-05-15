package com.example.collaborative_whiteboard_18.service;

import com.example.collaborative_whiteboard_18.model.Participant;
import com.example.collaborative_whiteboard_18.model.WhiteboardSession;
import com.example.collaborative_whiteboard_18.repository.WhiteboardSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import com.mongodb.client.result.UpdateResult;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final WhiteboardSessionRepository sessionRepository;
    private final MongoTemplate mongoTemplate;

    // ── Create ───────────────────────────────────────────────────────────────
    public WhiteboardSession createSession(String name, String ownerName, String ownerId) {
        WhiteboardSession session = WhiteboardSession.builder()
                .name(name)
                .ownerName(ownerName)
                .createdBy(ownerId)
                .createdAt(LocalDateTime.now())
                .status("ACTIVE")
                .shareCode(UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .participants(new ArrayList<>())
                .elements(new ArrayList<>())
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

    // ── Read ─────────────────────────────────────────────────────────────────
    public List<WhiteboardSession> getAllSessions() {
        return sessionRepository.findAll();
    }

    public List<WhiteboardSession> getActiveSessions() {
        return sessionRepository.findByStatus("ACTIVE");
    }

    public Optional<WhiteboardSession> getSession(String sessionId) {
        return sessionRepository.findById(sessionId);
    }

    // ── Element persistence ───────────────────────────────────────────────────
    public WhiteboardSession updateElements(String sessionId, List<Map<String, Object>> elements) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        session.setElements(elements);
        return sessionRepository.save(session);
    }

    /** Atomic upsert of a single element (delta sync) */
    public void upsertElement(String sessionId, Map<String, Object> element) {
        String elementId = (String) element.get("id");
        if (elementId == null) return;

        Query matchExisting = new Query(
                Criteria.where("id").is(sessionId).and("elements.id").is(elementId));
        Update setInPlace = new Update().set("elements.$", element);
        UpdateResult result = mongoTemplate.updateFirst(matchExisting, setInPlace, WhiteboardSession.class);

        if (result.getModifiedCount() == 0) {
            Query matchSession = new Query(Criteria.where("id").is(sessionId));
            Update pushNew = new Update().push("elements", element);
            mongoTemplate.updateFirst(matchSession, pushNew, WhiteboardSession.class);
        }
    }

    // ── Delete ───────────────────────────────────────────────────────────────
    public void deleteSession(String sessionId) {
        sessionRepository.deleteById(sessionId);
    }

    // ── Status / Toggle ──────────────────────────────────────────────────────
    /**
     * Set a lifecycle status. Accepts any value from the frontend:
     * ACTIVE, INACTIVE, PAUSED, ENDED, ARCHIVED, etc.
     */
    public WhiteboardSession toggleSession(String sessionId, String newStatus) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        session.setStatus(newStatus);
        return sessionRepository.save(session);
    }

    // ── Analytics ────────────────────────────────────────────────────────────
    public Map<String, Object> getAnalytics() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalSessions",   sessionRepository.count());
        data.put("activeSessions",  sessionRepository.countByStatus("ACTIVE"));

        long onlineUsers = sessionRepository.findByStatus("ACTIVE").stream()
                .flatMap(s -> s.getParticipants().stream())
                .filter(p -> Boolean.TRUE.equals(p.getIsOnline()))
                .map(Participant::getUserId)
                .distinct()
                .count();
        data.put("totalActiveUsers", onlineUsers);
        return data;
    }

    // ── Participation ─────────────────────────────────────────────────────────
    public Optional<WhiteboardSession> joinSession(String shareCode, String userId) {
        Optional<WhiteboardSession> opt = sessionRepository.findByShareCode(shareCode);
        if (opt.isEmpty()) return Optional.empty();

        WhiteboardSession session = opt.get();
        boolean alreadyIn = session.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(userId));

        if (!alreadyIn) {
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

    public void leaveSession(String sessionId, String userId) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.getParticipants().removeIf(p -> p.getUserId().equals(userId));
        sessionRepository.save(session);
    }

    public void removeUser(String sessionId, String userId) {
        leaveSession(sessionId, userId);
    }

    public void updateRole(String sessionId, String userId, String role) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.getParticipants().forEach(p -> {
            if (p.getUserId().equals(userId)) p.setRole(role);
        });
        sessionRepository.save(session);
    }

    public void lockSession(String sessionId) {
        toggleSession(sessionId, "INACTIVE");
    }

    // ── RBAC helper ──────────────────────────────────────────────────────────
    /**
     * Returns true if the user is allowed to draw (OWNER, ADMIN, EDITOR, PRESENTER).
     * Viewers and Participants are read-only.
     */
    public boolean canEdit(String sessionId, String userId) {
        WhiteboardSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        return session.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(userId) &&
                        Set.of("OWNER", "ADMIN", "EDITOR", "PRESENTER").contains(p.getRole()));
    }
}