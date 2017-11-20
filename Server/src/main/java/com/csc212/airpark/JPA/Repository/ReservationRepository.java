package com.csc212.airpark.JPA.Repository;

import com.csc212.airpark.JPA.Entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {
    Reservation findByReservationId(Integer reservationId);
    List<Reservation> findAllByUserIdAndActiveStatus(Integer userId, boolean activeStatus);
    List<Reservation> findAllBySpotIdAndActiveStatus(Integer spotId, boolean activeStatus);
}
