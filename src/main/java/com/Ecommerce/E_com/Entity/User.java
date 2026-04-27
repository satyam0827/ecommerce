package com.Ecommerce.E_com.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy =  GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    private String password;
    private String authProvider;
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Role role = Role.USER;
}
