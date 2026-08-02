package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.dto.custompage.CreateCustomPageRequest;
import com.datapeice.slbackend.dto.custompage.CustomPageDto;
import com.datapeice.slbackend.service.CustomPageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/pages")
@PreAuthorize("hasRole('ADMIN')")
public class CustomPageAdminController {

    private final CustomPageService customPageService;

    public CustomPageAdminController(CustomPageService customPageService) {
        this.customPageService = customPageService;
    }

    @GetMapping
    public ResponseEntity<List<CustomPageDto>> getAllPages() {
        return ResponseEntity.ok(customPageService.getAllPages());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomPageDto> getPageById(@PathVariable Long id) {
        return ResponseEntity.ok(customPageService.getPageById(id));
    }

    @PostMapping
    public ResponseEntity<CustomPageDto> createPage(@RequestBody CreateCustomPageRequest request) {
        return ResponseEntity.ok(customPageService.createPage(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomPageDto> updatePage(@PathVariable Long id, @RequestBody CreateCustomPageRequest request) {
        return ResponseEntity.ok(customPageService.updatePage(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePage(@PathVariable Long id) {
        customPageService.deletePage(id);
        return ResponseEntity.noContent().build();
    }
}
