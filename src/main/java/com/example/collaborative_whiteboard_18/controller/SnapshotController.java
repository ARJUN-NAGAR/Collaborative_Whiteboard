package com.example.collaborative_whiteboard_18.controller;

import com.example.collaborative_whiteboard_18.model.WhiteboardSnapshot;
import com.example.collaborative_whiteboard_18.service.SnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/snapshots")
@RequiredArgsConstructor
public class SnapshotController {

    private final SnapshotService snapshotService;

    @PostMapping("/save")
    public ResponseEntity<?> saveSnapshot(
            @RequestParam String sessionId,
            @RequestParam String fileUrl) {

        return ResponseEntity.ok(
                snapshotService.saveSnapshot(sessionId, fileUrl)
        );
    }

    @GetMapping("/latest/{sessionId}")
    public ResponseEntity<?> getLatest(@PathVariable String sessionId) {

        Optional<WhiteboardSnapshot> snapshot =
                snapshotService.getLatestSnapshot(sessionId);

        return snapshot.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}