package com.datapeice.slbackend.config;

import com.datapeice.slbackend.security.JwtRequestFilter;
import com.datapeice.slbackend.security.MaintenanceFilter;
import com.datapeice.slbackend.service.CustomUserDetailsService;
import com.datapeice.slbackend.security.CustomAccessDeniedHandler;
import com.datapeice.slbackend.security.CustomAuthenticationEntryPoint;
import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

        @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:5174,https://www.storylegends.xyz,https://storylegends.xyz}")
        private String allowedOrigins;

        private final CustomUserDetailsService userDetailsService;
        private final JwtRequestFilter jwtRequestFilter;
        private final MaintenanceFilter maintenanceFilter;
        private final CustomAccessDeniedHandler customAccessDeniedHandler;
        private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

        public SecurityConfig(CustomUserDetailsService userDetailsService,
                        JwtRequestFilter jwtRequestFilter,
                        MaintenanceFilter maintenanceFilter,
                        CustomAccessDeniedHandler customAccessDeniedHandler,
                        CustomAuthenticationEntryPoint customAuthenticationEntryPoint) {
                this.userDetailsService = userDetailsService;
                this.jwtRequestFilter = jwtRequestFilter;
                this.maintenanceFilter = maintenanceFilter;
                this.customAccessDeniedHandler = customAccessDeniedHandler;
                this.customAuthenticationEntryPoint = customAuthenticationEntryPoint;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public DaoAuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
                authProvider.setUserDetailsService(userDetailsService);
                authProvider.setPasswordEncoder(passwordEncoder());
                return authProvider;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable())
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .exceptionHandling(exceptions -> exceptions
                                                .authenticationEntryPoint(customAuthenticationEntryPoint)
                                                .accessDeniedHandler(customAccessDeniedHandler))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                                .requestMatchers("/api/auth/**", "/api/auth/verify", "/api/history/**", "/api/seasons/**").permitAll()
                                                .requestMatchers("/api/custom-pages/slug/**").permitAll()
                                                .requestMatchers("/api/glorylist/**", "/api/reviews/public/**").permitAll()
                                                .requestMatchers("/api/sponsorship-plans/public/**").permitAll()
                                                .requestMatchers("/api/totp/verify", "/api/totp/qr").permitAll()
                                                .requestMatchers("/api/anticheat/snapshot").permitAll()
                                                .requestMatchers("/api/files/view/**").permitAll()
                                                .requestMatchers("/actuator/health", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                                                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "MODERATOR")
                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterAfter(maintenanceFilter, JwtRequestFilter.class);

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                List<String> origins = Arrays.stream(allowedOrigins.split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .collect(Collectors.toList());

                if (origins.contains("*") || origins.isEmpty()) {
                        configuration.addAllowedOriginPattern("*");
                } else {
                        configuration.setAllowedOrigins(origins);
                }

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
