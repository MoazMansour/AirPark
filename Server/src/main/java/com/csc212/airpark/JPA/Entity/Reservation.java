package com.csc212.airpark.JPA.Entity;

import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Entity
@Table(name = "Reservation")
@Data
@NoArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue
    @Column(name = "reservationId", unique = true, updatable = false)
    private Integer reservationId = -1;


}
