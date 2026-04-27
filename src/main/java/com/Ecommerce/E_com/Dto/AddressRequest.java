package com.Ecommerce.E_com.Dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class AddressRequest {

    private String fullName;
    private String phone;
    private String line1;
    private String line2;
    private String city;

    @JsonAlias("State")
    private String state;

    private String pincode;
    private String landmark;
    private boolean defaultAddress;
}
