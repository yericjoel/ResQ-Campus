package com.resq.campus.service;

import com.resq.campus.dto.Dtos.IncidentDto;
import com.resq.campus.dto.Dtos.IncidentEvent;
import com.resq.campus.dto.Dtos.IncidentUpdateRequest;
import com.resq.campus.exception.ApiException;
import com.resq.campus.model.*;
import com.resq.campus.model.Enums.*;
import com.resq.campus.repository.*;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidents;
    private final IncidentEvidenceRepository evidenceRepo;
    private final IncidentUpdateRepository updates;
    private final UserRepository users;
    private final FileStorageService files;
    private final NotificationService notifications;

    public record CreateInput(IncidentType type, String title, String description, String location,
                              String incidentDate, Severity severity) {}

    @Transactional
    public IncidentDto create(CurrentUser me, CreateInput in, MultipartFile photo) {
        User user = users.findById(me.id()).orElseThrow(() -> ApiException.notFound("User not found"));

        Instant when;
        try {
            when = in.incidentDate() == null || in.incidentDate().isBlank() ? Instant.now() : Instant.parse(in.incidentDate());
        } catch (DateTimeParseException e) {
            throw ApiException.badRequest("Incident date/time is not valid");
        }
        if (when.isAfter(Instant.now().plusSeconds(300))) throw ApiException.badRequest("Incident date cannot be in the future");

        // Validate the photo first so a bad file does not leave a half-created report behind.
        FileStorageService.Stored stored = photo != null && !photo.isEmpty() ? files.storeImage(photo) : null;

        Incident i = new Incident();
        i.setReportId("RQ-" + UUID.randomUUID().toString().substring(0, 12)); // replaced below
        i.setUser(user);
        i.setType(in.type());
        i.setTitle(in.title().trim());
        i.setDescription(in.description().trim());
        i.setLocation(in.location().trim());
        i.setIncidentDate(when);
        i.setSeverity(in.severity());
        i.setStatus(IncidentStatus.OPEN);
        i = incidents.save(i);
        i.setReportId("RQ-" + (1050 + i.getId()));

        addUpdate(i, user, IncidentStatus.OPEN, "Report submitted");
        if (stored != null) {
            IncidentEvidence ev = new IncidentEvidence();
            ev.setIncident(i);
            ev.setFileUrl(stored.url());
            ev.setFileType(stored.contentType());
            evidenceRepo.save(ev);
        }

        IncidentDto dto = detail(i);
        notifications.publish("/topic/incidents", new IncidentEvent("NEW", dto));
        notifications.notifyAdmins("New incident " + i.getReportId(),
                i.getSeverity() + " · " + i.getTitle() + " · " + i.getLocation(), NotificationType.INCIDENT, i.getId());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<IncidentDto> mine(Long userId) {
        return incidents.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::summary).toList();
    }

    /** filter: all | open | in_review | high | resolved */
    @Transactional(readOnly = true)
    public List<IncidentDto> all(String filter) {
        String f = filter == null ? "all" : filter.toLowerCase();
        return incidents.findAllByOrderByCreatedAtDesc().stream()
                .filter(i -> switch (f) {
                    case "open" -> i.getStatus() == IncidentStatus.OPEN;
                    case "in_review" -> i.getStatus() == IncidentStatus.IN_REVIEW;
                    case "resolved" -> i.getStatus() == IncidentStatus.RESOLVED;
                    case "high" -> IncidentStatus.ACTIVE.contains(i.getStatus())
                            && (i.getSeverity() == Severity.HIGH || i.getSeverity() == Severity.CRITICAL);
                    default -> true;
                })
                .map(this::summary).toList();
    }

    @Transactional(readOnly = true)
    public IncidentDto get(CurrentUser me, Long id) {
        Incident i = incidents.findById(id).orElseThrow(() -> ApiException.notFound("Incident not found"));
        if (!me.isAdmin() && !i.getUser().getId().equals(me.id())) throw ApiException.notFound("Incident not found");
        return detail(i);
    }

    @Transactional
    public IncidentDto update(CurrentUser me, Long id, IncidentUpdateRequest req) {
        Incident i = incidents.findById(id).orElseThrow(() -> ApiException.notFound("Incident not found"));
        User actor = users.findById(me.id()).orElseThrow(() -> ApiException.notFound("User not found"));

        IncidentStatus oldStatus = i.getStatus();
        boolean statusChanged = req.status() != null && req.status() != oldStatus;
        boolean assigneeChanged = false;
        String note = req.note() == null || req.note().isBlank() ? null : req.note().trim();

        if (req.severity() != null) i.setSeverity(req.severity());
        if (req.assignedTo() != null) {
            User responder = users.findById(req.assignedTo()).orElseThrow(() -> ApiException.badRequest("Responder not found"));
            if (!responder.getRole().isAdminLike()) throw ApiException.badRequest("Responders must be admin or security staff");
            assigneeChanged = i.getAssignedTo() == null || !i.getAssignedTo().getId().equals(responder.getId());
            i.setAssignedTo(responder);
        }
        if (statusChanged) i.setStatus(req.status());

        if (statusChanged || assigneeChanged || note != null) {
            String entry = note;
            if (assigneeChanged) {
                String assigned = "Assigned to " + i.getAssignedTo().getName();
                entry = entry == null ? assigned : assigned + ". " + entry;
            }
            addUpdate(i, actor, i.getStatus(), entry);
        }

        if (statusChanged || assigneeChanged) {
            String text = statusChanged
                    ? "Your report " + i.getReportId() + " is now " + pretty(i.getStatus()) + "."
                    : "A responder (" + i.getAssignedTo().getName() + ") was assigned to " + i.getReportId() + ".";
            notifications.notifyUser(i.getUser().getId(), "Report update · " + i.getReportId(), text,
                    NotificationType.INCIDENT, i.getId());
        }

        IncidentDto dto = detail(i);
        notifications.publish("/topic/incidents", new IncidentEvent("UPDATED", dto));
        return dto;
    }

    // ----------------------------------------------------------------------------- helpers

    private void addUpdate(Incident i, User author, IncidentStatus status, String note) {
        IncidentUpdate u = new IncidentUpdate();
        u.setIncident(i);
        u.setAuthor(author);
        u.setStatus(status);
        u.setNote(note);
        updates.save(u);
    }

    private IncidentDto summary(Incident i) {
        return Mapper.incident(i, List.of(), List.of());
    }

    private IncidentDto detail(Incident i) {
        return Mapper.incident(i, evidenceRepo.findByIncidentId(i.getId()),
                updates.findByIncidentIdOrderByCreatedAtAsc(i.getId()));
    }

    private String pretty(IncidentStatus s) {
        return s.name().replace('_', ' ').toLowerCase();
    }
}
