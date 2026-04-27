package com.Ecommerce.E_com.Dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class UserProfileUpdateRequest {
    private String name;
    private MultipartFile profileImage;
}
