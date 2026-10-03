package com.resq.campus.controller;

import com.resq.campus.dto.Dtos.ProfileUpdateRequest;
import com.resq.campus.dto.Dtos.UserDto;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService auth;

    @GetMapping("/profile")
    public UserDto profile(@AuthenticationPrincipal CurrentUser me) {
        return auth.profile(me.id());
    }

    @PutMapping("/profile")
    public UserDto update(@AuthenticationPrincipal CurrentUser me, @Valid @RequestBody ProfileUpdateRequest request) {
        return auth.updateProfile(me.id(), request);
    }

    @PostMapping("/profile/photo")
    public UserDto photo(@AuthenticationPrincipal CurrentUser me, @RequestParam("photo") MultipartFile photo) {
        return auth.updatePhoto(me.id(), photo);
    }
}
