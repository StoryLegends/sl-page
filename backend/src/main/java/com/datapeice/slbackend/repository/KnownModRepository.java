package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.KnownMod;
import com.datapeice.slbackend.entity.KnownModStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KnownModRepository extends JpaRepository<KnownMod, Long> {
    Optional<KnownMod> findByNameIgnoreCase(String name);
    List<KnownMod> findByStatus(KnownModStatus status);
    List<KnownMod> findAllByOrderByStatusAscNameAsc();
}
