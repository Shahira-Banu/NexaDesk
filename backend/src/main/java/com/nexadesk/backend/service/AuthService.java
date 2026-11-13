package com.nexadesk.backend.service;

import com.nexadesk.backend.dto.LoginRequest;
import com.nexadesk.backend.dto.LoginResponse;
import com.nexadesk.backend.entity.User;
import com.nexadesk.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(
                request.getEmail().trim().toLowerCase()
        ).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password"
        ));

        String storedPassword = user.getPasswordHash();

        if (storedPassword == null ||
                !storedPassword.matches("^\\$2[aby]\\$\\d{2}\\$.{53}$")) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Password recovery is required for this account"
            );
        }

        if (!passwordEncoder.matches(
                request.getPassword(), storedPassword)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        return new LoginResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }
}