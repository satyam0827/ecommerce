package com.Ecommerce.E_com.Dto;

public record PaymentCheckoutResponse(
        Long orderId,
        String sessionId,
        String checkoutUrl
) {
}
