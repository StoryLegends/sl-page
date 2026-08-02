package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.CustomPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomPageRepository extends JpaRepository<CustomPage, Long> {
    Optional<CustomPage> findByPath(String path);
    boolean existsByPath(String path);
}
