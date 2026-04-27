package com.Ecommerce.E_com.Dto;

public record AdminOrderItemResponse(
        Long productId,
        String productName,
        int unitPrice,
        int quantity,
        int subtotal
) {
}
