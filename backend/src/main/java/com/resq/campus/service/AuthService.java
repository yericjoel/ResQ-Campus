package com.resq.campus.service;

import com.resq.campus.dto.Dtos.*;
import com.resq.campus.exception.ApiException;
import com.resq.campus.model.Enums.Role;
import com.resq.campus.model.User;
import com.resq.campus.repository.UserRepository;
import com.resq.campus.security.JwtService;
import com.resq.campus.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_FAILURES = 5;
    private static final Duration LOCK_TIME = Duration.ofMinutes(5);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final FileStorageService files;
    private final EmailVerificationService emailVerification;

    private record Attempts(int count, Instant lockedUntil) {}

    /** Very small brute-force guard: 5 wrong passwords lock that email for 5 minutes. */
    private final Map<String, Attempts> failures = new ConcurrentHashMap<>();

    @Transactional
    public UserDto register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        User u = new User();
        u.setName(req.name().trim());
        u.setEmail(email);
        u.setPassword(encoder.encode(req.password()));
        // Self-registration can only create STUDENT or STAFF accounts - never administrators.
        u.setRole(req.role() == Role.STAFF ? Role.STAFF : Role.STUDENT);
        u.setStudentId(blankToNull(req.studentId()));
        u.setDepartment(blankToNull(req.department()));
        u.setYear(req.year());
        u.setPhone(blankToNull(req.phone()));
        return Mapper.user(users.save(u));
    }

    public LoginResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        Attempts a = failures.get(email);
        if (a != null && a.lockedUntil() != null && a.lockedUntil().isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Try again in a few minutes.");
        }
        User user = users.findByEmailIgnoreCase(email).orElse(null);
        if (user == null || !encoder.matches(req.password(), user.getPassword())) {
            int count = (a == null ? 0 : a.count()) + 1;
            failures.put(email, new Attempts(count, count >= MAX_FAILURES ? Instant.now().plus(LOCK_TIME) : null));
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        if (!user.isActive()) throw new ApiException(HttpStatus.FORBIDDEN, "This account has been disabled");
        failures.remove(email);

        String devCode = emailVerification.generateAndSendCode(user.getEmail(), user.getName());
        return new LoginResponse(true, user.getEmail(), "A 6-digit verification code has been sent to your email.", devCode);
    }

    public AuthResponse verifyLogin(VerifyLoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User account not found"));
        if (!user.isActive()) throw new ApiException(HttpStatus.FORBIDDEN, "This account has been disabled");

        emailVerification.verifyCode(email, req.code());
        return new AuthResponse(jwt.generate(user), Mapper.user(user));
    }

    public ResendCodeResponse resendCode(ResendCodeRequest req) {
        String email = req.email().trim().toLowerCase();
        User user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "No account found for this email address"));
        if (!user.isActive()) throw new ApiException(HttpStatus.FORBIDDEN, "This account has been disabled");

        String devCode = emailVerification.resendCode(user.getEmail(), user.getName());
        return new ResendCodeResponse(true, "A new verification code has been sent to your email.", devCode);
    }

    public void logout(String token) {
        if (token != null) jwt.revoke(token);
    }

    public UserDto profile(Long userId) {
        return Mapper.user(find(userId));
    }

    @Transactional
    public UserDto updateProfile(Long userId, ProfileUpdateRequest req) {
        User u = find(userId);
        u.setName(req.name().trim());
        u.setStudentId(blankToNull(req.studentId()));
        u.setDepartment(blankToNull(req.department()));
        u.setYear(req.year());
        u.setPhone(blankToNull(req.phone()));
        u.setEmergencyContactName(blankToNull(req.emergencyContactName()));
        u.setEmergencyContactPhone(blankToNull(req.emergencyContactPhone()));
        return Mapper.user(u);
    }

    @Transactional
    public UserDto updatePhoto(Long userId, MultipartFile photo) {
        User u = find(userId);
        u.setProfileImage(files.storeImage(photo).url());
        return Mapper.user(u);
    }

    private User find(Long id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
    }

    private String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
