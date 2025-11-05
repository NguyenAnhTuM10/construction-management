package com.example.construction_management.config;



import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Setter
@Getter
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    private String secret = "mySecretKeyForJWTTokenGenerationAndValidation12345678901234567890";
    private long accessTokenExpiration = 86400000; // 1 day
    private long refreshTokenExpiration = 604800000; // 7 days

}