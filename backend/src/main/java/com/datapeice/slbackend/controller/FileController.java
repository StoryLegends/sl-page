package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.service.FileStorageService;
import com.datapeice.slbackend.service.UserService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
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
        String objectKey = fileStorageService.uploadFile(file, "uploads");
        String proxyUrl = "/api/files/view/" + objectKey;
        return ResponseEntity.ok(Map.of("url", proxyUrl, "key", objectKey));
    }

    /**
     * Securely proxy photos/videos from MinIO S3 without exposing raw MinIO endpoints to public
     */
    @GetMapping("/view/**")
    public ResponseEntity<?> downloadFile(jakarta.servlet.http.HttpServletRequest request) {
        String fullPath = (String) request.getAttribute(org.springframework.web.servlet.HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String objectKey = fullPath.substring("/api/files/view/".length());

        InputStream is = fileStorageService.getObjectInputStream(objectKey);
        if (is == null) {
            return ResponseEntity.notFound().build();
        }

        String mimeType = "application/octet-stream";
        if (objectKey.endsWith(".png")) mimeType = "image/png";
        else if (objectKey.endsWith(".jpg") || objectKey.endsWith(".jpeg")) mimeType = "image/jpeg";
        else if (objectKey.endsWith(".webp")) mimeType = "image/webp";
        else if (objectKey.endsWith(".mp4")) mimeType = "video/mp4";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mimeType))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400, public")
                .body(new InputStreamResource(is));
    }
}
