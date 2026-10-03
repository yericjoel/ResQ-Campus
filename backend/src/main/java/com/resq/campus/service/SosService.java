package com.resq.campus.service;

import com.resq.campus.dto.Dtos.SosCreateRequest;
import com.resq.campus.dto.Dtos.SosDto;
import com.resq.campus.dto.Dtos.SosEvent;
import com.resq.campus.exception.ApiException;
import com.resq.campus.model.Enums.NotificationType;
import com.resq.campus.model.Enums.SosStatus;
import com.resq.campus.model.SosRequest;
import com.resq.campus.model.User;
import com.resq.campus.repository.SosRepository;
import com.resq.campus.repository.UserRepository;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SosService {

    private final SosRepository sosRepo;
    private final UserRepository users;
    private final NotificationService notifications;

    /** Saves the SOS, alerts every admin/security user in real time, and returns it. */
    @Transactional
    public SosDto create(CurrentUser me, SosCreateRequest req) {
        // A student who already has an active SOS gets that one back instead of creating duplicates.
        var existing = sosRepo.findFirstByUserIdAndStatusInOrderByCreatedAtDesc(me.id(), SosStatus.ACTIVE);
        if (existing.isPresent()) return Mapper.sos(existing.get());

        User user = users.findById(me.id()).orElseThrow(() -> ApiException.notFound("User not found"));
        SosRequest s = new SosRequest();
        s.setSosId("SOS-" + UUID.randomUUID()); // replaced below once the id is known
        s.setUser(user);
        s.setLocation(blankTo(req.location(), "Location not shared"));
        s.setLatitude(req.latitude());
        s.setLongitude(req.longitude());
        s.setDescription(req.description());
        s.setType(blankTo(req.type(), "Emergency"));
        s.setStatus(SosStatus.TRIGGERED);
        s = sosRepo.save(s);
        s.setSosId("SOS-" + (2000 + s.getId()));

        SosDto dto = Mapper.sos(s);
        notifications.publish("/topic/admin/sos", new SosEvent("NEW", dto));
        notifications.notifyAdmins("NEW EMERGENCY SOS",
                user.getName() + " · " + s.getType() + " · " + s.getLocation(), NotificationType.SOS, s.getId());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<SosDto> mine(Long userId) {
        return sosRepo.findByUserIdOrderByCreatedAtDesc(userId).stream().map(Mapper::sos).toList();
    }

    @Transactional(readOnly = true)
    public List<SosDto> all(boolean activeOnly) {
        var list = activeOnly ? sosRepo.findByStatusInOrderByCreatedAtDesc(SosStatus.ACTIVE)
                : sosRepo.findAllByOrderByCreatedAtDesc();
        return list.stream().map(Mapper::sos).toList();
    }

    @Transactional(readOnly = true)
    public SosDto get(CurrentUser me, Long id) {
        SosRequest s = sosRepo.findById(id).orElseThrow(() -> ApiException.notFound("SOS request not found"));
        if (!me.isAdmin() && !s.getUser().getId().equals(me.id())) throw ApiException.notFound("SOS request not found");
        return Mapper.sos(s);
    }

    @Transactional
    public SosDto updateStatus(CurrentUser me, Long id, SosStatus target) {
        SosRequest s = sosRepo.findById(id).orElseThrow(() -> ApiException.notFound("SOS request not found"));
        SosStatus current = s.getStatus();
        Long ownerId = s.getUser().getId();
        User actor = users.findById(me.id()).orElseThrow(() -> ApiException.notFound("User not found"));

        String title;
        String message;
        if (!me.isAdmin()) {
            // Students may only cancel their own SOS while help has not been dispatched.
            if (!ownerId.equals(me.id())) throw ApiException.notFound("SOS request not found");
            if (target != SosStatus.CANCELLED) throw ApiException.forbidden("You can only cancel your own SOS");
            if (current != SosStatus.TRIGGERED && current != SosStatus.ACKNOWLEDGED) {
                throw ApiException.badRequest("This SOS can no longer be cancelled");
            }
            s.setStatus(SosStatus.CANCELLED);
            title = "SOS cancelled";
            message = s.getUser().getName() + " cancelled " + s.getSosId();
        } else {
            switch (target) {
                case ACKNOWLEDGED -> {
                    if (current != SosStatus.TRIGGERED) throw ApiException.badRequest("Only a new SOS can be acknowledged");
                    s.setAcknowledgedBy(actor);
                    s.setAcknowledgedAt(Instant.now());
                    title = "SOS acknowledged";
                    message = "Campus security has acknowledged your SOS (" + s.getSosId() + ") and is responding.";
                }
                case DISPATCHED -> {
                    if (current != SosStatus.TRIGGERED && current != SosStatus.ACKNOWLEDGED) {
                        throw ApiException.badRequest("This SOS cannot be dispatched from its current status");
                    }
                    if (s.getAcknowledgedBy() == null) {
                        s.setAcknowledgedBy(actor);
                        s.setAcknowledgedAt(Instant.now());
                    }
                    s.setDispatchedBy(actor);
                    s.setDispatchedAt(Instant.now());
                    title = "Help is on the way";
                    message = "A responder has been dispatched for your SOS (" + s.getSosId() + ").";
                }
                case RESOLVED -> {
                    if (!SosStatus.ACTIVE.contains(current)) throw ApiException.badRequest("This SOS is already closed");
                    s.setResolvedBy(actor);
                    s.setResolvedAt(Instant.now());
                    title = "SOS resolved";
                    message = "Your SOS (" + s.getSosId() + ") has been marked as resolved.";
                }
                default -> throw ApiException.badRequest("Administrators can set ACKNOWLEDGED, DISPATCHED or RESOLVED");
            }
            s.setStatus(target);
        }

        SosDto dto = Mapper.sos(s);
        notifications.publish("/topic/admin/sos", new SosEvent("UPDATED", dto));
        notifications.publish("/topic/user/" + ownerId + "/sos", new SosEvent("UPDATED", dto));
        if (me.isAdmin()) {
            notifications.notifyUser(ownerId, title, message, NotificationType.SOS, s.getId());
        } else {
            notifications.notifyAdmins(title, message, NotificationType.SOS, s.getId());
        }
        return dto;
    }

    private String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
