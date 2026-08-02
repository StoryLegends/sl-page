package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.service.FileStorageService;
import com.datapeice.slbackend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

        private final FileStorageService fileStorageService;
        private final UserService userService;
        private final com.datapeice.slbackend.service.AuditLogService auditLogService;

        public FileController(FileStorageService fileStorageService, UserService userService,
                        com.datapeice.slbackend.service.AuditLogService auditLogService) {
                this.fileStorageService = fileStorageService;
                this.userService = userService;
                this.auditLogService = auditLogService;
        }

        @PostMapping("/upload")
        public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
                String objectKey = fileStorageService.uploadFile(file, "messenger");
                String url = fileStorageService.resolveUrl(objectKey);
                return ResponseEntity.ok(Map.of("url", url, "key", objectKey));
        }
}
