package com.Ecommerce.E_com.Service;

import com.Ecommerce.E_com.Dto.CartItemResponse;
import com.Ecommerce.E_com.Entity.CartItem;
import com.Ecommerce.E_com.Entity.Product;
import com.Ecommerce.E_com.Entity.User;
import com.Ecommerce.E_com.Repository.CartItemRepository;
import com.Ecommerce.E_com.Repository.ProductRepository;
import com.Ecommerce.E_com.Repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public CartService(
            CartItemRepository cartItemRepository,
            UserRepository userRepository,
            ProductRepository productRepository
    ) {
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public List<CartItemResponse> getCartItems(String email) {
        User user = getUserByEmail(email);

        return cartItemRepository.findAllByUser_Id(user.getId())
                .stream()
                .map(this::toCartItemResponse)
                .toList();
    }

    public CartItemResponse addToCart(Long productId, String email) {
        User user = getUserByEmail(email);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found."));

        boolean alreadyExists = cartItemRepository.findByUserIdAndProductId(user.getId(), productId).isPresent();
        if (alreadyExists) {
            throw new RuntimeException("Product is already added to the cart. Update quantity from the cart page.");
        }

        CartItem cartItem = new CartItem();
        cartItem.setUser(user);
        cartItem.setProduct(product);
        cartItem.setQuantity(1);

        return toCartItemResponse(cartItemRepository.save(cartItem));
    }

    public CartItemResponse updateQuantity(Long cartItemId, String action, String email) {
        User user = getUserByEmail(email);
        CartItem cartItem = cartItemRepository.findByIdAndUser_Id(cartItemId, user.getId())
                .orElseThrow(() -> new RuntimeException("Cart item not found."));

        if ("increase".equalsIgnoreCase(action)) {
            cartItem.setQuantity(cartItem.getQuantity() + 1);
        } else if ("decrease".equalsIgnoreCase(action)) {
            if (cartItem.getQuantity() <= 1) {
                throw new RuntimeException("Quantity cannot be less than 1.");
            }

            cartItem.setQuantity(cartItem.getQuantity() - 1);
        } else {
            throw new RuntimeException("Invalid cart action.");
        }

        return toCartItemResponse(cartItemRepository.save(cartItem));
    }

    public void removeFromCart(Long cartItemId, String email) {
        User user = getUserByEmail(email);
        CartItem cartItem = cartItemRepository.findByIdAndUser_Id(cartItemId, user.getId())
                .orElseThrow(() -> new RuntimeException("Cart item not found."));

        cartItemRepository.delete(cartItem);
    }

    public int getCartCount(String email) {
        User user = getUserByEmail(email);

        return cartItemRepository.findAllByUser_Id(user.getId())
                .stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }

    private User getUserByEmail(String email) {
        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new RuntimeException("User not found.");
        }

        return user;
    }

    private CartItemResponse toCartItemResponse(CartItem cartItem) {
        Product product = cartItem.getProduct();
        int subtotal = product.getPPrice() * cartItem.getQuantity();

        return new CartItemResponse(
                cartItem.getId(),
                product.getPId(),
                product.getPName(),
                product.getPPrice(),
                cartItem.getQuantity(),
                subtotal
        );
    }
}
