package com.resq.campus.model;

import com.resq.campus.model.Enums.SosStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "sos_requests")
@Getter
@Setter
public class SosRequest extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Public SOS id such as SOS-2001. */
    @Column(name = "sos_id", nullable = false, unique = true, length = 40)
    private String sosId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 200)
    private String location;

    private Double latitude;
    private Double longitude;

    @Column(length = 500)
    private String description;

    /** e.g. "Medical Assistance". */
    @Column(length = 60)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SosStatus status = SosStatus.TRIGGERED;

    @ManyToOne
    @JoinColumn(name = "acknowledged_by")
    private User acknowledgedBy;

    @ManyToOne
    @JoinColumn(name = "dispatched_by")
    private User dispatchedBy;

    @ManyToOne
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "dispatched_at")
    private Instant dispatchedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
