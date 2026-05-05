package com.example.collaborative_whiteboard_18.repository;

import com.example.collaborative_whiteboard_18.model.DrawingEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DrawingEventRepository extends MongoRepository<DrawingEvent, String> {
    List<DrawingEvent> findBySessionIdOrderByTimestampAsc(String sessionId);
}