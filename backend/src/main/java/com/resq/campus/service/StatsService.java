package com.resq.campus.service;

import com.resq.campus.dto.Dtos.*;
import com.resq.campus.exception.ApiException;
import com.resq.campus.model.Enums.*;
import com.resq.campus.model.User;
import com.resq.campus.repository.*;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final IncidentRepository incidents;
    private final SosRepository sos;
    private final NotificationRepository notifications;
    private final LostFoundRepository lostFound;
    private final LostFoundMatchRepository matches;
    private final UserRepository users;
    private final EmergencyContactRepository contacts;
    private final AnnouncementRepository announcements;

    @Value("${resq.zone:UTC}")
    private String zone;

    public StudentStats student(CurrentUser me) {
        User user = users.findById(me.id()).orElseThrow(() -> ApiException.notFound("User not found"));
        long total = incidents.countByUserId(me.id());
        long resolved = incidents.countByUserIdAndStatus(me.id(), IncidentStatus.RESOLVED);
        long critical = incidents.countByStatusInAndSeverityIn(IncidentStatus.ACTIVE, List.of(Severity.HIGH, Severity.CRITICAL));
        long criticalOnly = incidents.countByStatusInAndSeverityIn(IncidentStatus.ACTIVE, List.of(Severity.CRITICAL));
        long activeSos = sos.countByStatusIn(SosStatus.ACTIVE);

        return new StudentStats(
                (int) total,
                (int) incidents.countByUserIdAndCreatedAtAfter(me.id(), Instant.now().minus(Duration.ofDays(7))),
                (int) critical,
                (int) incidents.countByUserIdAndStatusIn(me.id(), IncidentStatus.ACTIVE),
                (int) resolved,
                total == 0 ? 0 : (int) Math.round(100.0 * resolved / total),
                (int) matches.countActiveForUser(me.id()),
                (int) lostFound.countByUserIdAndStatus(me.id(), ItemStatus.MATCHED),
                (int) notifications.countByUserIdAndReadFalse(me.id()),
                Mapper.profileCompletion(user),
                (criticalOnly > 0 || activeSos > 0) ? "ELEVATED" : "NORMAL");
    }

    public AdminStats admin() {
        Instant startOfToday = LocalDate.now(ZoneId.of(zone)).atStartOfDay(ZoneId.of(zone)).toInstant();
        return new AdminStats(
                (int) sos.countByStatusIn(SosStatus.ACTIVE),
                (int) incidents.countByStatusIn(IncidentStatus.ACTIVE),
                (int) incidents.countByCreatedAtAfter(startOfToday),
                (int) lostFound.countByStatus(ItemStatus.OPEN));
    }

    /** Recent activity: the user's own reports and SOS; for admins, campus-wide. */
    public List<ActivityItem> activity(CurrentUser me) {
        List<ActivityItem> list = new ArrayList<>();
        if (me.isAdmin()) {
            incidents.findTop10ByOrderByCreatedAtDesc().forEach(i -> list.add(Mapper.activity(i)));
            sos.findTop10ByOrderByCreatedAtDesc().forEach(s -> list.add(Mapper.activity(s)));
        } else {
            incidents.findTop10ByUserIdOrderByCreatedAtDesc(me.id()).forEach(i -> list.add(Mapper.activity(i)));
            sos.findTop5ByUserIdOrderByCreatedAtDesc(me.id()).forEach(s -> list.add(Mapper.activity(s)));
        }
        list.sort(Comparator.comparing(ActivityItem::createdAt).reversed());
        return list.stream().limit(8).toList();
    }

    public SearchResult search(CurrentUser me, String q) {
        String term = q == null ? "" : q.trim();
        if (term.length() < 2) return new SearchResult(List.of(), List.of(), List.of());
        var page = PageRequest.of(0, 5);
        return new SearchResult(
                incidents.searchMine(me.id(), term, page).stream().map(Mapper::activity).toList(),
                contacts.searchActive(term, page).stream().map(Mapper::contact).toList(),
                announcements.searchPublished(term, page).stream().map(Mapper::announcement).toList());
    }
}
