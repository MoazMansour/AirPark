package com.csc212.airpark.Controller.OpenAuth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
public class UserDetailController {

    private Logger log = LoggerFactory.getLogger( UserDetailController.class );

    @RequestMapping("/user")
    public Principal user(Principal p ) throws UsernameNotFoundException {
        log.trace( "Request for Principal: {}", p );
        return p;
    }
}
