package com.Ecommerce.E_com.Dto;

import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String profileImageUrl;
}
