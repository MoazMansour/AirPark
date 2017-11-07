package com.csc212.airpark.Controller.API.Entity;

import com.csc212.airpark.JPA.Entity.Spot;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpotWithDuration {
    private Spot spot;
    private double duration;
}
