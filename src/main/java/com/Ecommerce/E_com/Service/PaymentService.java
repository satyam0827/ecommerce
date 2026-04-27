package com.Ecommerce.E_com.Service;

import com.Ecommerce.E_com.Dto.PaymentCheckoutResponse;
import com.Ecommerce.E_com.Dto.PaymentStatusResponse;
import com.Ecommerce.E_com.Entity.Address;
import com.Ecommerce.E_com.Entity.CartItem;
import com.Ecommerce.E_com.Entity.Order;
import com.Ecommerce.E_com.Entity.OrderItem;
import com.Ecommerce.E_com.Entity.OrderStatus;
import com.Ecommerce.E_com.Entity.Product;
import com.Ecommerce.E_com.Entity.User;
import com.Ecommerce.E_com.Repository.AddressRepository;
import com.Ecommerce.E_com.Repository.CartItemRepository;
import com.Ecommerce.E_com.Repository.OrderRepository;
import com.Ecommerce.E_com.Repository.UserRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    private static final String CURRENCY = "inr";

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final String stripeSecretKey;
    private final String stripeWebhookSecret;
    private final String frontendUrl;

    public PaymentService(
            UserRepository userRepository,
            AddressRepository addressRepository,
            CartItemRepository cartItemRepository,
            OrderRepository orderRepository,
            @Value("${stripe.secret-key:}") String stripeSecretKey,
            @Value("${stripe.webhook-secret:}") String stripeWebhookSecret,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl
    ) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.stripeSecretKey = stripeSecretKey;
        this.stripeWebhookSecret = stripeWebhookSecret;
        this.frontendUrl = frontendUrl;
    }

    @PostConstruct
    public void initializeStripe() {
        if (StringUtils.hasText(stripeSecretKey)) {
            Stripe.apiKey = stripeSecretKey;
        }
    }

    @Transactional
    public PaymentCheckoutResponse createCheckoutSession(Long addressId, String email) {
        requireStripeSecretKey();

        User user = getUserByEmail(email);
        Address address = addressRepository.findByIdAndUser_Id(addressId, user.getId())
                .orElseThrow(() -> new RuntimeException("Delivery address not found."));
        List<CartItem> cartItems = cartItemRepository.findAllByUser_Id(user.getId());

        if (cartItems.isEmpty()) {
            throw new RuntimeException("Your cart is empty.");
        }

        Order order = buildPendingOrder(user, address, cartItems);
        orderRepository.save(order);

        try {
            Session session = Session.create(buildSessionParams(order, user));
            order.setStripeSessionId(session.getId());
            syncOrderWithSession(order, session);

            return new PaymentCheckoutResponse(order.getId(), session.getId(), session.getUrl());
        } catch (StripeException exception) {
            throw new RuntimeException("Unable to create Stripe checkout session.", exception);
        }
    }

    @Transactional
    public PaymentStatusResponse getCheckoutStatus(String sessionId, String email) {
        requireStripeSecretKey();

        User user = getUserByEmail(email);
        Order order = orderRepository.findByStripeSessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Payment session not found."));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not allowed to view this payment.");
        }

        try {
            Session session = Session.retrieve(sessionId);
            syncOrderWithSession(order, session);
            return toStatusResponse(order, session);
        } catch (StripeException exception) {
            throw new RuntimeException("Unable to verify payment status.", exception);
        }
    }

    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        requireStripeSecretKey();

        if (!StringUtils.hasText(stripeWebhookSecret)) {
            throw new RuntimeException("Stripe webhook secret is not configured.");
        }

        try {
            Event event = Webhook.constructEvent(payload, signatureHeader, stripeWebhookSecret);
            if (!isCheckoutEvent(event.getType())) {
                return;
            }

            EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
            StripeObject stripeObject = deserializer.getObject()
                    .orElseThrow(() -> new RuntimeException("Unable to parse Stripe event payload."));

            if (!(stripeObject instanceof Session session)) {
                throw new RuntimeException("Unexpected Stripe event payload.");
            }

            Order order = orderRepository.findByStripeSessionId(session.getId())
                    .orElseThrow(() -> new RuntimeException("Order not found for payment session."));

            syncOrderWithSession(order, session);
        } catch (SignatureVerificationException exception) {
            throw new RuntimeException("Stripe signature verification failed.", exception);
        }
    }

    private boolean isCheckoutEvent(String eventType) {
        return "checkout.session.completed".equals(eventType)
                || "checkout.session.async_payment_succeeded".equals(eventType)
                || "checkout.session.async_payment_failed".equals(eventType)
                || "checkout.session.expired".equals(eventType);
    }

    private SessionCreateParams buildSessionParams(Order order, User user) {
        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/payment?cancelled=true")
                .setCustomerEmail(user.getEmail())
                .putMetadata("orderId", order.getId().toString())
                .putMetadata("userId", user.getId().toString());

        for (OrderItem item : order.getItems()) {
            builder.addLineItem(
                    SessionCreateParams.LineItem.builder()
                            .setQuantity((long) item.getQuantity())
                            .setPriceData(
                                    SessionCreateParams.LineItem.PriceData.builder()
                                            .setCurrency(CURRENCY)
                                            .setUnitAmount((long) item.getUnitPrice() * 100)
                                            .setProductData(
                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                            .setName(item.getProductName())
                                                            .build()
                                            )
                                            .build()
                            )
                            .build()
            );
        }

        return builder.build();
    }

    private Order buildPendingOrder(User user, Address address, List<CartItem> cartItems) {
        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setCurrency(CURRENCY);
        order.setCreatedAt(LocalDateTime.now());
        order.setFullName(address.getFullName());
        order.setPhone(address.getPhone());
        order.setLine1(address.getLine1());
        order.setLine2(address.getLine2());
        order.setLandmark(address.getLandmark());
        order.setCity(address.getCity());
        order.setState(address.getState());
        order.setPincode(address.getPincode());

        int totalAmount = 0;
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            int subtotal = product.getPPrice() * cartItem.getQuantity();

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(product.getPId());
            orderItem.setProductName(product.getPName());
            orderItem.setUnitPrice(product.getPPrice());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setSubtotal(subtotal);
            order.addItem(orderItem);

            totalAmount += subtotal;
        }

        order.setTotalAmount(totalAmount);
        return order;
    }

    private void syncOrderWithSession(Order order, Session session) {
        String paymentStatus = session.getPaymentStatus();
        String sessionStatus = session.getStatus();

        order.setStripeSessionStatus(sessionStatus);
        order.setStripePaymentStatus(paymentStatus);

        if ("paid".equalsIgnoreCase(paymentStatus)) {
            boolean shouldClearCart = order.getStatus() != OrderStatus.PAID;
            order.setStatus(OrderStatus.PAID);
            order.setPaidAt(order.getPaidAt() == null ? LocalDateTime.now() : order.getPaidAt());
            order.setStripePaymentIntentId(session.getPaymentIntent());

            if (shouldClearCart) {
                cartItemRepository.deleteAllByUser_Id(order.getUser().getId());
            }
        } else if ("expired".equalsIgnoreCase(sessionStatus)) {
            order.setStatus(OrderStatus.EXPIRED);
        } else if ("complete".equalsIgnoreCase(sessionStatus) || "no_payment_required".equalsIgnoreCase(paymentStatus)) {
            order.setStatus(OrderStatus.FAILED);
        } else if (order.getStatus() != OrderStatus.PAID) {
            order.setStatus(OrderStatus.PENDING);
        }

        orderRepository.save(order);
    }

    private PaymentStatusResponse toStatusResponse(Order order, Session session) {
        return new PaymentStatusResponse(
                order.getId(),
                order.getStatus().name(),
                session.getStatus(),
                session.getPaymentStatus(),
                order.getTotalAmount(),
                order.getCurrency()
        );
    }

    private User getUserByEmail(String email) {
        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new RuntimeException("User not found.");
        }

        return user;
    }

    private void requireStripeSecretKey() {
        if (!StringUtils.hasText(stripeSecretKey)) {
            throw new RuntimeException("Stripe secret key is not configured.");
        }
    }
}
