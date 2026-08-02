package com.datapeice.slbackend.service;

import com.datapeice.slbackend.dto.KnownModDto;
import com.datapeice.slbackend.dto.KnownModRequest;
import com.datapeice.slbackend.entity.KnownMod;
import com.datapeice.slbackend.entity.KnownModStatus;
import com.datapeice.slbackend.repository.KnownModRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnownModService {

    private final KnownModRepository repository;

    public List<KnownModDto> getAll() {
        return repository.findAllByOrderByStatusAscNameAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public KnownModDto save(KnownModRequest request, String adminUsername) {
        // Upsert by name (case-insensitive)
        KnownMod mod = repository.findByNameIgnoreCase(request.getName().trim())
                .orElseGet(KnownMod::new);

        mod.setName(request.getName().trim().toLowerCase());
        mod.setStatus(request.getStatus());
        mod.setNotes(request.getNotes());
        mod.setAddedBy(adminUsername);

        KnownMod saved = repository.save(mod);
        log.info("[KnownMods] {} saved mod '{}' as {}", adminUsername, saved.getName(), saved.getStatus());
        return toDto(saved);
    }

    public void delete(Long id) {
        repository.deleteById(id);
        log.info("[KnownMods] Deleted known mod id={}", id);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteByName(String name) {
        repository.findByNameIgnoreCase(name.trim().toLowerCase())
                .ifPresent(mod -> {
                    repository.delete(mod);
                    log.info("[KnownMods] Deleted known mod name='{}'", name);
                });
    }

    /**
     * Resolve the status of a mod filename against the known mods list.
     * Uses case-insensitive substring matching.
     * @param modFilename full filename like "sodium-0.7.3+mc1.21.10.jar"
     * @param knownMods pre-loaded list (for performance)
     * @return "TRUSTED", "SUSPICIOUS", or "UNKNOWN"
     */
    public String resolveModStatus(String modFilename, List<KnownMod> knownMods) {
        if (modFilename == null) return "UNKNOWN";
        String lower = modFilename.toLowerCase();

        // Suspicious takes priority over trusted
        boolean isSuspicious = knownMods.stream()
                .filter(m -> m.getStatus() == KnownModStatus.SUSPICIOUS)
                .anyMatch(m -> lower.contains(m.getName()));

        if (isSuspicious) return "SUSPICIOUS";

        boolean isTrusted = knownMods.stream()
                .filter(m -> m.getStatus() == KnownModStatus.TRUSTED)
                .anyMatch(m -> lower.contains(m.getName()));

        return isTrusted ? "TRUSTED" : "UNKNOWN";
    }

    public List<KnownMod> findAll() {
        return repository.findAll();
    }

    private KnownModDto toDto(KnownMod mod) {
        return new KnownModDto(
                mod.getId(),
                mod.getName(),
                mod.getStatus(),
                mod.getAddedBy(),
                mod.getNotes(),
                mod.getCreatedAt()
        );
    }
}
