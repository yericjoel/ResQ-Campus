package com.resq.campus.repository;

import com.resq.campus.model.IncidentEvidence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentEvidenceRepository extends JpaRepository<IncidentEvidence, Long> {
    List<IncidentEvidence> findByIncidentId(Long incidentId);
}
