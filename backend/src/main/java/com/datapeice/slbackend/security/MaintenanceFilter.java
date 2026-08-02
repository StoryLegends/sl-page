package com.datapeice.slbackend.security;

import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.entity.UserRole;
import com.datapeice.slbackend.service.SiteSettingsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class MaintenanceFilter extends OncePerRequestFilter {

    private final SiteSettingsService siteSettingsService;

    public MaintenanceFilter(@Lazy SiteSettingsService siteSettingsService) {
        this.siteSettingsService = siteSettingsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Check if maintenance mode is active
        if (siteSettingsService.getSettings().isMaintenanceMode()) {
            // Allow public settings endpoints, login page endpoint, anticheat telemetry, discord callback, websocket, and error page
            boolean isAllowedPublicPath = path.equals("/api/auth/public/settings")
                    || path.equals("/api/admin/settings/public")
                    || path.equals("/api/auth/login")
                    || path.equals("/api/auth/discord/callback")
                    || path.equals("/api/anticheat")
                    || path.startsWith("/ws/")
                    || path.equals("/error");

            if (!isAllowedPublicPath) {
                // If it is not a public path, check if the authenticated user is an admin or moderator
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                boolean isAdmin = false;
                if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User) {
                    User user = (User) auth.getPrincipal();
                    isAdmin = user.getRole() == UserRole.ROLE_ADMIN || user.getRole() == UserRole.ROLE_MODERATOR;
                }

                if (!isAdmin) {
                    response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"MAINTENANCE_MODE\",\"message\":\"На сайте ведутся технические работы\"}");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
