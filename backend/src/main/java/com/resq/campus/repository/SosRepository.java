package com.resq.campus.repository;

import com.resq.campus.model.Enums.SosStatus;
import com.resq.campus.model.SosRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SosRepository extends JpaRepository<SosRequest, Long> {

    List<SosRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<SosRequest> findAllByOrderByCreatedAtDesc();

    List<SosRequest> findByStatusInOrderByCreatedAtDesc(Collection<SosStatus> statuses);

    Optional<SosRequest> findFirstByUserIdAndStatusInOrderByCreatedAtDesc(Long userId, Collection<SosStatus> statuses);

    List<SosRequest> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);

    List<SosRequest> findTop10ByOrderByCreatedAtDesc();

    long countByStatusIn(Collection<SosStatus> statuses);
}
