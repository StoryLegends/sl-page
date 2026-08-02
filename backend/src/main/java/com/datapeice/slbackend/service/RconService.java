package com.datapeice.slbackend.service;

import lombok.extern.slf4j.Slf4j;
import xin.vanilla.rcon.Rcon;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class RconService {

    @Value("${minecraft.rcon.enabled}")
    private boolean enabled;

    @Value("${minecraft.rcon.ip}")
    private String ip;

    @Value("${minecraft.rcon.port}")
    private int port;

    @Value("${minecraft.rcon.password}")
    private String password;

    public boolean sendCommand(String command) {
        if (!enabled) {
            log.info("RCON disabled. Skipping command: {}", command);
            return false;
        }

        log.info("Sending RCON command: {}", command);
        try (Rcon rcon = Rcon.open(ip, port, java.nio.charset.StandardCharsets.UTF_8)) {
            if (rcon.authenticate(password)) {
                String result = rcon.sendCommand(command);
                log.info("RCON command result: {}", result);
                return true;
            } else {
                log.error("Failed to authenticate to RCON server at {}:{}", ip, port);
            }
        } catch (IOException e) {
            log.error("Error connecting to RCON server (IP: {}, Port: {}): ", ip, port, e);
        } catch (Exception e) {
            log.error("Unexpected error executing RCON command", e);
        }
        return false;
    }

    @Async
    public void addPlayerToWhitelist(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            return;
        }
        sendCommand("easywhitelist add " + nickname);
    }

    @Async
    public void removePlayerFromWhitelist(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            return;
        }
        sendCommand("easywhitelist remove " + nickname);
    }

    @Async
    public void resetPlayerPassword(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            return;
        }
        sendCommand("auth remove " + nickname);
    }
    @Async
    public void kickPlayerWithBanMessage(String nickname, String reason) {
        if (nickname == null || nickname.trim().isEmpty()) {
            return;
        }

        String normalizedReason = (reason == null || reason.trim().isEmpty())
                ? "Причина не указана"
                : reason.replace("\r", " ").replace("\n", " ").trim();
        sendCommand("kick " + nickname + " Вы забанены! Причина: " + normalizedReason);
    }

    /**
     * Request an anticheat snapshot from a player via RCON.
     * Sends: /camera anticheat <playerName>
     */
    public boolean requestAnticheatSnapshot(String playerName) {
        if (playerName == null || playerName.trim().isEmpty()) {
            return false;
        }
        return sendCommand("camera anticheat " + playerName);
    }
}

