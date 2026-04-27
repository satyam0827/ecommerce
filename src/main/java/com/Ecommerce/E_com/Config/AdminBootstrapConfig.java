package com.Ecommerce.E_com.Config;

import com.Ecommerce.E_com.Entity.Role;
import com.Ecommerce.E_com.Entity.User;
import com.Ecommerce.E_com.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AdminBootstrapConfig implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final String adminEmail;
    private final String adminPassword;
    private final String adminName;

    public AdminBootstrapConfig(
            UserRepository userRepository,
            @Value("${app.admin.email:}") String adminEmail,
            @Value("${app.admin.password:}") String adminPassword,
            @Value("${app.admin.name:Admin}") String adminName
    ) {
        this.userRepository = userRepository;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminName = adminName;
    }

    @Override
    public void run(String... args) {
        userRepository.findAll().stream()
                .filter(user -> user.getRole() == null)
                .forEach(user -> {
                    user.setRole(Role.USER);
                    userRepository.save(user);
                });

        if (!StringUtils.hasText(adminEmail)) {
            return;
        }

        User adminUser = userRepository.findByEmail(adminEmail);

        if (adminUser == null) {
            if (!StringUtils.hasText(adminPassword)) {
                return;
            }

            adminUser = new User();
            adminUser.setName(adminName);
            adminUser.setEmail(adminEmail);
            adminUser.setPassword(passwordEncoder.encode(adminPassword));
            adminUser.setAuthProvider("LOCAL");
        }

        adminUser.setRole(Role.ADMIN);

        if (StringUtils.hasText(adminPassword)
                && (adminUser.getPassword() == null || "LOCAL".equalsIgnoreCase(adminUser.getAuthProvider()))) {
            adminUser.setPassword(passwordEncoder.encode(adminPassword));
            adminUser.setAuthProvider("LOCAL");
        }

        if (!StringUtils.hasText(adminUser.getName())) {
            adminUser.setName(adminName);
        }

        userRepository.save(adminUser);
    }
}
