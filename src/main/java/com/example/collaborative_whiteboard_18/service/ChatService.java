package com.example.collaborative_whiteboard_18.service;

import com.example.collaborative_whiteboard_18.model.ChatMessage;
import com.example.collaborative_whiteboard_18.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatRepository;

    public ChatMessage sendMessage(ChatMessage message) {
        message.setTimestamp(LocalDateTime.now());
        return chatRepository.save(message);
    }

    public List<ChatMessage> getMessages(String sessionId) {
        return chatRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }
}