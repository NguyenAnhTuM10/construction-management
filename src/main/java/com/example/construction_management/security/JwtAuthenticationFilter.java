package com.example.construction_management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    // Danh sách các path KHÔNG cần JWT authentication
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
            "/auth/",
            "/public/",
            "/v3/api-docs",
            "/swagger-ui",
            "/swagger-resources",
            "/webjars/",
            "/construction/v3/api-docs",
            "/construction/swagger-ui",
            "/swagger-ui.html",
            "/api-docs",
            "/swagger-config",
            "/favicon.ico"
    );

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   CustomUserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestPath = request.getRequestURI();

        // ✅ BỎ QUA JWT filter cho public paths
        if (isPublicPath(requestPath)) {
            System.out.println("✅ Public path detected, skipping JWT filter: " + requestPath);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = getJwtFromRequest(request);
            System.out.println("🔐 JwtAuthenticationFilter triggered for: " + requestPath);
            System.out.println("Token: " + (jwt != null ? "Present" : "null"));

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromToken(jwt);
                System.out.println("✅ Token hợp lệ - Username: " + username);

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("✅ Authentication set in SecurityContext");
            } else {
                System.out.println("⚠️ No valid token for protected path: " + requestPath);
                // KHÔNG block request, để SecurityConfig xử lý authorization
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
            ex.printStackTrace();
        }

        // ✅ LUÔN cho request đi tiếp (SecurityConfig sẽ quyết định allow/deny)
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * Kiểm tra path có phải public không
     */
    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    /**
     * Override để Spring biết path nào không cần filter
     * (Cách tối ưu hơn là dùng method này thay vì check trong doFilterInternal)
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        boolean shouldSkip = isPublicPath(path);
        if (shouldSkip) {
            System.out.println("⏭️ Skipping filter for: " + path);
        }
        return shouldSkip;
    }
}