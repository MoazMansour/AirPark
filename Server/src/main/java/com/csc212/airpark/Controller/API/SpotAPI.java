package com.csc212.airpark.Controller.API;

import com.csc212.airpark.Controller.API.Entity.ResponseStatus;
import com.csc212.airpark.JPA.Entity.Spot;
import com.csc212.airpark.JPA.Entity.User;
import com.csc212.airpark.JPA.Repository.SpotRepository;
import com.csc212.airpark.JPA.Repository.UserRepository;
import com.csc212.airpark.Services.AirParkUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
public class SpotAPI {

    @Autowired
    private SpotRepository spotRepository;
    @Autowired
    private UserRepository userRepository;


    @Autowired
    private AirParkUserDetailsService userDetailsService;

    @PostMapping("/api/spot")
    public ResponseStatus addSpot(@RequestParam("latitude") double latitude,
                                  @RequestParam("longitude") double longitude,
                                  @RequestParam("capacity") int capacity){

        try {
            Spot newSpot = new Spot(latitude, longitude, capacity);

            userDetailsService.getLoggedInUser().addSpot(newSpot);
            spotRepository.save(newSpot);

            return new ResponseStatus(0, "Created spot.");
        } catch (Exception e){
            return new ResponseStatus(1,"Could not create spot: "+e.getMessage());
        }
    }

    @PatchMapping("/api/spot/{spotId}")
    public ResponseStatus editSpot(){
        return new ResponseStatus(1,"Could not edit spot.");
    }

    @DeleteMapping("/api/spot/{spotId}")
    public ResponseStatus deleteSpot(@PathVariable("spotId") Integer spotId){
        // You can only delete a spot if you own it

        Spot spotToDelete = spotRepository.findBySpotId(spotId);

        if (spotToDelete == null) {
            return new ResponseStatus(1, "Could not delete spot: Spot does not exist.");
        }
        if (spotToDelete.getUser() != userDetailsService.getLoggedInUser()){
            return new ResponseStatus(1,"Could not delete spot: You do not own this spot!");
        }

        // Remove spot from the user's spot list, and then delete it from the database.
        userDetailsService.getLoggedInUser().removeSpot(spotToDelete);
        spotRepository.delete(spotToDelete);
        return new ResponseStatus(1,"Deleted spot. ");
    }

    @GetMapping("/api/spot/{spotId}")
    public Spot getSpot(@PathVariable("spotId") Integer spotId){
        return spotRepository.findBySpotId(spotId);
    }

    @GetMapping("/api/spots")
    public List<Spot> getAllSpots(){
        return spotRepository.findAll();
    }

    @GetMapping(value = "/api/spots", params = {"user"})
    public List<Spot> getAllSpotsForUser(@RequestParam("user") Integer userId){
        User userToSearchBy = userRepository.findByUserId(userId);
        if (userToSearchBy != null) {
            return spotRepository.findAllByUser(userId);
        } else {
            return new ArrayList<>();
        }
    }


    @GetMapping(value = "/api/spots",params = {"latitude","longitude","radius"})
    public List<Spot> getSpotsInRadius( @RequestParam("latitude") double latitude,
                                        @RequestParam("longitude") double longitude,
                                        @RequestParam("radius") double radius){
        return findSpotsInRadius(latitude,longitude,radius);
    }

    private static final double METERS_TO_MILES = 0.000621371;

    // Filter all the spots based on their radius to a given point
    // Radius is specified in miles
    private ArrayList<Spot> findSpotsInRadius(double latitude, double longitude, double radius){
        ArrayList<Spot> spotList = new ArrayList<>();
        for (Spot spot  : spotRepository.findAll()){
            double distanceToPoint = distance(latitude, spot.getLatitude(), longitude, spot.getLongitude(), 0, 0) * METERS_TO_MILES;
            if (distanceToPoint <= radius){
                spotList.add(spot);
            }
        }
        return spotList;
    }

    /**
     * From https://stackoverflow.com/questions/3694380/calculating-distance-between-two-points-using-latitude-longitude-what-am-i-doi
     * Calculate distance between two points in latitude and longitude taking
     * into account height difference. If you are not interested in height
     * difference pass 0.0. Uses Haversine method as its base.
     *
     * lat1, lon1 Start point lat2, lon2 End point el1 Start altitude in meters
     * el2 End altitude in meters
     * @returns Distance in Meters
     */
    public static double distance(double lat1, double lat2, double lon1,
                                  double lon2, double el1, double el2) {

        final int R = 6371; // Radius of the earth

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c * 1000; // convert to meters

        double height = el1 - el2;

        distance = Math.pow(distance, 2) + Math.pow(height, 2);

        return Math.sqrt(distance);
    }

}
