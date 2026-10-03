package com.resq.campus.repository;

import com.resq.campus.model.Announcement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByOrderByCreatedAtDesc();

    List<Announcement> findByPublishedTrueOrderByPublishedAtDesc();

    @Query("""
            select a from Announcement a
            where a.published = true
              and (lower(a.title) like lower(concat('%', :q, '%'))
                or lower(a.description) like lower(concat('%', :q, '%')))
            order by a.publishedAt desc
            """)
    List<Announcement> searchPublished(@Param("q") String q, Pageable pageable);
}
