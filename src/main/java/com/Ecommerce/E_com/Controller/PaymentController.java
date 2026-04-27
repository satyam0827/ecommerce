package com.Ecommerce.E_com.Controller;

import com.Ecommerce.E_com.Dto.PaymentCheckoutRequest;
import com.Ecommerce.E_com.Dto.PaymentCheckoutResponse;
import com.Ecommerce.E_com.Dto.PaymentStatusResponse;
import com.Ecommerce.E_com.Service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/checkout-session")
    public PaymentCheckoutResponse createCheckoutSession(
            @RequestBody PaymentCheckoutRequest request,
            Principal principal
    ) {
        if (request.addressId() == null) {
            throw new RuntimeException("Address is required for checkout.");
        }

        return paymentService.createCheckoutSession(request.addressId(), principal.getName());
    }

    @GetMapping("/checkout-session/{sessionId}")
    public PaymentStatusResponse getCheckoutStatus(@PathVariable String sessionId, Principal principal) {
        return paymentService.getCheckoutStatus(sessionId, principal.getName());
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(name = "Stripe-Signature", required = false) String signatureHeader
    ) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            throw new RuntimeException("Missing Stripe signature.");
        }

        paymentService.handleWebhook(payload, signatureHeader);
        return ResponseEntity.ok().build();
    }
}
