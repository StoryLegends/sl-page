package com.datapeice.slbackend.security;

import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.service.CustomUserDetailsService;
import com.datapeice.slbackend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {
    private final JwtCore jwtCore;
    private final CustomUserDetailsService customUserDetailsService;
    private final UserRepository userRepository;
    private final com.datapeice.slbackend.service.AuditLogService auditLogService;

    public JwtRequestFilter(JwtCore jwtCore,
            CustomUserDetailsService customUserDetailsService,
            UserRepository userRepository,
            com.datapeice.slbackend.service.AuditLogService auditLogService) {
        this.jwtCore = jwtCore;
        this.customUserDetailsService = customUserDetailsService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    private String getClientIP(HttpServletRequest request) {
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) {
            return cfIp.trim();
        }
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                String ipAddress = getClientIP(request);
                String userAgent = request.getHeader("User-Agent");

                try {
                    // 1. Извлекаем username
                    String username = jwtCore.getUsernameFromToken(token);

                    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        // 2. Загружаем пользователя
                        User user = (User) customUserDetailsService.loadUserByUsername(username);

                        // 3. Валидируем токен (UA + Version)
                        if (jwtCore.validateToken(token, ipAddress, userAgent, user.getTokenVersion())) {
                            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    user.getAuthorities());
                            SecurityContextHolder.getContext().setAuthentication(authToken);
                        }
                    }
                } catch (RuntimeException e) {
                    String msg = e.getMessage();
                    if ("FINGERPRINT_MISMATCH".equals(msg)) {
                        logger.warn("UserAgent mismatch! Revoking all tokens for user.");
                        String username = jwtCore.getUsernameFromToken(token);

                        auditLogService.logSecurityIncident(username, "FINGERPRINT_MISMATCH",
                                "Попытка использования токена с другим User-Agent. Все сессии пользователя аннулированы.",
                                ipAddress, userAgent);

                        userRepository.findByUsername(username).ifPresent(u -> {
                            u.setTokenVersion(u.getTokenVersion() + 1);
                            userRepository.save(u);
                        });
                    } else if ("TOKEN_VERSION_MISMATCH".equals(msg)) {
                        logger.info("Outdated token version rejected.");
                        String username = jwtCore.getUsernameFromToken(token);
                        auditLogService.logSecurityIncident(username, "TOKEN_VERSION_MISMATCH",
                                "Попытка входа по устаревшему/аннулированному токену.", ipAddress, userAgent);
                    }
                }
            } catch (Exception e) {
                logger.error("JWT validation error: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
