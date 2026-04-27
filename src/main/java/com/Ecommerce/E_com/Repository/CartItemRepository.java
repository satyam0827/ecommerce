package com.Ecommerce.E_com.Repository;

import com.Ecommerce.E_com.Entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findAllByUser_Id(Long userId);
    void deleteAllByUser_Id(Long userId);

    @Query("""
            SELECT c
            FROM CartItem c
            WHERE c.user.id = :userId AND c.product.pId = :productId
            """)
    Optional<CartItem> findByUserIdAndProductId(
            @Param("userId") Long userId,
            @Param("productId") Long productId
    );

    Optional<CartItem> findByIdAndUser_Id(Long cartItemId, Long userId);
}
