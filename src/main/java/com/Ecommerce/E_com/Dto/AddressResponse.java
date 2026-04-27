package com.Ecommerce.E_com.Dto;

import lombok.Data;

@Data
public class AddressResponse {

    private Long id;
    private Long userId;
    private String fullName;
    private String phone;
    private String line1;
    private String line2;
    private String city;
    private String state;
    private String pincode;
    private String landmark;
    private boolean defaultAddress;

    public String getFullAddress(){
        return phone + ", " + line1 + line2 + city + state;
    }
}
