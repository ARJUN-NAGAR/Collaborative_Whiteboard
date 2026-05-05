package com.example.collaborative_whiteboard_18.service;

import com.example.collaborative_whiteboard_18.model.DrawingEvent;
import com.example.collaborative_whiteboard_18.repository.DrawingEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DrawingService {

    private final DrawingEventRepository drawingEventRepository;

    public DrawingEvent saveEvent(DrawingEvent event) {
        event.setTimestamp(LocalDateTime.now());
        return drawingEventRepository.save(event);
    }

    public List<DrawingEvent> getSessionEvents(String sessionId) {
        return drawingEventRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }
}