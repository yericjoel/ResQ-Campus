package com.resq.campus.repository;

import com.resq.campus.model.Enums.MatchStatus;
import com.resq.campus.model.LostFoundMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LostFoundMatchRepository extends JpaRepository<LostFoundMatch, Long> {

    boolean existsByLostItemIdAndFoundItemId(Long lostItemId, Long foundItemId);

    List<LostFoundMatch> findAllByOrderByCreatedAtDesc();

    @Query("""
            select m from LostFoundMatch m
            where m.lostItem.user.id = :uid or m.foundItem.user.id = :uid
            order by m.createdAt desc
            """)
    List<LostFoundMatch> findForUser(@Param("uid") Long userId);

    @Query("""
            select count(m) from LostFoundMatch m
            where (m.lostItem.user.id = :uid or m.foundItem.user.id = :uid)
              and m.matchStatus <> :excluded
            """)
    long countForUserExcluding(@Param("uid") Long userId, @Param("excluded") MatchStatus excluded);

    /** Matches involving the user that were not rejected. */
    default long countActiveForUser(Long userId) {
        return countForUserExcluding(userId, MatchStatus.REJECTED);
    }
}
