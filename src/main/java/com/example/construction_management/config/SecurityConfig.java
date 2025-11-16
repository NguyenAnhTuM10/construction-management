package com.example.construction_management.config;

import com.example.construction_management.security.CustomUserDetailsService;
import com.example.construction_management.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(CustomUserDetailsService userDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Enable CORS
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // ===== AUTH ENDPOINTS - PUBLIC (KHÔNG CẦN TOKEN) =====
                        .requestMatchers(
                                "/construction/auth/login",
                                "/construction/auth/register",
                                "/construction/auth/refresh",
                                "/auth/**"
                        ).permitAll()

                        // ===== SWAGGER/API DOCS - PUBLIC =====
                        .requestMatchers(
                                // Context path version
                                "/construction/v3/api-docs/**",
                                "/construction/swagger-ui/**",
                                "/construction/swagger-ui.html",
                                "/construction/swagger-resources/**",
                                "/construction/webjars/**",
                                // Root path version
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**",
                                "/api-docs/**",
                                "/swagger-config"
                        ).permitAll()

                        // ===== PUBLIC RESOURCES =====
                        .requestMatchers("/public/**").permitAll()

                        // ===== ROLE-BASED ACCESS CONTROL =====
                        // Admin endpoints
                        .requestMatchers("/admin/**", "/construction/admin/**")
                        .hasRole("ADMIN")

                        // Sale endpoints
                        .requestMatchers("/sale/**", "/construction/sale/**")
                        .hasAnyRole("ADMIN", "SALE")

                        // Accountant endpoints
                        .requestMatchers("/accountant/**", "/construction/accountant/**")
                        .hasAnyRole("ADMIN", "ACCOUNTANT")

                        // ===== ALL OTHER REQUESTS NEED AUTHENTICATION =====
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS Configuration Bean
     * Xử lý CORS cho tất cả requests, bao gồm preflight OPTIONS
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Cho phép tất cả origins trong development
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));

        // Hoặc cụ thể hơn cho production:
        // configuration.setAllowedOrigins(Arrays.asList(
        //     "http://localhost:5173",
        //     "http://localhost:5174",
        //     "http://localhost:3000",
        //     "https://yourdomain.com"
        // ));

        // Cho phép các HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));

        // Cho phép tất cả headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Cho phép credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Cache preflight response (giảm số lượng OPTIONS requests)
        configuration.setMaxAge(3600L);

        // Expose headers để frontend có thể đọc
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Refresh-Token",
                "Content-Type"
        ));

        // Apply configuration cho tất cả paths
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}