package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.GloryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GloryItemRepository extends JpaRepository<GloryItem, Long> {
    List<GloryItem> findByActiveTrueOrderBySortOrderAscIdAsc();

    List<GloryItem> findAllByOrderBySortOrderAscIdAsc();

    List<GloryItem> findByCategoryAndActiveTrueOrderBySortOrderAscIdAsc(String category);
}
