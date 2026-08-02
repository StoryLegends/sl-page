package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.dto.BotMessageRequest;
import com.datapeice.slbackend.dto.BotMessageResponse;
import com.datapeice.slbackend.dto.ConversationResponse;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.service.BotMessengerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/messenger")
@PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
public class BotMessengerController {

    private final BotMessengerService botMessengerService;

    public BotMessengerController(BotMessengerService botMessengerService) {
        this.botMessengerService = botMessengerService;
    }

    @GetMapping("/conversations")
    public ResponseEntity<ConversationResponse> getConversations() {
        return ResponseEntity.ok(botMessengerService.getConversations());
    }

    @GetMapping("/messages/{userId}")
    public ResponseEntity<List<BotMessageResponse>> getMessageHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(botMessengerService.getMessageHistory(userId));
    }

    @PostMapping("/messages")
    public ResponseEntity<BotMessageResponse> sendMessage(@AuthenticationPrincipal User admin,
                                                           @Valid @RequestBody BotMessageRequest request) {
        return ResponseEntity.ok(botMessengerService.sendMessage(admin.getId(), request));
    }

    @PatchMapping("/messages/{messageId}")
    public ResponseEntity<BotMessageResponse> editMessage(@PathVariable Long messageId,
                                                          @RequestBody Map<String, String> body) {
        String content = body.get("content");
        String mediaUrl = body.get("mediaUrl");
        return ResponseEntity.ok(botMessengerService.editMessage(messageId, content, mediaUrl));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long messageId) {
        botMessengerService.deleteMessage(messageId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/messages/{messageId}/react")
    public ResponseEntity<BotMessageResponse> toggleReaction(@PathVariable Long messageId,
                                                              @RequestParam String emoji) {
        return ResponseEntity.ok(botMessengerService.toggleReaction(messageId, emoji));
    }
}
