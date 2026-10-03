package com.resq.campus.controller;

import com.resq.campus.dto.Dtos.*;
import com.resq.campus.model.Enums.ItemType;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.service.LostFoundService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lost-found")
@RequiredArgsConstructor
public class LostFoundController {

    private final LostFoundService service;

    public record LostFoundForm(
            @NotNull(message = "Choose lost or found") ItemType itemType,
            @NotBlank(message = "Item name is required") @Size(max = 120) String itemName,
            @NotBlank(message = "Category is required") @Size(max = 60) String category,
            @Size(max = 2000) String description,
            @NotBlank(message = "Location is required") @Size(max = 200) String location,
            @NotNull(message = "Date is required") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Size(max = 120) String contactPreference) {}

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LostFoundDto> create(@AuthenticationPrincipal CurrentUser me,
                                               @Valid @ModelAttribute LostFoundForm form,
                                               @RequestParam(value = "photo", required = false) MultipartFile photo) {
        var input = new LostFoundService.CreateInput(form.itemType(), form.itemName(), form.category(),
                form.description(), form.location(), form.date(), form.contactPreference());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(me, input, photo));
    }

    /** ?type=LOST|FOUND filters by type; ?mine=true returns only the caller's items. */
    @GetMapping
    public List<LostFoundDto> list(@AuthenticationPrincipal CurrentUser me,
                                   @RequestParam(required = false) String type,
                                   @RequestParam(defaultValue = "false") boolean mine) {
        return service.list(me, type, mine);
    }

    // ---- matches (declared before /{id} routes; the literal path always wins) ----

    @GetMapping("/matches")
    public List<MatchDto> matches(@AuthenticationPrincipal CurrentUser me) {
        return service.listMatches(me);
    }

    @PostMapping("/matches")
    public ResponseEntity<MatchDto> createMatch(@AuthenticationPrincipal CurrentUser me,
                                                @Valid @RequestBody MatchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createMatch(me, request));
    }

    @PutMapping("/matches/{id}")
    public MatchDto updateMatch(@AuthenticationPrincipal CurrentUser me, @PathVariable Long id,
                                @Valid @RequestBody MatchStatusRequest request) {
        return service.updateMatch(me, id, request.matchStatus());
    }

    @GetMapping("/{id}")
    public LostFoundDto get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping("/{id}/suggestions")
    public List<SuggestionDto> suggestions(@PathVariable Long id) {
        return service.suggestions(id);
    }

    @PutMapping("/{id}")
    public LostFoundDto update(@AuthenticationPrincipal CurrentUser me, @PathVariable Long id,
                               @Valid @RequestBody LostFoundUpdateRequest request) {
        return service.update(me, id, request);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@AuthenticationPrincipal CurrentUser me, @PathVariable Long id) {
        service.delete(me, id);
        return Map.of("success", true, "message", "Item deleted");
    }
}
