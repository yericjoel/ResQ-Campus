package com.resq.campus.security;

import com.resq.campus.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class JwtService {

    @Value("${resq.jwt.secret}")
    private String secret;

    @Value("${resq.jwt.expiration-hours:12}")
    private long expirationHours;

    private SecretKey key;

    /** Logged-out token ids and the time they expire (so the map cleans itself). */
    private final Map<String, Instant> revoked = new ConcurrentHashMap<>();

    @PostConstruct
    void init() {
        if (secret.length() < 32) {
            throw new IllegalStateException("resq.jwt.secret must be at least 32 characters");
        }
        if (secret.startsWith("dev-only")) {
            log.warn("Using the development JWT secret. Set JWT_SECRET before deploying.");
        }
        key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generate(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(user.getId()))
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(Duration.ofHours(expirationHours))))
                .signWith(key)
                .compact();
    }

    /** Returns the claims of a valid, non-revoked token, or null. */
    public Claims parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            Instant until = revoked.get(claims.getId());
            if (until != null) return null;
            return claims;
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public void revoke(String token) {
        Claims claims = parse(token);
        if (claims == null) return;
        Instant now = Instant.now();
        revoked.values().removeIf(exp -> exp.isBefore(now));
        revoked.put(claims.getId(), claims.getExpiration().toInstant());
    }
}
