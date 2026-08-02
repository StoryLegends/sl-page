package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.ServerHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServerHistoryRepository extends JpaRepository<ServerHistory, Long> {
    List<ServerHistory> findByPublishedTrueOrderBySortOrderAscIdDesc();

    List<ServerHistory> findAllByOrderBySortOrderAscIdDesc();

    Optional<ServerHistory> findByPathSlug(String pathSlug);

    Optional<ServerHistory> findByPathSlugAndPublishedTrue(String pathSlug);

    Optional<ServerHistory> findByIdAndPublishedTrue(Long id);
}
