package com.resq.campus.util;

import com.resq.campus.dto.Dtos.*;
import com.resq.campus.model.*;

import java.util.List;

/** Converts entities to API response objects. Passwords are never included. */
public final class Mapper {
    private Mapper() {}

    public static int profileCompletion(User u) {
        int done = 0;
        int total = 8;
        if (notBlank(u.getName())) done++;
        if (notBlank(u.getEmail())) done++;
        if (notBlank(u.getStudentId())) done++;
        if (notBlank(u.getDepartment())) done++;
        if (u.getYear() != null) done++;
        if (notBlank(u.getPhone())) done++;
        if (notBlank(u.getEmergencyContactName())) done++;
        if (notBlank(u.getEmergencyContactPhone())) done++;
        return Math.round(100f * done / total);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    public static UserDto user(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getStudentId(), u.getDepartment(),
                u.getYear(), u.getPhone(), u.getProfileImage(), u.getEmergencyContactName(),
                u.getEmergencyContactPhone(), u.isActive(), u.getCreatedAt(), profileCompletion(u));
    }

    private static String name(User u) {
        return u == null ? null : u.getName();
    }

    public static SosDto sos(SosRequest s) {
        User u = s.getUser();
        return new SosDto(s.getId(), s.getSosId(), u.getId(), u.getName(), u.getRole(), u.getDepartment(),
                u.getPhone(), u.getEmergencyContactName(), u.getEmergencyContactPhone(),
                s.getLocation(), s.getLatitude(), s.getLongitude(), s.getDescription(), s.getType(), s.getStatus(),
                name(s.getAcknowledgedBy()), name(s.getDispatchedBy()), name(s.getResolvedBy()),
                s.getCreatedAt(), s.getAcknowledgedAt(), s.getDispatchedAt(), s.getResolvedAt(), s.getUpdatedAt());
    }

    public static IncidentDto incident(Incident i, List<IncidentEvidence> evidence, List<IncidentUpdate> timeline) {
        User reporter = i.getUser();
        User assignee = i.getAssignedTo();
        return new IncidentDto(i.getId(), i.getReportId(), reporter.getId(), reporter.getName(),
                reporter.getDepartment(), i.getType(), i.getTitle(), i.getDescription(), i.getLocation(),
                i.getIncidentDate(), i.getSeverity(), i.getStatus(),
                assignee == null ? null : assignee.getId(), name(assignee), i.getCreatedAt(), i.getUpdatedAt(),
                evidence.stream().map(e -> new EvidenceDto(e.getId(), e.getFileUrl(), e.getFileType(), e.getCreatedAt())).toList(),
                timeline.stream().map(t -> new TimelineDto(t.getId(), t.getStatus(), t.getNote(), name(t.getAuthor()), t.getCreatedAt())).toList());
    }

    public static ContactDto contact(EmergencyContact c) {
        return new ContactDto(c.getId(), c.getName(), c.getDepartment(), c.getDesignation(), c.getCategory(),
                c.getPhone(), c.getLocation(), c.getAvailability(), c.isActive(), c.getCreatedAt(), c.getUpdatedAt());
    }

    public static NotificationDto notification(Notification n) {
        return new NotificationDto(n.getId(), n.getTitle(), n.getMessage(), n.getType(), n.getReferenceId(),
                n.isRead(), n.getCreatedAt());
    }

    public static AnnouncementDto announcement(Announcement a) {
        return new AnnouncementDto(a.getId(), a.getTitle(), a.getDescription(), a.getCategory(), a.getPriority(),
                name(a.getCreatedBy()), a.isPublished(), a.getPublishedAt(), a.getCreatedAt(), a.getUpdatedAt());
    }

    public static LostFoundDto lostFound(LostFound l) {
        return new LostFoundDto(l.getId(), l.getUser().getId(), l.getUser().getName(), l.getItemType(),
                l.getItemName(), l.getCategory(), l.getDescription(), l.getLocation(), l.getDate(),
                l.getContactPreference(), l.getImageUrl(), l.getStatus(), l.getCreatedAt(), l.getUpdatedAt());
    }

    public static MatchDto match(LostFoundMatch m) {
        return new MatchDto(m.getId(), lostFound(m.getLostItem()), lostFound(m.getFoundItem()), m.getMatchStatus(),
                m.getCreatedAt(), m.getUpdatedAt());
    }

    public static ActivityItem activity(Incident i) {
        return new ActivityItem("INCIDENT", i.getId(), i.getReportId(), i.getTitle(), i.getLocation(),
                i.getStatus().name(), i.getCreatedAt());
    }

    public static ActivityItem activity(SosRequest s) {
        return new ActivityItem("SOS", s.getId(), s.getSosId(),
                "SOS - " + (s.getType() == null ? "Emergency" : s.getType()), s.getLocation(),
                s.getStatus().name(), s.getCreatedAt());
    }
}
