package com.resq.campus.controller;

import com.resq.campus.dto.Dtos.IncidentDto;
import com.resq.campus.dto.Dtos.IncidentUpdateRequest;
import com.resq.campus.model.Enums.IncidentType;
import com.resq.campus.model.Enums.Severity;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.service.IncidentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService service;

    /** Multipart form fields of a new incident report. */
    public record IncidentForm(
            @NotNull(message = "Incident type is required") IncidentType type,
            @NotBlank(message = "Title is required") @Size(max = 150, message = "Title is too long") String title,
            @NotBlank(message = "Description is required") @Size(max = 5000) String description,
            @NotBlank(message = "Location is required") @Size(max = 200) String location,
            String incidentDate,
            @NotNull(message = "Severity is required") Severity severity) {}

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IncidentDto> create(@AuthenticationPrincipal CurrentUser me,
                                              @Valid @ModelAttribute IncidentForm form,
                                              @RequestParam(value = "photo", required = false) MultipartFile photo) {
        var input = new IncidentService.CreateInput(form.type(), form.title(), form.description(),
                form.location(), form.incidentDate(), form.severity());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(me, input, photo));
    }

    @GetMapping("/my")
    public List<IncidentDto> mine(@AuthenticationPrincipal CurrentUser me) {
        return service.mine(me.id());
    }

    /** Admin only (SecurityConfig). filter = all | open | in_review | high | resolved */
    @GetMapping
    public List<IncidentDto> all(@RequestParam(defaultValue = "all") String filter) {
        return service.all(filter);
    }

    @GetMapping("/{id}")
    public IncidentDto get(@AuthenticationPrincipal CurrentUser me, @PathVariable Long id) {
        return service.get(me, id);
    }

    @PutMapping("/{id}")
    public IncidentDto update(@AuthenticationPrincipal CurrentUser me, @PathVariable Long id,
                              @Valid @RequestBody IncidentUpdateRequest request) {
        return service.update(me, id, request);
    }
}
