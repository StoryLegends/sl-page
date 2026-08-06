package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.MinecraftServer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MinecraftServerRepository extends JpaRepository<MinecraftServer, Long> {
    Optional<MinecraftServer> findByServerId(String serverId);
    void deleteByServerId(String serverId);
}
