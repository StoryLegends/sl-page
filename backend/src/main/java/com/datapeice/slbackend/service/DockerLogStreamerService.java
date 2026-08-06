package com.datapeice.slbackend.service;

import com.datapeice.slbackend.websocket.AdminWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class DockerLogStreamerService {

    private static final Logger logger = LoggerFactory.getLogger(DockerLogStreamerService.class);

    private final AdminWebSocketHandler adminWebSocketHandler;
    private final Map<String, Process> activeProcesses = new ConcurrentHashMap<>();
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    public DockerLogStreamerService(@Lazy AdminWebSocketHandler adminWebSocketHandler) {
        this.adminWebSocketHandler = adminWebSocketHandler;
    }

    public synchronized void ensureStreaming(String serverId, String containerName) {
        Process proc = activeProcesses.get(serverId);
        if (proc != null && proc.isAlive()) {
            return;
        }

        executorService.submit(() -> {
            logger.info("Starting real-time docker log stream for {} ({})", serverId, containerName);
            try {
                ProcessBuilder pb;
                if (System.getProperty("os.name").toLowerCase().contains("win")) {
                    pb = new ProcessBuilder("cmd.exe", "/c", "docker logs -f --tail 100 " + containerName);
                } else {
                    pb = new ProcessBuilder("sh", "-c", "docker logs -f --tail 100 " + containerName);
                }
                pb.redirectErrorStream(true);
                Process process = pb.start();
                activeProcesses.put(serverId, process);

                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (!line.isBlank()) {
                            adminWebSocketHandler.broadcastToTopic("/topic/minecraft/logs/" + serverId, 
                                    Map.of("type", "log", "message", line, "serverId", serverId));
                        }
                    }
                }
                process.waitFor();
            } catch (Exception e) {
                logger.warn("Docker log stream ended for {}: {}", serverId, e.getMessage());
            } finally {
                activeProcesses.remove(serverId);
            }
        });
    }

    public void stopStreaming(String serverId) {
        Process proc = activeProcesses.remove(serverId);
        if (proc != null && proc.isAlive()) {
            proc.destroyForcibly();
        }
    }

    @PreDestroy
    public void cleanup() {
        for (Process proc : activeProcesses.values()) {
            if (proc.isAlive()) {
                proc.destroyForcibly();
            }
        }
        executorService.shutdownNow();
    }
}
