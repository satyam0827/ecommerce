package com.Ecommerce.E_com.Dto;

public record PaymentStatusResponse(
        Long orderId,
        String orderStatus,
        String sessionStatus,
        String paymentStatus,
        int totalAmount,
        String currency
) {
}
