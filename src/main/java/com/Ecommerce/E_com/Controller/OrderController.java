package com.Ecommerce.E_com.Controller;

import com.Ecommerce.E_com.Dto.AdminOrderResponse;
import com.Ecommerce.E_com.Service.OrderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<AdminOrderResponse> getAllOrders() {
        return orderService.getAllOrdersForAdmin();
    }
}
