package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.dto.custompage.CustomPageDto;
import com.datapeice.slbackend.service.CustomPageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pages")
public class CustomPagePublicController {

    private final CustomPageService customPageService;

    public CustomPagePublicController(CustomPageService customPageService) {
        this.customPageService = customPageService;
    }

    @GetMapping("/{path}")
    public ResponseEntity<CustomPageDto> getPageByPath(@PathVariable String path) {
        return ResponseEntity.ok(customPageService.getPageByPath(path));
    }
}
