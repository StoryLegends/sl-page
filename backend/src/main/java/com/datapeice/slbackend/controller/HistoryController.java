package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.entity.ServerHistory;
import com.datapeice.slbackend.service.ServerHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class HistoryController {

    private final ServerHistoryService serverHistoryService;

    public HistoryController(ServerHistoryService serverHistoryService) {
        this.serverHistoryService = serverHistoryService;
    }

    // Public API
    @GetMapping("/api/history")
    public ResponseEntity<List<ServerHistory>> getPublicHistory() {
        return ResponseEntity.ok(serverHistoryService.getPublicHistory());
    }

    @GetMapping("/api/history/{idOrSlug}")
    public ResponseEntity<ServerHistory> getHistoryBySlug(@PathVariable String idOrSlug) {
        return serverHistoryService.getPublicHistoryByIdOrSlug(idOrSlug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Admin API
    @GetMapping("/api/admin/history")
    public ResponseEntity<List<ServerHistory>> getAdminHistory() {
        return ResponseEntity.ok(serverHistoryService.getAllAdminHistory());
    }

    @PostMapping("/api/admin/history")
    public ResponseEntity<?> saveHistory(@RequestBody ServerHistory history) {
        try {
            return ResponseEntity.ok(serverHistoryService.saveHistory(history));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/admin/history/{id}")
    public ResponseEntity<Void> deleteHistory(@PathVariable Long id) {
        serverHistoryService.deleteHistory(id);
        return ResponseEntity.ok().build();
    }
}
