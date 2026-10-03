package com.resq.campus.repository;

import com.resq.campus.model.Enums.IncidentStatus;
import com.resq.campus.model.Enums.Severity;
import com.resq.campus.model.Incident;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Incident> findAllByOrderByCreatedAtDesc();

    List<Incident> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    List<Incident> findTop10ByOrderByCreatedAtDesc();

    long countByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, IncidentStatus status);

    long countByUserIdAndStatusIn(Long userId, Collection<IncidentStatus> statuses);

    long countByUserIdAndCreatedAtAfter(Long userId, Instant after);

    long countByStatusIn(Collection<IncidentStatus> statuses);

    long countByStatusInAndSeverityIn(Collection<IncidentStatus> statuses, Collection<Severity> severities);

    long countByCreatedAtAfter(Instant after);

    @Query("""
            select i from Incident i
            where i.user.id = :uid
              and (lower(i.title) like lower(concat('%', :q, '%'))
                or lower(i.location) like lower(concat('%', :q, '%'))
                or lower(i.reportId) like lower(concat('%', :q, '%')))
            order by i.createdAt desc
            """)
    List<Incident> searchMine(@Param("uid") Long userId, @Param("q") String q, Pageable pageable);
}
