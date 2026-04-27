package com.Ecommerce.E_com.Dto;

public record ApiErrorResponse(
        String message,
        int status
) {
}
