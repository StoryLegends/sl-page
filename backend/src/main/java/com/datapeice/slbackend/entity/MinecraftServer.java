package com.datapeice.slbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "minecraft_servers")
@Data
public class MinecraftServer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    private Long id;

    @JsonProperty("id")
    @Column(unique = true, nullable = false)
    private String serverId; // e.g. "server-1"

    @Column(nullable = false)
    private String name;

    private String containerName;
    private String version;
    private String type;
    private int port;
    private int rconPort;
    private String memory;
    private String javaVersion;
    private int cpuLimit;
    private String swapMemory;
    private String diskSpace;
    private String motd;
    private boolean onlineMode;
    private int maxPlayers;
    private String autoRestart;
    private String path;
    private String rconIp;
    private String rconPassword;
    private boolean rconEnabled;
}
