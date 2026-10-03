package com.resq.campus.model;

import com.resq.campus.model.Enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /** BCrypt hash - never the plain password. */
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "student_id", length = 40)
    private String studentId;

    @Column(length = 80)
    private String department;

    @Column(name = "year")
    private Integer year;

    @Column(length = 20)
    private String phone;

    @Column(name = "profile_image")
    private String profileImage;

    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** true for seeded demo records. */
    @Column(nullable = false)
    private boolean demo = false;
}
