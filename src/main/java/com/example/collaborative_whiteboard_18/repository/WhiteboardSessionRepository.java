package com.example.collaborative_whiteboard_18.repository;

import com.example.collaborative_whiteboard_18.model.WhiteboardSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WhiteboardSessionRepository extends MongoRepository<WhiteboardSession, String> {

    Optional<WhiteboardSession> findByShareCode(String shareCode);

    // BUG FIX: field is now "active" (not "isActive") so method is findByActiveTrue
    List<WhiteboardSession> findByActiveTrue();

    long countByActiveTrue();
}