package com.csc212.airpark.Controller.API.Entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LatitudeLongitudePair {
    private double latitude;
    private double longitude;
}
