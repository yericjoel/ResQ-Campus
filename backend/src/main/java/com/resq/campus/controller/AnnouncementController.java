package com.resq.campus.controller;

import com.resq.campus.dto.Dtos.AnnouncementDto;
import com.resq.campus.dto.Dtos.AnnouncementEvent;
import com.resq.campus.dto.Dtos.AnnouncementRequest;
import com.resq.campus.exception.ApiException;
import com.resq.campus.model.Announcement;
import com.resq.campus.model.Enums.AnnouncementPriority;
import com.resq.campus.model.Enums.NotificationType;
import com.resq.campus.repository.AnnouncementRepository;
import com.resq.campus.repository.UserRepository;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.service.NotificationService;
import com.resq.campus.util.Mapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementRepository repo;
    private final UserRepository users;
    private final NotificationService notifications;

    /** Students see published announcements only; admins see everything (drafts included). */
    @GetMapping
    @Transactional(readOnly = true)
    public List<AnnouncementDto> list(@AuthenticationPrincipal CurrentUser me) {
        var list = me.isAdmin() ? repo.findAllByOrderByCreatedAtDesc() : repo.findByPublishedTrueOrderByPublishedAtDesc();
        return list.stream().map(Mapper::announcement).toList();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<AnnouncementDto> create(@AuthenticationPrincipal CurrentUser me,
                                                  @Valid @RequestBody AnnouncementRequest req) {
        Announcement a = new Announcement();
        a.setCreatedBy(users.getReferenceById(me.id()));
        apply(a, req);
        boolean publish = Boolean.TRUE.equals(req.published());
        if (publish) {
            a.setPublished(true);
            a.setPublishedAt(Instant.now());
        }
        a = repo.save(a);
        if (publish) announce(a);
        return ResponseEntity.status(HttpStatus.CREATED).body(Mapper.announcement(a));
    }

    @PutMapping("/{id}")
    @Transactional
    public AnnouncementDto update(@PathVariable Long id, @Valid @RequestBody AnnouncementRequest req) {
        Announcement a = repo.findById(id).orElseThrow(() -> ApiException.notFound("Announcement not found"));
        boolean wasPublished = a.isPublished();
        apply(a, req);
        if (req.published() != null) {
            a.setPublished(req.published());
            if (req.published() && !wasPublished) a.setPublishedAt(Instant.now());
        }
        if (a.isPublished() && !wasPublished) announce(a);
        else if (a.isPublished() || wasPublished) {
            notifications.publish("/topic/announcements", new AnnouncementEvent("UPDATED", Mapper.announcement(a)));
        }
        return Mapper.announcement(a);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public Map<String, Object> delete(@PathVariable Long id) {
        Announcement a = repo.findById(id).orElseThrow(() -> ApiException.notFound("Announcement not found"));
        AnnouncementDto snapshot = Mapper.announcement(a); // built before delete (lazy author is still loadable here)
        boolean wasPublished = a.isPublished();
        repo.deleteById(id);
        if (wasPublished) {
            notifications.publish("/topic/announcements", new AnnouncementEvent("DELETED", snapshot));
        }
        return Map.of("success", true, "message", "Announcement deleted");
    }

    private void apply(Announcement a, AnnouncementRequest req) {
        a.setTitle(req.title().trim());
        a.setDescription(req.description().trim());
        a.setCategory(req.category());
        a.setPriority(req.priority());
    }

    /**
     * Called when an announcement becomes published. Every connected client gets the event on
     * /topic/announcements; important/critical ones are also stored as notifications for every user.
     */
    private void announce(Announcement a) {
        notifications.publish("/topic/announcements", new AnnouncementEvent("PUBLISHED", Mapper.announcement(a)));
        if (a.getPriority() != AnnouncementPriority.NORMAL) {
            String prefix = a.getPriority() == AnnouncementPriority.CRITICAL ? "CRITICAL: " : "Important: ";
            notifications.notifyEveryone(prefix + a.getTitle(), a.getDescription(), NotificationType.ANNOUNCEMENT, a.getId());
        }
    }
}
