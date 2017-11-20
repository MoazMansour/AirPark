package com.csc212.airpark.JPA.Entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "Users")
@Data
@NoArgsConstructor
public class User implements Comparable<User>, Serializable, UserDetails {

    public User(String username, String password){
        this.username = username;
        this.password = password;
    }
    public User(String username, String password, boolean isHost){
        this.username = username;
        this.password = password;
        this.isHost = isHost;
    }

    @OneToMany(
            mappedBy = "ownerUserId",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnore
    private List<Spot> spots = new ArrayList<>();

    public void addSpot(Spot spot){
        spots.add(spot);
    }

    public void removeSpot(Spot spot){
        spots.remove(spot);
    }

    // User location latitude and longitude values
    @Column(name = "latitude")
    @NotNull
    private Double latitude = 43.12927153794366;

    @Column(name = "longitude")
    @NotNull
    private Double longitude = -77.62965202331543;

    @Id
    @GeneratedValue
    @Column(name = "userId", unique = true, updatable = false)
    private Integer userId = -1;

    @NotNull
    @Column(name = "username", unique = true, updatable = true)
    private String username;

    // Hashed password using bcrypt2
    @NotNull
    @Column(name = "password")
    @JsonIgnore
    private String password;

    // Whether the user has activated host mode or not
    @NotNull
    @Column(name = "isHost")
    private boolean isHost;

    @CreationTimestamp
    @Column(name = "created")
    private Timestamp dateCreated = Timestamp.from(Instant.now());

    @Override
    public int compareTo(User other){
        return Integer.compare(userId,other.userId);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<GrantedAuthority>();
        authorities.add(new SimpleGrantedAuthority("USER"));
        if (isHost){
            authorities.add(new SimpleGrantedAuthority("HOST"));
        }
        return authorities;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return true;
    }
}


