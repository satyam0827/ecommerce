package com.Ecommerce.E_com.Service;

import com.Ecommerce.E_com.Dto.AdminOrderItemResponse;
import com.Ecommerce.E_com.Dto.AdminOrderResponse;
import com.Ecommerce.E_com.Entity.Order;
import com.Ecommerce.E_com.Entity.OrderItem;
import com.Ecommerce.E_com.Repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public List<AdminOrderResponse> getAllOrdersForAdmin() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toAdminOrderResponse)
                .toList();
    }

    private AdminOrderResponse toAdminOrderResponse(Order order) {
        return new AdminOrderResponse(
                order.getId(),
                order.getFullName(),
                order.getUser().getEmail(),
                order.getStatus().name(),
                order.getStripeSessionStatus(),
                order.getStripePaymentStatus(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getPhone(),
                order.getLine1(),
                order.getLine2(),
                order.getLandmark(),
                order.getCity(),
                order.getState(),
                order.getPincode(),
                order.getStripeSessionId(),
                order.getStripePaymentIntentId(),
                order.getCreatedAt(),
                order.getPaidAt(),
                order.getItems().stream().map(this::toAdminOrderItemResponse).toList()
        );
    }

    private AdminOrderItemResponse toAdminOrderItemResponse(OrderItem item) {
        return new AdminOrderItemResponse(
                item.getProductId(),
                item.getProductName(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getSubtotal()
        );
    }
}
