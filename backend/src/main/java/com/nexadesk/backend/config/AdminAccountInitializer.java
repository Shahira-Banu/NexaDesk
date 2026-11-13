
package com.nexadesk.backend.config;

import com.nexadesk.backend.entity.User;
import com.nexadesk.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.io.Console;
import java.util.Optional;

@Configuration
public class AdminAccountInitializer {

    @Bean
    CommandLineRunner createAdminAccount(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            String email = "banushahira747@gmail.com";

            Optional<User> existing = userRepository.findByEmail(email);

            if (existing.isPresent()) {
                System.out.println(
                    "NexaDesk admin account already exists. No changes made."
                );
                return;
            }

            Console console = System.console();

            if (console == null) {
                System.out.println(
                    "Admin account not created: run the application " +
                    "from a terminal that supports password input."
                );
                return;
            }

            char[] password = console.readPassword(
                "Create Banu Shahira's NexaDesk password (12-72 characters): "
            );

            try {
                if (password == null || password.length < 12
                        || password.length > 72) {
                    System.out.println(
                        "Admin account not created: password must be " +
                        "12-72 characters."
                    );
                    return;
                }

                String rawPassword = new String(password);

                User admin = new User(
                    "Banu Shahira",
                    email,
                    passwordEncoder.encode(rawPassword),
                    "ADMIN"
                );

                userRepository.saveAndFlush(admin);

                System.out.println(
                    "Admin account created successfully for " + email
                );
            } finally {
                java.util.Arrays.fill(password, '\0');
            }
        };
    }
}
