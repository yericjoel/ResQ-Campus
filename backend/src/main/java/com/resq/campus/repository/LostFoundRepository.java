package com.resq.campus.repository;

import com.resq.campus.model.Enums.ItemStatus;
import com.resq.campus.model.Enums.ItemType;
import com.resq.campus.model.LostFound;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LostFoundRepository extends JpaRepository<LostFound, Long> {

    List<LostFound> findAllByOrderByCreatedAtDesc();

    List<LostFound> findByItemTypeOrderByCreatedAtDesc(ItemType type);

    List<LostFound> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<LostFound> findByItemTypeAndStatus(ItemType type, ItemStatus status);

    long countByStatus(ItemStatus status);

    long countByUserIdAndStatus(Long userId, ItemStatus status);
}
