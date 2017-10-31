package com.csc212.airpark;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@EnableOAuth2Client
@EnableAuthorizationServer
public class AirparkApplication {

	public static void main(String[] args) {
		SpringApplication.run(AirparkApplication.class, args);
	}
}
