package com.datapeice.slbackend.service;

import com.datapeice.slbackend.entity.GloryItem;
import com.datapeice.slbackend.repository.GloryItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class GloryItemService {

    private final GloryItemRepository gloryItemRepository;

    public GloryItemService(GloryItemRepository gloryItemRepository) {
        this.gloryItemRepository = gloryItemRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, List<GloryItem>> getPublicGloryGrouped() {
        List<GloryItem> allActive = gloryItemRepository.findByActiveTrueOrderBySortOrderAscIdAsc();
        Map<String, List<GloryItem>> grouped = new LinkedHashMap<>();
        grouped.put("Legends", new ArrayList<>());
        grouped.put("ContenMakers", new ArrayList<>());
        grouped.put("Staff", new ArrayList<>());

        for (GloryItem item : allActive) {
            String cat = item.getCategory() != null ? item.getCategory() : "Legends";
            grouped.computeIfAbsent(cat, k -> new ArrayList<>()).add(item);
        }
        return grouped;
    }

    @Transactional(readOnly = true)
    public List<GloryItem> getAllAdminItems() {
        return gloryItemRepository.findAllByOrderBySortOrderAscIdAsc();
    }

    @Transactional
    public GloryItem saveItem(GloryItem item) {
        if (item.getName() == null || item.getName().isBlank()) {
            throw new IllegalArgumentException("Имя не может быть пустым");
        }
        if (item.getCategory() == null || item.getCategory().isBlank()) {
            item.setCategory("Legends");
        }
        return gloryItemRepository.save(item);
    }

    @Transactional
    public void deleteItem(Long id) {
        gloryItemRepository.deleteById(id);
    }
}
