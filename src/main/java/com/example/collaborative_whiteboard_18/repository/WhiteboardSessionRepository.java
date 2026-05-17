package com.example.collaborative_whiteboard_18.repository;

import com.example.collaborative_whiteboard_18.model.WhiteboardSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WhiteboardSessionRepository extends MongoRepository<WhiteboardSession, String> {

    Optional<WhiteboardSession> findByShareCode(String shareCode);

    /** Find by status string (ACTIVE, PAUSED, ENDED, etc.) */
    List<WhiteboardSession> findByStatus(String status);

    long countByStatus(String status);
}