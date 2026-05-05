package com.example.collaborative_whiteboard_18.repository;

import com.example.collaborative_whiteboard_18.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
}