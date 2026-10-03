package com.resq.campus.repository;

import com.resq.campus.model.IncidentUpdate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentUpdateRepository extends JpaRepository<IncidentUpdate, Long> {
    List<IncidentUpdate> findByIncidentIdOrderByCreatedAtAsc(Long incidentId);
}
