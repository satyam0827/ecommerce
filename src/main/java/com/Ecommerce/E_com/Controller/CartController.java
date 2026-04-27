package com.Ecommerce.E_com.Controller;

import com.Ecommerce.E_com.Dto.CartCountResponse;
import com.Ecommerce.E_com.Dto.CartItemResponse;
import com.Ecommerce.E_com.Dto.CartQuantityUpdateRequest;
import com.Ecommerce.E_com.Service.CartService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public List<CartItemResponse> getCartItems(Principal principal) {
        return cartService.getCartItems(principal.getName());
    }

    @GetMapping("/count")
    public CartCountResponse getCartCount(Principal principal) {
        return new CartCountResponse(cartService.getCartCount(principal.getName()));
    }

    @PostMapping("/{productId}")
    public CartItemResponse addToCart(@PathVariable Long productId, Principal principal) {
        return cartService.addToCart(productId, principal.getName());
    }

    @PatchMapping("/{cartItemId}/quantity")
    public CartItemResponse updateQuantity(
            @PathVariable Long cartItemId,
            @RequestBody CartQuantityUpdateRequest request,
            Principal principal
    ) {
        return cartService.updateQuantity(cartItemId, request.action(), principal.getName());
    }

    @DeleteMapping("/{cartItemId}")
    public CartCountResponse removeFromCart(@PathVariable Long cartItemId, Principal principal) {
        cartService.removeFromCart(cartItemId, principal.getName());
        return new CartCountResponse(cartService.getCartCount(principal.getName()));
    }
}
