package com.resq.campus.security;

import com.resq.campus.model.User;
import com.resq.campus.repository.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

/** Turns a JWT into a Spring Security Authentication. Used by the HTTP filter and the STOMP interceptor. */
@Component
@RequiredArgsConstructor
public class TokenAuthenticator {

    private final JwtService jwtService;
    private final UserRepository users;

    /** @return the authentication, or null when the token is invalid or the account is disabled. */
    public Authentication authenticate(String token) {
        if (token == null || token.isBlank()) return null;
        Claims claims = jwtService.parse(token);
        if (claims == null) return null;
        Long userId;
        try {
            userId = Long.valueOf(claims.getSubject());
        } catch (NumberFormatException e) {
            return null;
        }
        User user = users.findById(userId).orElse(null);
        if (user == null || !user.isActive()) return null;

        CurrentUser principal = new CurrentUser(user.getId(), user.getEmail(), user.getName(), user.getRole());
        return new UsernamePasswordAuthenticationToken(principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
    }
}
