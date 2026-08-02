package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.dto.ApplicationResponse;
import com.datapeice.slbackend.dto.CreateApplicationRequest;
import com.datapeice.slbackend.dto.MyApplicationsResponse;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
    private final ApplicationService applicationService;
    private final com.datapeice.slbackend.service.AuditLogService auditLogService;
    private final SimpMessagingTemplate messagingTemplate;

    public ApplicationController(ApplicationService applicationService,
            com.datapeice.slbackend.service.AuditLogService auditLogService,
            SimpMessagingTemplate messagingTemplate) {
        this.applicationService = applicationService;
        this.auditLogService = auditLogService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping
    public ResponseEntity<?> createApplication(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateApplicationRequest request) {
        try {
            ApplicationResponse response = applicationService.createApplication(user, request);
            messagingTemplate.convertAndSend("/topic/admin/applications", response);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<MyApplicationsResponse> getMyApplications(@AuthenticationPrincipal User user) {
        MyApplicationsResponse response = applicationService.getMyApplications(user);
        return ResponseEntity.ok(response);
    }
}
