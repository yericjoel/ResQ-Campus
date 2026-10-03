package com.resq.campus.config;

import com.resq.campus.model.*;
import com.resq.campus.model.Enums.*;
import com.resq.campus.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Inserts demo data on first start. Every seeded row has demo = true, so it is always
 * distinguishable from records created by real users. Disable with SEED_DEMO_DATA=false.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private static final String STUDENT_EMAIL = "aarav.sharma@resq.edu";

    private final UserRepository users;
    private final IncidentRepository incidents;
    private final IncidentUpdateRepository incidentUpdates;
    private final EmergencyContactRepository contacts;
    private final AnnouncementRepository announcements;
    private final LostFoundRepository lostFound;
    private final NotificationRepository notifications;
    private final PasswordEncoder encoder;

    @Value("${resq.seed.enabled:true}")
    private boolean enabled;

    // Optional first-admin bootstrap for real deployments (not marked demo). Set both to use it.
    @Value("${resq.bootstrap.admin.email:}")
    private String bootstrapEmail;
    @Value("${resq.bootstrap.admin.password:}")
    private String bootstrapPassword;

    @Override
    @Transactional
    public void run(String... args) {
        bootstrapAdmin();
        if (!enabled || users.existsByEmailIgnoreCase(STUDENT_EMAIL)) return;

        User admin = user("Campus Security Admin", "admin@resq.edu", "Admin@123", Role.ADMIN, null, "Security Office", null, "+91 90000 00001");
        User officer = user("Ravi Kumar", "security@resq.edu", "Security@123", Role.SECURITY, null, "Security Office", null, "+91 90000 00002");
        User aarav = user("Aarav Sharma", STUDENT_EMAIL, "Student@123", Role.STUDENT, "CSE2023014", "CSE", 3, "+91 98765 43210");
        aarav.setEmergencyContactName("Rohit Sharma");
        aarav.setEmergencyContactPhone("+91 98765 00000");
        User meera = user("Meera Nair", "meera.nair@resq.edu", "Student@123", Role.STUDENT, "ECE2022031", "ECE", 4, "+91 98765 11111");
        users.save(admin);
        users.save(officer);
        users.save(aarav);
        users.save(meera);

        seedContacts();
        seedIncidents(aarav, meera, admin);
        seedLostFound(aarav, meera, admin);
        seedAnnouncements(admin);

        addNotification(aarav, "New campus safety alert", "Heavy rain expected tonight. Avoid the low-lying walkway near Block C.", NotificationType.ANNOUNCEMENT, Duration.ofHours(3));
        addNotification(aarav, "Report update", "Your report RQ-1041 is now dispatched.", NotificationType.INCIDENT, Duration.ofHours(1));
        log.info("Demo data created. Demo logins: admin@resq.edu / Admin@123, {} / Student@123", STUDENT_EMAIL);
    }

    private void bootstrapAdmin() {
        if (bootstrapEmail.isBlank() || bootstrapPassword.length() < 8) return;
        if (users.existsByEmailIgnoreCase(bootstrapEmail)) return;
        User u = user("Campus Administrator", bootstrapEmail.trim(), bootstrapPassword, Role.ADMIN, null, "Security Office", null, null);
        u.setDemo(false);
        users.save(u);
        log.info("Bootstrap administrator created: {}", bootstrapEmail);
    }

    private User user(String name, String email, String password, Role role, String studentId,
                      String department, Integer year, String phone) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPassword(encoder.encode(password));
        u.setRole(role);
        u.setStudentId(studentId);
        u.setDepartment(department);
        u.setYear(year);
        u.setPhone(phone);
        u.setDemo(true);
        return u;
    }

    private void seedContacts() {
        contact("Campus Security Control Room", "Security Office", "Control Room", ContactCategory.CAMPUS_SECURITY, "+91 40 2300 1100", "Main Gate, Admin Block", "24/7");
        contact("Night Patrol Desk", "Security Office", "Patrol Supervisor", ContactCategory.CAMPUS_SECURITY, "+91 40 2300 1101", "Hostel Road Gate", "6 PM - 6 AM");
        contact("Campus Health Centre", "Medical Services", "Duty Doctor", ContactCategory.MEDICAL_EMERGENCY, "+91 40 2300 1200", "Health Centre, Block D", "24/7");
        contact("Ambulance Service", "Medical Services", "Dispatcher", ContactCategory.MEDICAL_EMERGENCY, "108", "Main Gate", "24/7");
        contact("Local Police Station", "Police", "Station House Officer", ContactCategory.POLICE, "100", "Off-campus, 2 km", "24/7");
        contact("Fire & Rescue", "Fire Department", "Control Room", ContactCategory.FIRE_RESCUE, "101", "Off-campus, 3 km", "24/7");
        contact("Registrar Office", "Administration", "Registrar", ContactCategory.CAMPUS_ADMINISTRATION, "+91 40 2300 1300", "Admin Block, 1st floor", "Mon-Fri, 9 AM - 5 PM");
        contact("Hostel B Warden", "Hostels", "Warden", ContactCategory.HOSTEL_WARDEN, "+91 40 2300 1402", "Hostel B, Ground floor", "24/7");
        contact("Student Counselling Cell", "Student Affairs", "Counsellor", ContactCategory.OTHER, "+91 40 2300 1500", "Library Annex", "Mon-Sat, 10 AM - 6 PM");
    }

    private void contact(String name, String dept, String designation, ContactCategory cat, String phone, String location, String availability) {
        EmergencyContact c = new EmergencyContact();
        c.setName(name);
        c.setDepartment(dept);
        c.setDesignation(designation);
        c.setCategory(cat);
        c.setPhone(phone);
        c.setLocation(location);
        c.setAvailability(availability);
        c.setDemo(true);
        contacts.save(c);
    }

    private void seedIncidents(User aarav, User meera, User admin) {
        incident(aarav, "RQ-1041", IncidentType.MEDICAL_EMERGENCY, "Medical assistance", "Hostel B corridor",
                "Student felt dizzy and needed medical help.", Severity.CRITICAL, IncidentStatus.DISPATCHED, Duration.ofHours(1), admin);
        incident(aarav, "RQ-1038", IncidentType.INFRASTRUCTURE_PROBLEM, "Water leakage in Chemistry Lab 2", "Chemistry Lab 2",
                "Water leaking from the ceiling near the fume hood.", Severity.MEDIUM, IncidentStatus.IN_REVIEW, Duration.ofHours(20), admin);
        incident(aarav, "RQ-1034", IncidentType.OTHER, "Lost ID card near Cafeteria", "Cafeteria",
                "Lost my student ID card near the cafeteria entrance.", Severity.LOW, IncidentStatus.RESOLVED, Duration.ofDays(3), admin);
        incident(aarav, "RQ-1030", IncidentType.OTHER, "Found: black umbrella, Auditorium gate", "Auditorium gate",
                "Found a black umbrella left at the auditorium gate.", Severity.LOW, IncidentStatus.OPEN, Duration.ofDays(5), admin);
        incident(meera, "RQ-1036", IncidentType.SUSPICIOUS_ACTIVITY, "Unknown person near Library parking", "Library parking",
                "Someone was checking vehicle doors after 9 PM.", Severity.HIGH, IncidentStatus.OPEN, Duration.ofHours(5), admin);
    }

    private void incident(User reporter, String reportId, IncidentType type, String title, String location,
                          String description, Severity severity, IncidentStatus status, Duration age, User admin) {
        Instant when = Instant.now().minus(age);
        Incident i = new Incident();
        i.setReportId(reportId);
        i.setUser(reporter);
        i.setType(type);
        i.setTitle(title);
        i.setDescription(description);
        i.setLocation(location);
        i.setIncidentDate(when);
        i.setSeverity(severity);
        i.setStatus(status);
        i.setCreatedAt(when);
        i.setDemo(true);
        if (status == IncidentStatus.DISPATCHED || status == IncidentStatus.RESOLVED) i.setAssignedTo(admin);
        i = incidents.save(i);

        addUpdate(i, reporter, IncidentStatus.OPEN, "Report submitted", when);
        if (status != IncidentStatus.OPEN) {
            addUpdate(i, admin, status, "Status changed to " + status.name().replace('_', ' ').toLowerCase(), when.plus(Duration.ofMinutes(20)));
        }
    }

    private void addUpdate(Incident i, User author, IncidentStatus status, String note, Instant at) {
        IncidentUpdate u = new IncidentUpdate();
        u.setIncident(i);
        u.setAuthor(author);
        u.setStatus(status);
        u.setNote(note);
        u.setCreatedAt(at);
        incidentUpdates.save(u);
    }

    private void seedLostFound(User aarav, User meera, User admin) {
        item(aarav, ItemType.LOST, "Student ID card", "ID Card / Documents", "Blue lanyard, name Aarav Sharma, CSE.", "Cafeteria", 3, "Message me on the app");
        item(admin, ItemType.FOUND, "Student ID card", "ID Card / Documents", "Found near the cafeteria steps. Collect from the security office.", "Cafeteria", 2, "Security Office");
        item(meera, ItemType.FOUND, "Black umbrella", "Accessories", "Large black umbrella with a wooden handle.", "Auditorium gate", 5, "Hostel A reception");
        item(meera, ItemType.LOST, "Water bottle", "Accessories", "Steel water bottle, green, with a dent.", "Library 2nd floor", 1, "Phone call");
        item(admin, ItemType.FOUND, "Water bottle", "Accessories", "Green steel bottle left on a study table.", "Library", 1, "Security Office");
    }

    private void item(User owner, ItemType type, String name, String category, String description,
                      String location, int daysAgo, String contact) {
        LostFound l = new LostFound();
        l.setUser(owner);
        l.setItemType(type);
        l.setItemName(name);
        l.setCategory(category);
        l.setDescription(description);
        l.setLocation(location);
        l.setDate(LocalDate.now().minusDays(daysAgo));
        l.setContactPreference(contact);
        l.setCreatedAt(Instant.now().minus(Duration.ofDays(daysAgo)));
        l.setDemo(true);
        lostFound.save(l);
    }

    private void seedAnnouncements(User admin) {
        announcement(admin, "Heavy rain advisory", "Heavy rain is expected tonight. Avoid the low-lying walkway near Block C and report any flooding.",
                AnnouncementCategory.SAFETY, AnnouncementPriority.IMPORTANT, Duration.ofHours(3));
        announcement(admin, "Water supply maintenance", "Water supply in Hostel A and B will be paused on Sunday between 10 AM and 1 PM.",
                AnnouncementCategory.MAINTENANCE, AnnouncementPriority.NORMAL, Duration.ofDays(1));
        announcement(admin, "Welcome to ResQ Campus", "Use the SOS button for emergencies and the report form for everything else. Keep your emergency contact up to date in your profile.",
                AnnouncementCategory.GENERAL, AnnouncementPriority.NORMAL, Duration.ofDays(6));
    }

    private void announcement(User admin, String title, String body, AnnouncementCategory cat,
                              AnnouncementPriority priority, Duration age) {
        Announcement a = new Announcement();
        a.setTitle(title);
        a.setDescription(body);
        a.setCategory(cat);
        a.setPriority(priority);
        a.setCreatedBy(admin);
        a.setPublished(true);
        a.setPublishedAt(Instant.now().minus(age));
        a.setCreatedAt(Instant.now().minus(age));
        a.setDemo(true);
        announcements.save(a);
    }

    private void addNotification(User user, String title, String message, NotificationType type, Duration age) {
        Notification n = new Notification();
        n.setUserId(user.getId());
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setCreatedAt(Instant.now().minus(age));
        notifications.save(n);
    }
}
