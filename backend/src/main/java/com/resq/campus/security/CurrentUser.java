package com.resq.campus.security;

import com.resq.campus.model.Enums.Role;

/** The authenticated user, available in controllers via @AuthenticationPrincipal. */
public record CurrentUser(Long id, String email, String name, Role role) {
    public boolean isAdmin() {
        return role.isAdminLike();
    }
}
