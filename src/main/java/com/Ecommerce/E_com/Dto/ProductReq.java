package com.Ecommerce.E_com.Dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ProductReq {
    private String pName;
    private Integer pPrice;
    private MultipartFile image;

}
