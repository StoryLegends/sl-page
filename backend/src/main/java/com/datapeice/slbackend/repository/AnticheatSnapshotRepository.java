package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.AnticheatSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Repository
public interface AnticheatSnapshotRepository extends JpaRepository<AnticheatSnapshot, Long> {

    Page<AnticheatSnapshot> findByPlayerNameIgnoreCaseOrderByCreatedAtDesc(String playerName, Pageable pageable);

    boolean existsByPlayerNameIgnoreCaseAndSuspiciousTrue(String playerName);

    Page<AnticheatSnapshot> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT s FROM AnticheatSnapshot s WHERE LOWER(s.playerName) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY s.createdAt DESC")
    Page<AnticheatSnapshot> searchByPlayerName(String query, Pageable pageable);

    @Modifying
    @Transactional
    void deleteByCreatedAtBefore(LocalDateTime cutoff);
}
