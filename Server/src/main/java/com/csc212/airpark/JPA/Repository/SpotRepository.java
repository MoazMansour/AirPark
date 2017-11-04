package com.csc212.airpark.JPA.Repository;

import com.csc212.airpark.JPA.Entity.Spot;
import com.csc212.airpark.JPA.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpotRepository extends JpaRepository<Spot, Integer> {
    Spot findBySpotId(int spotId);
    List<Spot> findAllByUser(int userId);
}
