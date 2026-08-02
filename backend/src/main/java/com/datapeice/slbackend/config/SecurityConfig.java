package com.datapeice.slbackend.config;

import com.datapeice.slbackend.security.JwtRequestFilter;
import com.datapeice.slbackend.security.MaintenanceFilter;
import com.datapeice.slbackend.service.CustomUserDetailsService;
import com.datapeice.slbackend.security.CustomAccessDeniedHandler;
import com.datapeice.slbackend.security.CustomAuthenticationEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
        private final JwtRequestFilter jwtRequestFilter;
        private final MaintenanceFilter maintenanceFilter;
        private final CustomUserDetailsService userDetailsService;
        private final CustomAccessDeniedHandler customAccessDeniedHandler;
        private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

        SecurityConfig(JwtRequestFilter jwtRequestFilter,
                        MaintenanceFilter maintenanceFilter,
                        CustomUserDetailsService userDetailsService,
                        CustomAccessDeniedHandler customAccessDeniedHandler,
                        CustomAuthenticationEntryPoint customAuthenticationEntryPoint) {
                this.jwtRequestFilter = jwtRequestFilter;
                this.maintenanceFilter = maintenanceFilter;
                this.userDetailsService = userDetailsService;
                this.customAccessDeniedHandler = customAccessDeniedHandler;
                this.customAuthenticationEntryPoint = customAuthenticationEntryPoint;
        }

        @Bean
        public BCryptPasswordEncoder bCryptPasswordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public DaoAuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
                authProvider.setUserDetailsService(userDetailsService);
                authProvider.setPasswordEncoder(bCryptPasswordEncoder());
                return authProvider;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable())
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .exceptionHandling(exceptionHandling -> exceptionHandling
                                                .accessDeniedHandler(customAccessDeniedHandler)
                                                .authenticationEntryPoint(customAuthenticationEntryPoint))
                                .authenticationProvider(authenticationProvider()) // Explicitly set provider
                                .sessionManagement(sessionManagement -> sessionManagement
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // Discord OAuth2 callback - Discord redirects here without Origin
                                                // header
                                                .requestMatchers(HttpMethod.GET, "/api/auth/discord/callback")
                                                .permitAll()
                                                .requestMatchers(request -> request.getRequestURI()
                                                                .startsWith("/api/auth/") &&
                                                                request.getHeader("Origin") != null &&
                                                                java.util.Arrays.asList(
                                                                                "http://localhost:5173",
                                                                                "https://www.storylegends.xyz",
                                                                                "https://storylegends.xyz",
                                                                                "https://test.storylegends.xyz")
                                                                                .contains(request.getHeader("Origin")))
                                                .permitAll()
                                                .requestMatchers(request -> request.getMethod().equals("GET") &&
                                                                request.getRequestURI().equals("/api/users") &&
                                                                request.getHeader("Origin") != null &&
                                                                java.util.Arrays.asList(
                                                                                "http://localhost:5173",
                                                                                "https://www.storylegends.xyz",
                                                                                "https://storylegends.xyz",
                                                                                "https://test.storylegends.xyz")
                                                                                .contains(request.getHeader("Origin")))
                                                .permitAll()
                                                .requestMatchers(request -> request.getMethod().equals("GET") &&
                                                                request.getRequestURI().startsWith("/api/pages/") &&
                                                                request.getHeader("Origin") != null &&
                                                                java.util.Arrays.asList(
                                                                                "http://localhost:5173",
                                                                                "https://www.storylegends.xyz",
                                                                                "https://storylegends.xyz",
                                                                                "https://test.storylegends.xyz")
                                                                                .contains(request.getHeader("Origin")))
                                                .permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/anticheat").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/sponsorship/plans").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/sponsorship/webhook").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/sponsorship/session/**").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/reviews/public").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/reviews/history/**").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/glorylist").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/history/**").permitAll()
                                                .requestMatchers("/uploads/**").permitAll()
                                                .requestMatchers("/ws/**").permitAll()
                                                .requestMatchers("/error").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/settings/public").permitAll()
                                                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "MODERATOR")
                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterAfter(maintenanceFilter, JwtRequestFilter.class);

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "https://www.storylegends.xyz",
                                "https://storylegends.xyz", "https://test.storylegends.xyz"));
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(Arrays.asList("*"));
                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
                        throws Exception {
                return authenticationConfiguration.getAuthenticationManager();
        }
}
