package com.csc212.airpark.JPA.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Entity
@Table(name = "Spot")
@Data
@NoArgsConstructor
public class Spot {

    public Spot(double latitude, double longitude, int capacity) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.capacity = capacity;
    }

    @Id
    @GeneratedValue
    @Column(name = "spotId", unique = true, updatable = false)
    private Integer spotId = -1;

    @Column(name = "lat")
    private double latitude;

    @Column(name = "lon")
    private double longitude;

    @Column(name = "capacity")
    private int capacity = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user")
    @JsonIgnore
    private User user;
}
