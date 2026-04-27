package com.Ecommerce.E_com.Service;


import com.Ecommerce.E_com.Dto.UserRequest;
import com.Ecommerce.E_com.Dto.UserResponse;
import com.Ecommerce.E_com.Dto.UserProfileUpdateRequest;
import com.Ecommerce.E_com.Entity.Role;
import com.Ecommerce.E_com.Entity.User;
import com.Ecommerce.E_com.Exception.DuplicateEmailException;
import com.Ecommerce.E_com.Repository.UserRepository;
import com.Ecommerce.E_com.Security.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserService {
    private final UserRepository userRepository;
    private  final JwtUtil jwtUtil;
    private final UserProfileImageStorageService userProfileImageStorageService;

    public  UserService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            UserProfileImageStorageService userProfileImageStorageService
    ){
        this.userRepository = userRepository;
        this.jwtUtil  = jwtUtil;
        this.userProfileImageStorageService = userProfileImageStorageService;
    }

    public String login(String email, String password) {
        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new RuntimeException("User not found");
        }

        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider())) {
            throw new RuntimeException("Use Continue with Google to sign in to this account");
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        if (!encoder.matches(password,user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (user.getRole() == null) {
            user.setRole(Role.USER);
            userRepository.save(user);
        }

        return jwtUtil.generateToken(email, user.getRole());
    }


    public UserResponse registerUser(UserRequest request){

        if(userRepository.existsByEmail(request.getEmail())){
            throw new DuplicateEmailException("Email already registered!");
        }
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(encoder.encode(request.getPassword()));
        user.setAuthProvider("LOCAL");
        user.setRole(Role.USER);

        User savedUser = userRepository.save(user);
        return toUserResponse(savedUser);
    }

    public UserResponse getUserById(Long id){
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("user not found!"));
        return toUserResponse(user);
    }

    public UserResponse getCurrentUser(String email){
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return toUserResponse(user);
    }

    public UserResponse updateCurrentUser(String email, UserProfileUpdateRequest request) {
        User user = resolveUserByEmail(email);

        String name = request.getName();
        if (name == null || name.isBlank()) {
            throw new RuntimeException("Name is required.");
        }

        user.setName(name.trim());
        MultipartFile profileImage = request.getProfileImage();
        if (profileImage != null && !profileImage.isEmpty()) {
            String previousImageUrl = user.getProfileImageUrl();
            String newImageUrl = userProfileImageStorageService.store(profileImage);
            user.setProfileImageUrl(newImageUrl);
            User savedUser = userRepository.save(user);
            userProfileImageStorageService.deleteByUrl(previousImageUrl);
            return toUserResponse(savedUser);
        }

        User savedUser = userRepository.save(user);
        return toUserResponse(savedUser);
    }

    private UserResponse toUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setProfileImageUrl(user.getProfileImageUrl());
        return response;
    }

    private User resolveUserByEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return user;
    }
}
