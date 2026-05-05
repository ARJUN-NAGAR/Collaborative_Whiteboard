package com.example.collaborative_whiteboard_18.repository;

import com.example.collaborative_whiteboard_18.model.WhiteboardSnapshot;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface WhiteboardSnapshotRepository extends MongoRepository<WhiteboardSnapshot, String> {
    List<WhiteboardSnapshot> findBySessionId(String sessionId);
}