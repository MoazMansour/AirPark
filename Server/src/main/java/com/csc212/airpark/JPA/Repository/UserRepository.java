package com.csc212.airpark.JPA.Repository;

import com.csc212.airpark.JPA.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    User findByUsername(String username);
    User findByUserId(int userId);
}
