package com.Ecommerce.E_com.Dto;

public record CartItemResponse(
        Long cartItemId,
        Long productId,
        String productName,
        int productPrice,
        int quantity,
        int subtotal
) {
}
