package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.entity.GloryItem;
import com.datapeice.slbackend.service.GloryItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class GloryListController {

    private final GloryItemService gloryItemService;

    public GloryListController(GloryItemService gloryItemService) {
        this.gloryItemService = gloryItemService;
    }

    // Public API
    @GetMapping("/api/glorylist")
    public ResponseEntity<Map<String, List<GloryItem>>> getPublicGloryList() {
        return ResponseEntity.ok(gloryItemService.getPublicGloryGrouped());
    }

    // Admin API
    @GetMapping("/api/admin/glorylist")
    public ResponseEntity<List<GloryItem>> getAdminGloryItems() {
        return ResponseEntity.ok(gloryItemService.getAllAdminItems());
    }

    @PostMapping("/api/admin/glorylist")
    public ResponseEntity<?> saveGloryItem(@RequestBody GloryItem item) {
        try {
            return ResponseEntity.ok(gloryItemService.saveItem(item));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/admin/glorylist/{id}")
    public ResponseEntity<Void> deleteGloryItem(@PathVariable Long id) {
        gloryItemService.deleteItem(id);
        return ResponseEntity.ok().build();
    }
}
