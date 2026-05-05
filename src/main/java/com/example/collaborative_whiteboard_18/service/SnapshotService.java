package com.example.collaborative_whiteboard_18.service;

import com.example.collaborative_whiteboard_18.model.WhiteboardSnapshot;
import com.example.collaborative_whiteboard_18.repository.WhiteboardSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SnapshotService {

    private final WhiteboardSnapshotRepository snapshotRepository;

    public WhiteboardSnapshot saveSnapshot(String sessionId, String fileUrl) {

        WhiteboardSnapshot snapshot = WhiteboardSnapshot.builder()
                .sessionId(sessionId)
                .fileUrl(fileUrl)
                .createdAt(LocalDateTime.now())
                .build();

        return snapshotRepository.save(snapshot);
    }

    public Optional<WhiteboardSnapshot> getLatestSnapshot(String sessionId) {

        List<WhiteboardSnapshot> list =
                snapshotRepository.findBySessionId(sessionId);

        return list.stream()
                .max(Comparator.comparing(WhiteboardSnapshot::getCreatedAt));
    }
}