package com.resq.campus.service;

import com.resq.campus.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Handles generation, dispatch, rate-limiting and validation of one-time verification
 * codes (OTP) sent to users at login time.
 */
@Slf4j
@Service
public class EmailVerificationService {

    private static final Duration CODE_VALIDITY = Duration.ofMinutes(5);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(30);
    private static final int MAX_ATTEMPTS = 5;

    private final SecureRandom random = new SecureRandom();

    @Value("${resq.auth.show-dev-code:true}")
    private boolean showDevCode;

    public record CodeEntry(String code, Instant expiresAt, int attempts, Instant createdAt) {}

    private final Map<String, CodeEntry> pendingCodes = new ConcurrentHashMap<>();

    /**
     * Generates a 6-digit verification code, stores it with expiration, logs it,
     * and returns the code if running in dev/demo mode.
     */
    public String generateAndSendCode(String email, String userName) {
        String normalizedEmail = normalize(email);
        CodeEntry existing = pendingCodes.get(normalizedEmail);

        if (existing != null && existing.createdAt().plus(RESEND_COOLDOWN).isAfter(Instant.now())) {
            long remaining = Duration.between(Instant.now(), existing.createdAt().plus(RESEND_COOLDOWN)).toSeconds() + 1;
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Please wait " + remaining + " seconds before requesting a new verification code.");
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        Instant now = Instant.now();
        Instant expires = now.plus(CODE_VALIDITY);
        pendingCodes.put(normalizedEmail, new CodeEntry(code, expires, 0, now));

        // In real production, this would dispatch through JavaMailSender or Amazon SES / SendGrid.
        // For development, it prints clearly to console and is returned as devCode.
        log.info("""
                
                ================================================================================
                [EMAIL VERIFICATION OTP]
                To: {} ({})
                Code: {}
                Validity: 5 minutes (Expires at: {})
                ================================================================================""",
                normalizedEmail, userName != null ? userName : "User", code, expires);

        return showDevCode ? code : null;
    }

    /**
     * Validates an entered code against the active entry.
     */
    public void verifyCode(String email, String inputCode) {
        String normalizedEmail = normalize(email);
        CodeEntry entry = pendingCodes.get(normalizedEmail);

        if (entry == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No active verification code found. Please sign in again.");
        }

        if (entry.expiresAt().isBefore(Instant.now())) {
            pendingCodes.remove(normalizedEmail);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code has expired. Please sign in again to request a new code.");
        }

        if (entry.attempts() >= MAX_ATTEMPTS) {
            pendingCodes.remove(normalizedEmail);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Too many failed attempts. Please sign in again to request a new code.");
        }

        String sanitized = inputCode != null ? inputCode.replaceAll("\\s+", "").trim() : "";
        if (!entry.code().equals(sanitized)) {
            int newAttempts = entry.attempts() + 1;
            pendingCodes.put(normalizedEmail, new CodeEntry(entry.code(), entry.expiresAt(), newAttempts, entry.createdAt()));
            int remaining = MAX_ATTEMPTS - newAttempts;
            if (remaining <= 0) {
                pendingCodes.remove(normalizedEmail);
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid verification code. Maximum attempts exceeded. Please try logging in again.");
            }
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid verification code. " + remaining + " attempts remaining.");
        }

        // Successfully verified: clear the pending code
        pendingCodes.remove(normalizedEmail);
    }

    /**
     * Resends a code if the cooldown period has elapsed.
     */
    public String resendCode(String email, String userName) {
        return generateAndSendCode(email, userName);
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
