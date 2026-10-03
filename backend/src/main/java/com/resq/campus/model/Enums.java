package com.resq.campus.model;

import java.util.List;

/** All enumerations used by the domain model, grouped in one place. */
public final class Enums {
    private Enums() {}

    public enum Role {
        STUDENT, STAFF, ADMIN, SECURITY;

        public boolean isAdminLike() {
            return this == ADMIN || this == SECURITY;
        }
    }

    public enum SosStatus {
        TRIGGERED, ACKNOWLEDGED, DISPATCHED, RESOLVED, CANCELLED;

        public static final List<SosStatus> ACTIVE = List.of(TRIGGERED, ACKNOWLEDGED, DISPATCHED);
    }

    public enum IncidentStatus {
        OPEN, IN_REVIEW, DISPATCHED, RESOLVED, REJECTED;

        public static final List<IncidentStatus> ACTIVE = List.of(OPEN, IN_REVIEW, DISPATCHED);
    }

    public enum Severity { LOW, MEDIUM, HIGH, CRITICAL }

    public enum IncidentType {
        SAFETY_HAZARD, MEDICAL_EMERGENCY, THEFT, HARASSMENT,
        SUSPICIOUS_ACTIVITY, INFRASTRUCTURE_PROBLEM, OTHER
    }

    public enum ContactCategory {
        CAMPUS_SECURITY, MEDICAL_EMERGENCY, POLICE, FIRE_RESCUE,
        CAMPUS_ADMINISTRATION, HOSTEL_WARDEN, OTHER
    }

    public enum NotificationType { SOS, INCIDENT, LOST_FOUND, ANNOUNCEMENT, SYSTEM }

    public enum AnnouncementCategory { SAFETY, EMERGENCY, CAMPUS_NOTICE, MAINTENANCE, GENERAL }

    public enum AnnouncementPriority { NORMAL, IMPORTANT, CRITICAL }

    public enum ItemType { LOST, FOUND }

    public enum ItemStatus { OPEN, MATCHED, RETURNED }

    public enum MatchStatus { PENDING, VERIFIED, REJECTED }
}
