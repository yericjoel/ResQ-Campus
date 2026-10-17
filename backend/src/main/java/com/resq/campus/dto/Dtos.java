package com.resq.campus.dto;

import com.resq.campus.model.Enums.*;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Request and response objects of the REST API. */
public final class Dtos {
    private Dtos() {}

    // ------------------------------------------------------------------ auth / users

    public record RegisterRequest(
            @NotBlank(message = "Name is required") @Size(max = 100) String name,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") @Size(max = 150) String email,
            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Password must contain a letter and a number") String password,
            @Size(max = 40) String studentId,
            @Size(max = 80) String department,
            @Min(1) @Max(8) Integer year,
            @Pattern(regexp = "^[0-9+()\\-\\s]{0,20}$", message = "Enter a valid phone number") String phone,
            Role role) {}

    public record LoginRequest(@NotBlank(message = "Email is required") String email,
                               @NotBlank(message = "Password is required") String password) {}

    public record LoginResponse(boolean requiresVerification, String email, String message, String devCode) {}

    public record VerifyLoginRequest(@NotBlank(message = "Email is required") String email,
                                     @NotBlank(message = "Verification code is required") String code) {}

    public record ResendCodeRequest(@NotBlank(message = "Email is required") String email) {}

    public record ResendCodeResponse(boolean success, String message, String devCode) {}

    public record ProfileUpdateRequest(
            @NotBlank(message = "Name is required") @Size(max = 100) String name,
            @Size(max = 40) String studentId,
            @Size(max = 80) String department,
            @Min(1) @Max(8) Integer year,
            @Pattern(regexp = "^[0-9+()\\-\\s]{0,20}$", message = "Enter a valid phone number") String phone,
            @Size(max = 100) String emergencyContactName,
            @Pattern(regexp = "^[0-9+()\\-\\s]{0,20}$", message = "Enter a valid emergency contact number") String emergencyContactPhone) {}

    public record AdminUserUpdate(Role role, Boolean active) {}

    public record UserDto(Long id, String name, String email, Role role, String studentId, String department,
                          Integer year, String phone, String profileImage, String emergencyContactName,
                          String emergencyContactPhone, boolean active, Instant createdAt, int profileCompletion) {}

    public record AuthResponse(String token, UserDto user) {}

    public record ResponderDto(Long id, String name, Role role) {}

    // ------------------------------------------------------------------ SOS

    public record SosCreateRequest(@Size(max = 200) String location,
                                   Double latitude, Double longitude,
                                   @Size(max = 500) String description,
                                   @Size(max = 60) String type) {}

    public record SosStatusRequest(@NotNull(message = "Status is required") SosStatus status) {}

    public record SosDto(Long id, String sosId, Long userId, String userName, Role userRole, String department,
                         String userPhone, String emergencyContactName, String emergencyContactPhone,
                         String location, Double latitude, Double longitude, String description, String type,
                         SosStatus status, String acknowledgedByName, String dispatchedByName, String resolvedByName,
                         Instant createdAt, Instant acknowledgedAt, Instant dispatchedAt, Instant resolvedAt,
                         Instant updatedAt) {}

    public record SosEvent(String event, SosDto sos) {}

    // ------------------------------------------------------------------ incidents

    public record IncidentUpdateRequest(IncidentStatus status, Severity severity, Long assignedTo,
                                        @Size(max = 1000) String note) {}

    public record EvidenceDto(Long id, String fileUrl, String fileType, Instant createdAt) {}

    public record TimelineDto(Long id, IncidentStatus status, String note, String authorName, Instant createdAt) {}

    public record IncidentDto(Long id, String reportId, Long userId, String reporterName, String reporterDepartment,
                              IncidentType type, String title, String description, String location,
                              Instant incidentDate, Severity severity, IncidentStatus status,
                              Long assignedToId, String assignedToName, Instant createdAt, Instant updatedAt,
                              List<EvidenceDto> evidence, List<TimelineDto> timeline) {}

    public record IncidentEvent(String event, IncidentDto incident) {}

    // ------------------------------------------------------------------ contacts

    public record ContactRequest(
            @NotBlank(message = "Name is required") @Size(max = 120) String name,
            @Size(max = 120) String department,
            @Size(max = 120) String designation,
            @NotNull(message = "Category is required") ContactCategory category,
            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^[0-9+()\\-\\s]{3,30}$", message = "Enter a valid phone number") String phone,
            @Size(max = 200) String location,
            @Size(max = 120) String availability,
            Boolean active) {}

    public record ContactDto(Long id, String name, String department, String designation, ContactCategory category,
                             String phone, String location, String availability, boolean active,
                             Instant createdAt, Instant updatedAt) {}

    // ------------------------------------------------------------------ notifications

    public record NotificationDto(Long id, String title, String message, NotificationType type, Long referenceId,
                                  boolean read, Instant createdAt) {}

    // ------------------------------------------------------------------ announcements

    public record AnnouncementRequest(
            @NotBlank(message = "Title is required") @Size(max = 150) String title,
            @NotBlank(message = "Description is required") @Size(max = 5000) String description,
            @NotNull(message = "Category is required") AnnouncementCategory category,
            @NotNull(message = "Priority is required") AnnouncementPriority priority,
            Boolean published) {}

    public record AnnouncementDto(Long id, String title, String description, AnnouncementCategory category,
                                  AnnouncementPriority priority, String authorName, boolean published,
                                  Instant publishedAt, Instant createdAt, Instant updatedAt) {}

    public record AnnouncementEvent(String event, AnnouncementDto announcement) {}

    // ------------------------------------------------------------------ lost & found

    public record LostFoundUpdateRequest(
            @Size(max = 120) String itemName,
            @Size(max = 60) String category,
            @Size(max = 2000) String description,
            @Size(max = 200) String location,
            LocalDate date,
            @Size(max = 120) String contactPreference,
            ItemStatus status) {}

    public record LostFoundDto(Long id, Long userId, String ownerName, ItemType itemType, String itemName,
                               String category, String description, String location, LocalDate date,
                               String contactPreference, String imageUrl, ItemStatus status,
                               Instant createdAt, Instant updatedAt) {}

    public record MatchRequest(@NotNull Long lostItemId, @NotNull Long foundItemId) {}

    public record MatchStatusRequest(@NotNull MatchStatus matchStatus) {}

    public record MatchDto(Long id, LostFoundDto lostItem, LostFoundDto foundItem, MatchStatus matchStatus,
                           Instant createdAt, Instant updatedAt) {}

    public record SuggestionDto(LostFoundDto item, int score) {}

    // ------------------------------------------------------------------ stats / dashboard

    public record StudentStats(int myReports, int reportsThisWeek, int activeAlerts, int activeAlertsMine,
                               int resolvedCases, int resolutionRate, int lostFoundMatches, int awaitingPickup,
                               int unreadNotifications, int safetyProfile, String campusStatus) {}

    public record AdminStats(int activeSos, int openIncidents, int incidentsToday, int pendingLostFound) {}

    public record ActivityItem(String kind, Long refId, String code, String title, String location,
                               String status, Instant createdAt) {}

    public record SearchResult(List<ActivityItem> incidents, List<ContactDto> contacts,
                               List<AnnouncementDto> announcements) {}
}
