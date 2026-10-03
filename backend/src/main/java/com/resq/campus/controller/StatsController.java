package com.resq.campus.controller;

import com.resq.campus.dto.Dtos.*;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService stats;

    @GetMapping("/stats/student")
    public StudentStats student(@AuthenticationPrincipal CurrentUser me) {
        return stats.student(me);
    }

    /** Admin only (SecurityConfig). */
    @GetMapping("/stats/admin")
    public AdminStats admin() {
        return stats.admin();
    }

    @GetMapping("/stats/activity")
    public List<ActivityItem> activity(@AuthenticationPrincipal CurrentUser me) {
        return stats.activity(me);
    }

    @GetMapping("/search")
    public SearchResult search(@AuthenticationPrincipal CurrentUser me, @RequestParam("q") String q) {
        return stats.search(me, q);
    }
}
