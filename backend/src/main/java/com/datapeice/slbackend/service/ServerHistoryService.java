package com.datapeice.slbackend.service;

import com.datapeice.slbackend.entity.ServerHistory;
import com.datapeice.slbackend.repository.ServerHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ServerHistoryService {

    private final ServerHistoryRepository serverHistoryRepository;

    public ServerHistoryService(ServerHistoryRepository serverHistoryRepository) {
        this.serverHistoryRepository = serverHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<ServerHistory> getPublicHistory() {
        return serverHistoryRepository.findByPublishedTrueOrderBySortOrderAscIdDesc();
    }

    @Transactional(readOnly = true)
    public Optional<ServerHistory> getPublicHistoryByIdOrSlug(String idOrSlug) {
        Optional<ServerHistory> bySlug = serverHistoryRepository.findByPathSlugAndPublishedTrue(idOrSlug);
        if (bySlug.isPresent()) {
            return bySlug;
        }

        try {
            Long id = Long.parseLong(idOrSlug);
            return serverHistoryRepository.findByIdAndPublishedTrue(id);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    @Transactional(readOnly = true)
    public List<ServerHistory> getAllAdminHistory() {
        return serverHistoryRepository.findAllByOrderBySortOrderAscIdDesc();
    }

    @Transactional
    public ServerHistory saveHistory(ServerHistory history) {
        if (history.getTitle() == null || history.getTitle().isBlank()) {
            throw new IllegalArgumentException("Заголовок истории не может быть пустым");
        }
        if (history.getPathSlug() == null || history.getPathSlug().isBlank()) {
            history.setPathSlug(UUIDSlug());
        }

        history.setUpdatedAt(LocalDateTime.now());
        if (history.getCreatedAt() == null) {
            history.setCreatedAt(LocalDateTime.now());
        }
        return serverHistoryRepository.save(history);
    }

    @Transactional
    public void deleteHistory(Long id) {
        serverHistoryRepository.deleteById(id);
    }

    private String UUIDSlug() {
        return String.valueOf(System.currentTimeMillis());
    }
}
