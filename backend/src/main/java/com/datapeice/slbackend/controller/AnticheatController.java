package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.dto.AnticheatPayloadRequest;
import com.datapeice.slbackend.dto.AnticheatSnapshotResponse;
import com.datapeice.slbackend.dto.KnownModDto;
import com.datapeice.slbackend.dto.KnownModRequest;
import com.datapeice.slbackend.service.AnticheatService;
import com.datapeice.slbackend.service.AuditLogService;
import com.datapeice.slbackend.service.KnownModService;
import com.datapeice.slbackend.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@Slf4j
public class AnticheatController {

    private final AnticheatService anticheatService;
    private final AuditLogService auditLogService;
    private final KnownModService knownModService;

    @Value("${anticheat.allowed-ips:}")
    private String allowedIpsRaw;

    @Value("${anticheat.api-key:}")
    private String apiKey;

    public AnticheatController(AnticheatService anticheatService,
                               AuditLogService auditLogService,
                               KnownModService knownModService) {
        this.anticheatService = anticheatService;
        this.auditLogService = auditLogService;
        this.knownModService = knownModService;
    }

    // ==================== Public endpoint (from Minecraft server) ====================

    /**
     * Receive anticheat telemetry from Minecraft server.
     * Protected by IP whitelist + API key (not JWT).
     */
    @PostMapping("/api/anticheat")
    public ResponseEntity<?> receiveAnticheatData(
            @RequestBody AnticheatPayloadRequest request,
            @RequestHeader(value = "X-Anticheat-Key", required = false) String providedKey,
            HttpServletRequest httpRequest) {

        String clientIp = getClientIp(httpRequest);

        // Validate API key
        if (apiKey != null && !apiKey.isBlank()) {
            if (providedKey == null || !providedKey.equals(apiKey)) {
                log.warn("[Anticheat] Rejected request from {} - invalid API key", clientIp);
                return ResponseEntity.status(403).body(Map.of("error", "Invalid API key"));
            }
        }

        // Validate IP (0.0.0.0 = accept from all)
        if (allowedIpsRaw != null && !allowedIpsRaw.isBlank()) {
            List<String> allowedIps = Arrays.stream(allowedIpsRaw.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();

            if (!allowedIps.isEmpty() && !allowedIps.contains("0.0.0.0") && !allowedIps.contains(clientIp)) {
                log.warn("[Anticheat] Rejected request from unauthorized IP: {}", clientIp);
                return ResponseEntity.status(403).body(Map.of("error", "IP not allowed"));
            }
        }

        // Validate payload
        if (request.getPlayer() == null || request.getPlayer().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Player name is required"));
        }

        try {
            anticheatService.saveSnapshot(request);
            log.info("[Anticheat] Accepted snapshot from player {} (IP: {})", request.getPlayer(), clientIp);
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (Exception e) {
            log.error("[Anticheat] Failed to save snapshot for player {}", request.getPlayer(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to save snapshot"));
        }
    }

    // ==================== Admin endpoints ====================

    /**
     * Get all anticheat snapshots (paginated, searchable).
     */
    @GetMapping("/api/admin/anticheat/snapshots")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Page<AnticheatSnapshotResponse>> getAllSnapshots(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(anticheatService.getAllSnapshots(query, pageable));
    }

    /**
     * Get snapshots for a specific player.
     */
    @GetMapping("/api/admin/anticheat/players/{playerName}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Page<AnticheatSnapshotResponse>> getPlayerSnapshots(
            @PathVariable String playerName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(anticheatService.getSnapshotsByPlayer(playerName, pageable));
    }

    /**
     * Get a single snapshot by ID.
     */
    @GetMapping("/api/admin/anticheat/snapshots/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<?> getSnapshot(@PathVariable Long id, 
                                         @RequestParam(required = false, defaultValue = "false") boolean log,
                                         @AuthenticationPrincipal User admin) {
        try {
            if (log) {
                auditLogService.logAction(
                        admin.getId(), admin.getUsername(),
                        "ANTICHEAT_VIEW_SNAPSHOT",
                        "Открыл логи снимка #" + id,
                        null, null
                );
            }
            return ResponseEntity.ok(anticheatService.getSnapshotById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Request an anticheat snapshot from a player via RCON.
     */
    @PostMapping("/api/admin/anticheat/request/{playerName}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<?> requestSnapshot(
            @PathVariable String playerName,
            @AuthenticationPrincipal User admin) {

        boolean success = anticheatService.requestSnapshot(playerName);

        auditLogService.logAction(
                admin.getId(), admin.getUsername(),
                "ANTICHEAT_REQUEST_SNAPSHOT",
                "Запросил снимок античита для игрока " + playerName,
                null, playerName
        );

        if (success) {
            return ResponseEntity.ok(Map.of(
                    "status", "ok",
                    "message", "Запрос на снимок отправлен для " + playerName
            ));
        } else {
            return ResponseEntity.status(503).body(Map.of(
                    "error", "RCON unavailable",
                    "message", "Не удалось отправить команду. RCON не доступен."
            ));
        }
    }

    /**
     * Extract real client IP considering proxies (Heroku uses X-Forwarded-For).
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // ==================== Known Mods endpoints ====================

    /** Get all known (trusted/suspicious) mods */
    @GetMapping("/api/admin/anticheat/known-mods")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<List<KnownModDto>> getKnownMods() {
        return ResponseEntity.ok(knownModService.getAll());
    }

    /** Create or update a known mod (upsert by name) */
    @PostMapping("/api/admin/anticheat/known-mods")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KnownModDto> saveKnownMod(
            @Valid @RequestBody KnownModRequest request,
            @AuthenticationPrincipal User admin) {

        KnownModDto saved = knownModService.save(request, admin.getUsername());
        return ResponseEntity.ok(saved);
    }

    /** Delete a known mod by id */
    @DeleteMapping("/api/admin/anticheat/known-mods/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteKnownMod(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {

        knownModService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Deleted known mod"));
    }

    /** Delete a known mod by name */
    @DeleteMapping("/api/admin/anticheat/known-mods/name/{name}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteKnownModByName(
            @PathVariable String name,
            @AuthenticationPrincipal User admin) {

        knownModService.deleteByName(name);
        return ResponseEntity.ok(Map.of("message", "Deleted known mod by name"));
    }
}
