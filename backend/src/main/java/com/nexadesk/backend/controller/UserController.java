
package com.nexadesk.backend.controller;

import com.nexadesk.backend.dto.EmployeePasswordResetRequest;
import com.nexadesk.backend.entity.User;
import com.nexadesk.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    public String resetEmployeePassword(
        @PathVariable Integer id,
        @Valid @RequestBody EmployeePasswordResetRequest request
    ) {
        User employee = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Employee account not found"
            ));

        if (!"EMPLOYEE".equalsIgnoreCase(employee.getRole())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Passwords can only be reset for employee accounts"
            );
        }

        String encodedPassword = passwordEncoder.encode(request.getNewPassword());

        userRepository.updatePasswordHash(id, encodedPassword);

        return "Employee password reset successfully";
    }
}
