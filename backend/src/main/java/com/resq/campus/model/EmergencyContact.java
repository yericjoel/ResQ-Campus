package com.resq.campus.model;

import com.resq.campus.model.Enums.ContactCategory;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "emergency_contacts")
@Getter
@Setter
public class EmergencyContact extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 120)
    private String department;

    @Column(length = 120)
    private String designation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ContactCategory category;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(length = 200)
    private String location;

    @Column(length = 120)
    private String availability;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean demo = false;
}
