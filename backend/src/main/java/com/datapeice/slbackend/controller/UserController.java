package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.dto.UpdateUserRequest;
import com.datapeice.slbackend.dto.UserResponse;
import com.datapeice.slbackend.dto.PublicUserResponse;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final com.datapeice.slbackend.service.AuditLogService auditLogService;

    public UserController(UserService userService, com.datapeice.slbackend.service.AuditLogService auditLogService) {
        this.userService = userService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(@AuthenticationPrincipal User user, HttpServletRequest request) {
        return ResponseEntity.ok(userService.getUserProfile(user));
    }

    @PatchMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateUserRequest request,
            HttpServletRequest requestObj) {
        try {
            UserResponse response = userService.updateUserProfile(user, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<PublicUserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublicUserResponse> getPublicUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getPublicUser(id));
    }


}
