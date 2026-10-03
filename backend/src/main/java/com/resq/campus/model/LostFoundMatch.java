package com.resq.campus.model;

import com.resq.campus.model.Enums.MatchStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "lost_found_matches",
        uniqueConstraints = @UniqueConstraint(columnNames = {"lost_item_id", "found_item_id"}))
@Getter
@Setter
public class LostFoundMatch extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "lost_item_id", nullable = false)
    private LostFound lostItem;

    @ManyToOne(optional = false)
    @JoinColumn(name = "found_item_id", nullable = false)
    private LostFound foundItem;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_status", nullable = false, length = 20)
    private MatchStatus matchStatus = MatchStatus.PENDING;
}
