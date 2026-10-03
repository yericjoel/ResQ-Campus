package com.resq.campus.controller;

import com.resq.campus.dto.Dtos.NotificationDto;
import com.resq.campus.exception.ApiException;
import com.resq.campus.model.Notification;
import com.resq.campus.repository.NotificationRepository;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository repo;

    /** The caller's latest 100 notifications. */
    @GetMapping
    public List<NotificationDto> list(@AuthenticationPrincipal CurrentUser me) {
        return repo.findTop100ByUserIdOrderByCreatedAtDesc(me.id()).stream().map(Mapper::notification).toList();
    }

    @PutMapping("/{id}/read")
    @Transactional
    public NotificationDto markRead(@AuthenticationPrincipal CurrentUser me, @PathVariable Long id) {
        Notification n = repo.findByIdAndUserId(id, me.id()).orElseThrow(() -> ApiException.notFound("Notification not found"));
        n.setRead(true);
        return Mapper.notification(n);
    }

    @PutMapping("/read-all")
    @Transactional
    public Map<String, Object> markAllRead(@AuthenticationPrincipal CurrentUser me) {
        int updated = repo.markAllRead(me.id());
        return Map.of("success", true, "updated", updated);
    }
}
