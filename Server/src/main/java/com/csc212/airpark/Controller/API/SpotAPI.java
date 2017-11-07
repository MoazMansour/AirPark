package com.csc212.airpark.Controller.API;

import com.csc212.airpark.Controller.API.Entity.ResponseStatus;
import com.csc212.airpark.JPA.Entity.Spot;
import com.csc212.airpark.JPA.Entity.User;
import com.csc212.airpark.JPA.Repository.SpotRepository;
import com.csc212.airpark.JPA.Repository.UserRepository;
import com.csc212.airpark.Services.AirParkUserDetailsService;
import com.google.maps.DistanceMatrixApi;
import com.google.maps.DistanceMatrixApiRequest;
import com.google.maps.GeoApiContext;
import com.google.maps.errors.ApiException;
import com.google.maps.model.DistanceMatrix;
import com.google.maps.model.DistanceMatrixElement;
import com.google.maps.model.LatLng;
import com.google.maps.model.TravelMode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
public class SpotAPI {

    private static final String GOOGLE_API_KEY = "AIzaSyBetMNQkTi2Ug18prPG9oTeAcHx5ZkRJys";
    private static final GeoApiContext geoApiContext = new GeoApiContext.Builder()
            .apiKey(GOOGLE_API_KEY)
            .build();

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


    @GetMapping(value = "/api/spots",params = {"latitude", "longitude", "walkingDistance"})
    public List<Spot> getSpotsInWalkingDistance( @RequestParam("latitude") double latitude,
                                        @RequestParam("longitude") double longitude,
                                        @RequestParam("walkingDistance") double walkingDistance)
            throws InterruptedException, ApiException, IOException {
        return findSpotsInWalkingDistance(latitude, longitude, walkingDistance);
    }

    @GetMapping(value = "/api/spots",params = {"latitude", "longitude", "walkingDuration"})
    public List<Spot> getSpotsInWalkingDuration( @RequestParam("latitude") double latitude,
                                                 @RequestParam("longitude") double longitude,
                                                 @RequestParam("walkingDuration") double walkingDuration)
            throws InterruptedException, ApiException, IOException {
        return findSpotsInWalkingDuration(latitude, longitude, walkingDuration);
    }

    private static final double METERS_TO_MILES = 0.000621371;

    // Filter all the spots based on their walking distance from the user
    // walking distance is specified in miles
    private ArrayList<Spot> findSpotsInWalkingDistance(double latitude, double longitude, double walkingDistance)
            throws InterruptedException, ApiException, IOException {
        ArrayList<Spot> validSpots = new ArrayList<>();

        List<Spot> allSpots = spotRepository.findAll();

        LatLng origin = new LatLng(latitude, longitude);
        LatLng[] destinations = new LatLng[allSpots.size()];

        for(int i = 0; i < allSpots.size(); i++) {
            Spot spot = allSpots.get(i);
            destinations[i] = new LatLng(spot.getLatitude(), spot.getLongitude());
        }

        try {
            DistanceMatrix distanceMatrix = getWalkingDistanceMatrix(origin, destinations);
            DistanceMatrixElement[] elements = distanceMatrix.rows[0].elements;
            for (int i = 0; i < elements.length; i++) {
                if (elements[i].distance.inMeters * METERS_TO_MILES <= walkingDistance) {
                    validSpots.add(allSpots.get(i));
                }
            }
        } catch (Exception e) {
            String errorString = String.format("Unable to get walking distances to destinations from origin: [%f, %f]",
                    latitude, longitude);
            System.out.println(errorString);
            throw e;
        }

        return validSpots;
    }

    // Filter all the spots based on their walking duration for the user
    // duration is specified in minutes
    private ArrayList<Spot> findSpotsInWalkingDuration(double latitude, double longitude, double walkingDuration)
            throws InterruptedException, ApiException, IOException {
        ArrayList<Spot> validSpots = new ArrayList<>();

        List<Spot> allSpots = spotRepository.findAll();

        LatLng origin = new LatLng(latitude, longitude);
        LatLng[] destinations = new LatLng[allSpots.size()];

        for(int i = 0; i < allSpots.size(); i++) {
            Spot spot = allSpots.get(i);
            destinations[i] = new LatLng(spot.getLatitude(), spot.getLongitude());
        }

        try {
            DistanceMatrix distanceMatrix = getWalkingDistanceMatrix(origin, destinations);
            DistanceMatrixElement[] elements = distanceMatrix.rows[0].elements;
            for (int i = 0; i < elements.length; i++) {
                if (elements[i].duration.inSeconds <= walkingDuration * 60) {
                    validSpots.add(allSpots.get(i));
                }
            }
        } catch (Exception e) {
            String errorString = String.format("Unable to get walking durations to destinations from origin: [%f, %f]",
                    latitude, longitude);
            System.out.println(errorString);
            throw e;
        }

        return validSpots;
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

    private static DistanceMatrix getWalkingDistanceMatrix(LatLng origin, LatLng[] destinations)
            throws InterruptedException, ApiException, IOException {
        DistanceMatrixApiRequest request = DistanceMatrixApi.newRequest(geoApiContext);

        return request.origins(origin)
                .destinations(destinations)
                .mode(TravelMode.WALKING)
                .await();
    }
    /*
    public static void main(String[] args) throws InterruptedException, ApiException, IOException {
        LatLng rochester = new LatLng(43.1280630, -77.6410030);
        LatLng seattle = new LatLng(47.6253050, -122.3221830);
        LatLng boston = new LatLng(42.3600830, -71.0588800);
        LatLng sanfrancisco = new LatLng(37.7749300, -122.4194160);

        LatLng[] destinations = new LatLng[]{seattle, boston, sanfrancisco};

        DistanceMatrix distanceMatrix = getWalkingDistanceMatrix(rochester, destinations);
        System.out.println(distanceMatrix.rows[0].elements[0].distance.inMeters);
        System.out.println(distanceMatrix.rows[0].elements[1].distance.inMeters);
        System.out.println(distanceMatrix.rows[0].elements[2].distance.inMeters);

        System.out.println(distanceMatrix.rows[0].elements[0].duration.inSeconds);
        System.out.println(distanceMatrix.rows[0].elements[1].duration.inSeconds);
        System.out.println(distanceMatrix.rows[0].elements[2].duration.inSeconds);
    }
    */
}
