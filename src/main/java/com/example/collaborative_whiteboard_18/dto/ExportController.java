package com.example.collaborative_whiteboard_18.controller;

import com.example.collaborative_whiteboard_18.dto.ExportRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Base64;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    @PostMapping
    public ResponseEntity<?> export(@RequestBody ExportRequest request) {

        try {
            String base64Image = request.getImageBase64().split(",")[1];

            byte[] imageBytes = Base64.getDecoder().decode(base64Image);

            String filePath = "exports/" + request.getSessionId() + ".png";

            File file = new File(filePath);
            file.getParentFile().mkdirs();

            try (FileOutputStream fos = new FileOutputStream(file)) {
                fos.write(imageBytes);
            }

            return ResponseEntity.ok("Saved at: " + filePath);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Export failed");
        }
    }
}