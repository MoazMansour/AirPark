package com.csc212.airpark.Controller.API.Entity;

import com.csc212.airpark.JPA.Entity.Reservation;
import com.csc212.airpark.JPA.Entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationInfo {

    private Reservation reservation;
    private User owner;
    private User renter;
    private String address;
}
