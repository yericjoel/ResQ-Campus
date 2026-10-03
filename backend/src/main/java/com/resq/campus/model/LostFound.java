package com.resq.campus.model;

import com.resq.campus.model.Enums.ItemStatus;
import com.resq.campus.model.Enums.ItemType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "lost_found")
@Getter
@Setter
public class LostFound extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 10)
    private ItemType itemType;

    @Column(name = "item_name", nullable = false, length = 120)
    private String itemName;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Last seen location (lost) or found location (found). */
    @Column(nullable = false, length = 200)
    private String location;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "contact_preference", length = 120)
    private String contactPreference;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemStatus status = ItemStatus.OPEN;

    @Column(nullable = false)
    private boolean demo = false;
}
