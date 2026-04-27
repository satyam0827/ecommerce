package com.Ecommerce.E_com.Security;

import com.Ecommerce.E_com.Entity.Role;
import com.Ecommerce.E_com.Entity.User;
import com.Ecommerce.E_com.Repository.UserRepository;
import jakarta.servlet.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler implements org.springframework.security.web.authentication.AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public OAuth2SuccessHandler(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        // check if user exists
        User user = userRepository.findByEmail(email);

        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setPassword(null);
            user.setAuthProvider("GOOGLE");
            user.setRole(Role.USER);
            user.setProfileImageUrl(picture);
            userRepository.save(user);
        } else if ((user.getAuthProvider() == null || user.getAuthProvider().isBlank())
                && (user.getPassword() == null || "GOOGLE_USER".equals(user.getPassword()))) {
            user.setPassword(null);
            user.setAuthProvider("GOOGLE");
            if (user.getProfileImageUrl() == null || user.getProfileImageUrl().isBlank()) {
                user.setProfileImageUrl(picture);
            }
            userRepository.save(user);
        }

        if (user.getRole() == null) {
            user.setRole(Role.USER);
            userRepository.save(user);
        }

        // generate JWT
        String token = jwtUtil.generateToken(email, user.getRole());

        // redirect to frontend with token
        response.sendRedirect("http://localhost:5173/oauth-success?token=" + token);
    }
}
