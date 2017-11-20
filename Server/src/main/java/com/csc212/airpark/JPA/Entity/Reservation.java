package com.csc212.airpark.JPA.Entity;

import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Entity
@Table(name = "Reservation")
@Data
@NoArgsConstructor
public class Reservation {

    public Reservation(Integer userId, Integer spotId, Long startTime, Long expirationTime) {
        this.userId = userId;
        this.spotId = spotId;
        this.startTime = startTime;
        this.expirationTime = expirationTime;
        this.activeStatus = true;
    }

    @Id
    @GeneratedValue
    @Column(name = "reservationId", unique = true, updatable = false)
    private Integer reservationId = -1;

    @Column(name = "userId", unique = false, updatable = false)
    private Integer userId;

    @Column(name = "spotId", unique = false, updatable = false)
    private Integer spotId;

    @Column(name = "startTime", unique = false, updatable = true)
    private Long startTime;

    @Column(name = "expirationTime", unique = false, updatable = true)
    private Long expirationTime;

    @Column(name = "activeStatus", unique = false, updatable = true)
    private boolean activeStatus;
}
