package com.csc212.airpark.Controller.API;

import com.csc212.airpark.Controller.API.Entity.*;
import com.csc212.airpark.Controller.API.Entity.ResponseStatus;
import com.csc212.airpark.JPA.Entity.User;
import com.csc212.airpark.JPA.Repository.UserRepository;
import com.csc212.airpark.Services.AirParkUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import javax.xml.ws.Response;

@RestController
public class UserAPI {

    @Autowired
    private AirParkUserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;


    @GetMapping("/api/user_host")
    public UserHostFlag getUserHostMode(){
        return new UserHostFlag(getActiveUser().isHost());
    }

    @PostMapping("/api/user_host")
    public ResponseStatus setUserHostMode(@RequestParam("host") Boolean isHost){
        try {
            getActiveUser().setHost(isHost);
            userRepository.save(getActiveUser());
            return new ResponseStatus(0,"Set user host mode to "+isHost);
        } catch (Exception e){
            return new ResponseStatus(1,"Error: Could not set user host mode!");
        }
    }

    @PostMapping("/api/user")
    public ResponseStatus createUser(@RequestParam("username") String username, @RequestParam("password") String password){

        //Check if username or password is too short
        if (username.length() < 3 || password.length() < 3){
            return new ResponseStatus(1,"Could not create user: Username and password must be at least 3 characters long.");
        }

        //Check if username already exists
        if (userRepository.findByUsername(username) != null){
            return new ResponseStatus(1,"Could not create user: Username already exists!");
        }

        // Try to save the user to the database
        try {
            userDetailsService.saveNewUser(new User(username, password)); // userDetailsService will hash password and save user

            return new ResponseStatus(0, "Created user.");
        } catch (Exception e){
            return new ResponseStatus(1, "Could not create user: "+e.getMessage());
        }
    }

    @DeleteMapping("/api/user/{username}")
    public ResponseStatus deleteUser(@PathVariable("userId") Integer userId){
        // You can only delete your own account
        User userToDelete = userRepository.findByUserId(userId);

        if (userToDelete == getActiveUser()){
            // We can delete ourselves. Do it!
            userRepository.delete(userToDelete);
            return new ResponseStatus(0,"Deleted user.");
        } else {
            return new ResponseStatus(1,"Could not delete account: A user cannot delete another user!");
        }
    }

    @GetMapping("/api/user/{userId}")
    public User getUser(@PathVariable("userId") Integer userId){
        return userRepository.findByUserId(userId);
    }

    @GetMapping("/api/user_active")
    public User getActiveUser(){
        return userDetailsService.getLoggedInUser();
    }

    @GetMapping("/api/user/{userId}/location")
    public LatitudeLongitudePair getUserLocation(@PathVariable("userId") Integer userId){
        User locUser = userRepository.findByUserId(userId);
        return new LatitudeLongitudePair(locUser.getLatitude(),locUser.getLongitude());
    }

    @PatchMapping("/api/user/{userId}/location")
    public ResponseStatus updateUserLocation(@PathVariable("userId") Integer userId,@RequestParam("latitude") Double latitude, @RequestParam("longitude") Double longitude){
        try {
            User locUser = userRepository.findByUserId(userId);
            locUser.setLatitude(latitude);
            locUser.setLongitude(longitude);
            userRepository.save(locUser);
            return new ResponseStatus(0,"Updated work location!");
        } catch (Exception e){
            return new ResponseStatus(1,"Could not update location: "+e.getMessage());
        }
    }


}
