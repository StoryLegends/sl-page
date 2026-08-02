package com.datapeice.slbackend.security;

import com.datapeice.slbackend.entity.User;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import io.jsonwebtoken.security.Keys;

import java.util.Date;
import java.security.MessageDigest;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

@Component
public class JwtCore {
    @Value("${spring.security.key}")
    private String secretKey;
    private long lifetime = 604800000; // 7 days

    private SecretKey key(String secretKey) {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    public String generateFingerprint(String ipAddress, String userAgent) {
        // Remove IP because on Heroku/cloud it changes often (different load balancers)
        // Only use UserAgent for a mild device-based fingerprinting
        String base = (userAgent != null ? userAgent : "");
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(base.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            return String.valueOf(base.hashCode());
        }
    }

    public String generateToken(Authentication authentication, String ipAddress, String userAgent) {
        User user = (User) authentication.getPrincipal();
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("fp", generateFingerprint(ipAddress, userAgent))
                .claim("v", user.getTokenVersion())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + lifetime))
                .signWith(key(this.secretKey))
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(key(this.secretKey))
                .build().parseSignedClaims(token)
                .getPayload().getSubject();
    }

    public boolean validateToken(String token, String ipAddress, String userAgent, Integer expectedVersion) {
        try {
            var claims = Jwts.parser().verifyWith(key(this.secretKey)).build().parseSignedClaims(token).getPayload();

            // 1. Проверка версии токена
            Integer tokenVersion = claims.get("v", Integer.class);
            if (tokenVersion == null)
                tokenVersion = 0; // Старые токены считаем версией 0

            if (expectedVersion != null && !tokenVersion.equals(expectedVersion)) {
                throw new RuntimeException("TOKEN_VERSION_MISMATCH");
            }

            // 2. Проверка Fingerprint
            String tokenFp = claims.get("fp", String.class);
            String currentFp = generateFingerprint(ipAddress, userAgent);
            if (tokenFp != null && !tokenFp.equals(currentFp)) {
                throw new RuntimeException("FINGERPRINT_MISMATCH");
            }

            return true;
        } catch (RuntimeException e) {
            String msg = e.getMessage();
            if ("FINGERPRINT_MISMATCH".equals(msg) || "TOKEN_VERSION_MISMATCH".equals(msg)) {
                throw e;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    public String getFingerprintFromToken(String token) {
        try {
            return Jwts.parser().verifyWith(key(this.secretKey)).build().parseSignedClaims(token)
                    .getPayload().get("fp", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public Integer getVersionFromToken(String token) {
        try {
            return Jwts.parser().verifyWith(key(this.secretKey)).build().parseSignedClaims(token)
                    .getPayload().get("v", Integer.class);
        } catch (Exception e) {
            return null;
        }
    }

}
