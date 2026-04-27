package com.Ecommerce.E_com.Repository;

import com.Ecommerce.E_com.Entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @EntityGraph(attributePaths = {"user", "items"})
    List<Order> findAllByOrderByCreatedAtDesc();

    Optional<Order> findByStripeSessionId(String stripeSessionId);
    Optional<Order> findByIdAndUser_Id(Long orderId, Long userId);
}
