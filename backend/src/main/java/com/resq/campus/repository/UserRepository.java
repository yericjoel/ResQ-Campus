package com.resq.campus.repository;

import com.resq.campus.model.Enums.Role;
import com.resq.campus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRoleInAndActiveTrue(Collection<Role> roles);

    List<User> findByActiveTrue();

    List<User> findAllByOrderByCreatedAtDesc();
}
