package com.resq.campus.controller;

import com.resq.campus.dto.Dtos.AdminUserUpdate;
import com.resq.campus.dto.Dtos.ResponderDto;
import com.resq.campus.dto.Dtos.UserDto;
import com.resq.campus.exception.ApiException;
import com.resq.campus.model.Enums.Role;
import com.resq.campus.model.User;
import com.resq.campus.repository.UserRepository;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** User management. Every route here requires the ADMIN or SECURITY role (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository users;

    @GetMapping("/users")
    public List<UserDto> listUsers() {
        return users.findAllByOrderByCreatedAtDesc().stream().map(Mapper::user).toList();
    }

    @PutMapping("/users/{id}")
    @Transactional
    public UserDto updateUser(@AuthenticationPrincipal CurrentUser me, @PathVariable Long id,
                              @RequestBody AdminUserUpdate req) {
        User user = users.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
        if (user.getId().equals(me.id())
                && ((req.role() != null && !req.role().isAdminLike()) || Boolean.FALSE.equals(req.active()))) {
            throw ApiException.badRequest("You cannot remove your own admin access or disable your own account");
        }
        // SECURITY officers manage students/staff only; touching an ADMIN account or granting ADMIN needs an ADMIN.
        if (me.role() != Role.ADMIN && (user.getRole() == Role.ADMIN || req.role() == Role.ADMIN)) {
            throw ApiException.forbidden("Only an administrator can change administrator accounts");
        }
        if (req.role() != null) user.setRole(req.role());
        if (req.active() != null) user.setActive(req.active());
        return Mapper.user(user);
    }

    @GetMapping("/responders")
    public List<ResponderDto> responders() {
        return users.findByRoleInAndActiveTrue(List.of(Role.ADMIN, Role.SECURITY)).stream()
                .map(u -> new ResponderDto(u.getId(), u.getName(), u.getRole())).toList();
    }
}
