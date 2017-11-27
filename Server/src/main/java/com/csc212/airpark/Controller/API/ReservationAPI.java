package com.csc212.airpark.Controller.API;

import com.csc212.airpark.Controller.API.Entity.ResponseStatus;
import com.csc212.airpark.JPA.Entity.Reservation;
import com.csc212.airpark.JPA.Entity.Spot;
import com.csc212.airpark.JPA.Entity.User;
import com.csc212.airpark.JPA.Repository.SpotRepository;
import com.csc212.airpark.JPA.Repository.UserRepository;
import com.csc212.airpark.JPA.Repository.ReservationRepository;
import com.csc212.airpark.Services.AirParkUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
public class ReservationAPI {

    @Autowired
    private ReservationRepository reservationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SpotRepository spotRepository;
    @Autowired
    private AirParkUserDetailsService userDetailsService;

    @PostMapping("/api/reservation")
    public ResponseStatus addReservation(@RequestParam("spotId") Integer spotId,
                                         @RequestParam("startTime") Long startTime,
                                         @RequestParam("expirationTime") Long expirationTime) {
        try {
            User user = userDetailsService.getLoggedInUser();
            Reservation reservation = new Reservation(user.getUserId(), spotId, startTime, expirationTime);
            reservationRepository.save(reservation);

            return new ResponseStatus(0, "Created reservation.");
        } catch (Exception e) {
            return new ResponseStatus(1, "Could not create reservation: " + e.getMessage());
        }
    }

    @PatchMapping("/api/reservation/{reservationId}")
    public ResponseStatus editReservation() {
        return new ResponseStatus(1, "Could not edit reservation.");
    }

    // this method doesn't actually delete a reservation from the repository, but sets its flag to inactive
    // this is because we want to keep a history of all reservations made by a user
    @RequestMapping("/api/reservation/cancel/{reservationId}")
    public ResponseStatus cancelReservation(@PathVariable("reservationId") Integer reservationId) {
        // You can only cancel a reservation if you are either the renter or the host

        Reservation reservation = reservationRepository.findByReservationId(reservationId);

        if(reservation == null) {
            return new ResponseStatus(1, String.format("Could not cancel reservation with id %d because it does not exist.", reservationId));
        }

        Spot spot = spotRepository.findBySpotId(reservation.getSpotId());
        User renter = userRepository.findByUserId(reservation.getUserId());
        User owner = userRepository.findByUserId(spot.getOwnerUserId());

        // if the user is not the renter or owner
        if(userDetailsService.getLoggedInUser().compareTo(renter) != 0 && userDetailsService.getLoggedInUser().compareTo(owner) != 0) {
            return new ResponseStatus(1, "You do not have permission to cancel this reservation.");
        }

        reservation.setActiveStatus(false);
        reservationRepository.save(reservation);
        return new ResponseStatus(0, String.format("Cancelled reservation with id: %d", reservationId));
    }

    @GetMapping("/api/reservation/{reservationId}")
    public Reservation getReservation(@PathVariable("reservationId") Integer reservationId) {
        return reservationRepository.findByReservationId(reservationId);
    }

    @GetMapping("/api/reservations")
    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    // returns a list of all active or inactive reservations made by a user
    @GetMapping(value = "/api/reservations", params = {"renter", "activeStatus"})
    public List<Reservation> getAllReservationsForRenter(@RequestParam("renter") Integer renterId,
                                                         @RequestParam("activeStatus") boolean activeStatus) {

        User renter = userRepository.findByUserId(renterId);

        // if the user making the request is not the renter, they are not allowed to see the list
        if(renter == null || userDetailsService.getLoggedInUser().compareTo(renter) != 0) {
            // return an empty list
            return new ArrayList<>();
        }

        return reservationRepository.findAllByUserIdAndActiveStatus(renterId, activeStatus);
    }

    // returns a list of all active or inactive reservations which include one of the owner's spots
    @GetMapping(value = "/api/reservations", params = {"owner", "activeStatus"})
    public List<Reservation> getAllReservationsForOwner(@RequestParam("owner") Integer ownerId,
                                                        @RequestParam("activeStatus") boolean activeStatus) {

        User owner = userRepository.findByUserId(ownerId);

        // if the user making the request is not the owner, they are not allowed to see the list
        if(owner == null || userDetailsService.getLoggedInUser().compareTo(owner) != 0) {
            // return an empty list
            return new ArrayList<>();
        }

        List<Spot> ownedSpots = spotRepository.findAllByOwnerUserId(owner.getUserId());
        List<Reservation> reservations = new ArrayList<>();

        for(Spot spot: ownedSpots) {
            reservations.addAll(reservationRepository.findAllBySpotIdAndActiveStatus(spot.getSpotId(), activeStatus));
        }

        return reservations;
    }
}
