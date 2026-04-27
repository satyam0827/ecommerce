package com.Ecommerce.E_com.Dto;

import java.time.LocalDateTime;
import java.util.List;

public record AdminOrderResponse(
        Long orderId,
        String customerName,
        String customerEmail,
        String orderStatus,
        String sessionStatus,
        String paymentStatus,
        int totalAmount,
        String currency,
        String phone,
        String line1,
        String line2,
        String landmark,
        String city,
        String state,
        String pincode,
        String stripeSessionId,
        String stripePaymentIntentId,
        LocalDateTime createdAt,
        LocalDateTime paidAt,
        List<AdminOrderItemResponse> items
) {
}
