package com.resq.campus.repository;

import com.resq.campus.model.EmergencyContact;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {

    List<EmergencyContact> findByActiveTrueOrderByCategoryAscNameAsc();

    List<EmergencyContact> findAllByOrderByCategoryAscNameAsc();

    @Query("""
            select c from EmergencyContact c
            where c.active = true
              and (lower(c.name) like lower(concat('%', :q, '%'))
                or lower(coalesce(c.department, '')) like lower(concat('%', :q, '%')))
            order by c.name
            """)
    List<EmergencyContact> searchActive(@Param("q") String q, Pageable pageable);
}
