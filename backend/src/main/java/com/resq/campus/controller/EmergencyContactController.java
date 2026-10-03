package com.resq.campus.controller;

import com.resq.campus.dto.Dtos.ContactDto;
import com.resq.campus.dto.Dtos.ContactRequest;
import com.resq.campus.exception.ApiException;
import com.resq.campus.model.EmergencyContact;
import com.resq.campus.repository.EmergencyContactRepository;
import com.resq.campus.security.CurrentUser;
import com.resq.campus.util.Mapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency-contacts")
@RequiredArgsConstructor
public class EmergencyContactController {

    private final EmergencyContactRepository repo;

    /** Students see active contacts only; admins also see inactive ones. */
    @GetMapping
    @Transactional(readOnly = true)
    public List<ContactDto> list(@AuthenticationPrincipal CurrentUser me) {
        var list = me.isAdmin() ? repo.findAllByOrderByCategoryAscNameAsc() : repo.findByActiveTrueOrderByCategoryAscNameAsc();
        return list.stream().map(Mapper::contact).toList();
    }

    @PostMapping
    public ResponseEntity<ContactDto> create(@Valid @RequestBody ContactRequest req) {
        EmergencyContact c = new EmergencyContact();
        apply(c, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Mapper.contact(repo.save(c)));
    }

    @PutMapping("/{id}")
    @Transactional
    public ContactDto update(@PathVariable Long id, @Valid @RequestBody ContactRequest req) {
        EmergencyContact c = repo.findById(id).orElseThrow(() -> ApiException.notFound("Contact not found"));
        apply(c, req);
        return Mapper.contact(c);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) throw ApiException.notFound("Contact not found");
        repo.deleteById(id);
        return Map.of("success", true, "message", "Contact deleted");
    }

    private void apply(EmergencyContact c, ContactRequest req) {
        c.setName(req.name().trim());
        c.setDepartment(req.department());
        c.setDesignation(req.designation());
        c.setCategory(req.category());
        c.setPhone(req.phone().trim());
        c.setLocation(req.location());
        c.setAvailability(req.availability());
        if (req.active() != null) c.setActive(req.active());
    }
}
