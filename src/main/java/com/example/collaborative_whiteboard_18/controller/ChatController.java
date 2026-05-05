package com.example.collaborative_whiteboard_18.controller;

import com.example.collaborative_whiteboard_18.model.ChatMessage;
import com.example.collaborative_whiteboard_18.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody ChatMessage message) {
        return ResponseEntity.ok(chatService.sendMessage(message));
    }

    // GET /api/chat/{sessionId}  — called by frontend chatAPI.getHistory(sessionId)
    @GetMapping("/{sessionId}")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable String sessionId) {
        return ResponseEntity.ok(chatService.getMessages(sessionId));
    }
}