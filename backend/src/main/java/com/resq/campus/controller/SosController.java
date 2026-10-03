package com.resq.campus.controller;

import com.resq.campus.dto.Dtos.SosCreateRequest;
import com.resq.campus.dto.Dtos.SosDto;
import com.resq.campus.dto.Dtos.SosStatusRequest;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.service.SosService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sos")
@RequiredArgsConstructor
public class SosController {

    private final SosService sos;

    @PostMapping
    public ResponseEntity<SosDto> create(@AuthenticationPrincipal CurrentUser me,
                                         @Valid @RequestBody(required = false) SosCreateRequest request) {
        SosCreateRequest body = request != null ? request : new SosCreateRequest(null, null, null, null, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(sos.create(me, body));
    }

    @GetMapping("/my")
    public List<SosDto> mine(@AuthenticationPrincipal CurrentUser me) {
        return sos.mine(me.id());
    }

    /** Admin only (SecurityConfig). ?active=true returns just the unresolved ones. */
    @GetMapping
    public List<SosDto> all(@RequestParam(defaultValue = "false") boolean active) {
        return sos.all(active);
    }

    @GetMapping("/{id}")
    public SosDto get(@AuthenticationPrincipal CurrentUser me, @PathVariable Long id) {
        return sos.get(me, id);
    }

    @PutMapping("/{id}/status")
    public SosDto updateStatus(@AuthenticationPrincipal CurrentUser me, @PathVariable Long id,
                               @Valid @RequestBody SosStatusRequest request) {
        return sos.updateStatus(me, id, request.status());
    }
}
