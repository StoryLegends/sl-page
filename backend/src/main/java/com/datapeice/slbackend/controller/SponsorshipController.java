package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.entity.SponsorshipPlan;
import com.datapeice.slbackend.repository.UserRepository;
import com.datapeice.slbackend.repository.AuditLogRepository;
import com.datapeice.slbackend.service.AuditLogService;
import com.datapeice.slbackend.service.SponsorshipPlanService;
import com.stripe.Stripe;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.model.Subscription;
import com.stripe.model.Invoice;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.param.SubscriptionUpdateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sponsorship")
public class SponsorshipController {

    private static final Logger log = LoggerFactory.getLogger(SponsorshipController.class);

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;
    private final SponsorshipPlanService sponsorshipPlanService;
    private final com.datapeice.slbackend.service.SiteSettingsService siteSettingsService;

    @Value("${stripe.secret-key:sk_test_dummy}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret:whsec_dummy}")
    private String webhookSecret;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public SponsorshipController(UserRepository userRepository, AuditLogRepository auditLogRepository,
                                 AuditLogService auditLogService, SponsorshipPlanService sponsorshipPlanService,
                                 com.datapeice.slbackend.service.SiteSettingsService siteSettingsService) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditLogService = auditLogService;
        this.sponsorshipPlanService = sponsorshipPlanService;
        this.siteSettingsService = siteSettingsService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> createCheckoutSession(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "UNAUTHORIZED"));
        }

        try {
            Stripe.apiKey = stripeSecretKey;

            int level = ((Number) request.get("level")).intValue();
            int days = ((Number) request.get("days")).intValue();
            boolean isRecurring = Boolean.TRUE.equals(request.get("isRecurring"));
            long priceInRubCents;
            try {
                priceInRubCents = sponsorshipPlanService.getVerifiedPriceInCents(level, days, isRecurring);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
            }

            double rubToEurRate = getRubToEurRate();
            long priceInEurCents = Math.round((priceInRubCents / 100.0) * rubToEurRate * 100.0);
            if (priceInEurCents < 50) {
                priceInEurCents = 100; // Minimum 1 EUR to satisfy Stripe minimum charge limits
            }

            log.info("Converting sponsorship plan price: {} RUB -> {} EUR (rate: {})", priceInRubCents / 100.0, priceInEurCents / 100.0, rubToEurRate);

            String returnUrl = frontendUrl + "/sponsorship/status?session_id={CHECKOUT_SESSION_ID}";

            SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                    .setUiMode(SessionCreateParams.UiMode.EMBEDDED_PAGE)
                    .setReturnUrl(returnUrl);

            SessionCreateParams.LineItem.PriceData.Builder priceDataBuilder = SessionCreateParams.LineItem.PriceData.builder()
                    .setCurrency("eur")
                    .setUnitAmount(priceInEurCents)
                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                            .setName("Спонсорство StoryLegends — Уровень " + level)
                            .setDescription(String.format("Спонсорская подписка на сервер на %d дней", days))
                            .build());

            if (isRecurring) {
                paramsBuilder.setMode(SessionCreateParams.Mode.SUBSCRIPTION);
                long intervalCount = Math.max(1, days / 30);
                priceDataBuilder.setRecurring(SessionCreateParams.LineItem.PriceData.Recurring.builder()
                        .setInterval(SessionCreateParams.LineItem.PriceData.Recurring.Interval.MONTH)
                        .setIntervalCount(intervalCount)
                        .build());
                
                paramsBuilder.setSubscriptionData(SessionCreateParams.SubscriptionData.builder()
                        .putMetadata("userId", String.valueOf(user.getId()))
                        .putMetadata("level", String.valueOf(level))
                        .putMetadata("days", String.valueOf(days))
                        .build());
            } else {
                paramsBuilder.setMode(SessionCreateParams.Mode.PAYMENT);
                paramsBuilder.putMetadata("userId", String.valueOf(user.getId()))
                        .putMetadata("level", String.valueOf(level))
                        .putMetadata("days", String.valueOf(days));
            }

            paramsBuilder.addLineItem(SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(priceDataBuilder.build())
                    .build());

            Session session = Session.create(paramsBuilder.build());

            return ResponseEntity.ok(Map.of(
                    "clientSecret", session.getClientSecret(),
                    "sessionId", session.getId()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/plans")
    public ResponseEntity<List<SponsorshipPlan>> getActivePlans() {
        return ResponseEntity.ok(sponsorshipPlanService.getActivePlans());
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelSubscription(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "UNAUTHORIZED"));
        }

        User freshUser = userRepository.findById(user.getId()).orElse(null);
        if (freshUser == null || freshUser.getStripeSubscriptionId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No active subscription found"));
        }

        try {
            Stripe.apiKey = stripeSecretKey;
            Subscription subscription = Subscription.retrieve(freshUser.getStripeSubscriptionId());
            
            SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                    .setCancelAtPeriodEnd(true)
                    .build();
            
            subscription.update(params);

            freshUser.setSubscriptionRecurring(false);
            userRepository.save(freshUser);

            auditLogService.logAction(freshUser.getId(), freshUser.getUsername(), "USER_SPONSORSHIP_SUBSCRIPTION_CANCEL",
                    "Пользователь отменил автопродление спонсорской подписки (Stripe ID: " + freshUser.getStripeSubscriptionId() + ")",
                    freshUser.getId(), freshUser.getUsername());

            return ResponseEntity.ok(Map.of("success", true, "message", "Subscription auto-renewal canceled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/resume")
    public ResponseEntity<?> resumeSubscription(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "UNAUTHORIZED"));
        }

        User freshUser = userRepository.findById(user.getId()).orElse(null);
        if (freshUser == null || freshUser.getStripeSubscriptionId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No active subscription found"));
        }

        try {
            Stripe.apiKey = stripeSecretKey;
            Subscription subscription = Subscription.retrieve(freshUser.getStripeSubscriptionId());
            
            SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                    .setCancelAtPeriodEnd(false)
                    .build();
            
            subscription.update(params);

            freshUser.setSubscriptionRecurring(true);
            userRepository.save(freshUser);

            auditLogService.logAction(freshUser.getId(), freshUser.getUsername(), "USER_SPONSORSHIP_SUBSCRIPTION_RESUME",
                    "Пользователь включил обратно автопродление спонсорской подписки (Stripe ID: " + freshUser.getStripeSubscriptionId() + ")",
                    freshUser.getId(), freshUser.getUsername());

            return ResponseEntity.ok(Map.of("success", true, "message", "Subscription auto-renewal re-enabled successfully"));
        } catch (Exception e) {
            log.error("Failed to resume subscription for user: {}", freshUser.getId(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<?> getSessionStatus(@PathVariable String sessionId) {
        try {
            Stripe.apiKey = stripeSecretKey;
            Session session = Session.retrieve(sessionId);
            
            return ResponseEntity.ok(Map.of(
                    "status", session.getStatus(),
                    "paymentStatus", session.getPaymentStatus(),
                    "customerEmail", session.getCustomerDetails() != null ? session.getCustomerDetails().getEmail() : ""
            ));
        } catch (Exception e) {
            log.error("Failed to retrieve session status for sessionId: {}", sessionId, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Webhook Error: " + e.getMessage());
        }

        if ("checkout.session.completed".equals(event.getType())) {
            Optional<Session> sessionOpt = event.getDataObjectDeserializer().getObject().map(o -> (Session) o);
            if (sessionOpt.isPresent()) {
                Session session = sessionOpt.get();
                handleCheckoutSessionCompleted(session);
            }
        } else if ("invoice.payment_succeeded".equals(event.getType())) {
            Optional<Invoice> invoiceOpt = event.getDataObjectDeserializer().getObject().map(o -> (Invoice) o);
            if (invoiceOpt.isPresent()) {
                Invoice invoice = invoiceOpt.get();
                handleInvoicePaymentSucceeded(invoice);
            }
        }

        return ResponseEntity.ok("Success");
    }

    private void handleCheckoutSessionCompleted(Session session) {
        String mode = session.getMode();
        Map<String, String> metadata = session.getMetadata();
        
        if ("subscription".equals(mode)) {
            String subscriptionId = session.getSubscription();
            if (subscriptionId == null) return;
            
            String userIdStr = metadata != null ? metadata.get("userId") : null;
            if (userIdStr == null) {
                try {
                    Stripe.apiKey = stripeSecretKey;
                    Subscription sub = Subscription.retrieve(subscriptionId);
                    userIdStr = sub.getMetadata() != null ? sub.getMetadata().get("userId") : null;
                } catch (Exception e) {
                    log.error("Failed to retrieve subscription for subscriptionId: {}", subscriptionId, e);
                }
            }
            
            if (userIdStr != null) {
                Long userId = Long.valueOf(userIdStr);
                try {
                    Stripe.apiKey = stripeSecretKey;
                    Subscription sub = Subscription.retrieve(subscriptionId);
                    Map<String, String> subMetadata = sub.getMetadata();
                    if (subMetadata != null && subMetadata.containsKey("level")) {
                        int level = Integer.parseInt(subMetadata.get("level"));
                        int days = Integer.parseInt(subMetadata.get("days"));
                        
                        String sessionId = session.getId();
                        boolean alreadyProcessed = auditLogRepository.existsByDetailsContaining(sessionId);
                        if (!alreadyProcessed) {
                            userRepository.findById(userId).ifPresent(user -> {
                                user.setStripeSubscriptionId(subscriptionId);
                                user.setSubscriptionRecurring(true);
                                userRepository.save(user);
                                
                                extendUserSponsorship(userId, level, days, "USER_SPONSORSHIP_SUBSCRIPTION_CREATED",
                                        "Создана автопродлеваемая подписка Stripe Уровень %d на %d дней (ID сессии: " + sessionId + ", ID подписки: " + subscriptionId + ").");
                            });
                        }
                    }
                } catch (Exception e) {
                    log.error("Error processing subscription completed event for subscriptionId: {}", subscriptionId, e);
                }
            }
        } else if ("payment".equals(mode)) {
            if (metadata == null || !metadata.containsKey("userId")) {
                return;
            }
            
            try {
                Long userId = Long.valueOf(metadata.get("userId"));
                int level = Integer.parseInt(metadata.get("level"));
                int days = Integer.parseInt(metadata.get("days"));
                
                extendUserSponsorship(userId, level, days, "USER_SPONSORSHIP_PAYMENT_SUCCESS", 
                        "Успешная оплата спонсорства Уровень %d на %d дней (разовый платёж через Stripe).");
            } catch (Exception e) {
                log.error("Error processing payment completed event for session: {}", session.getId(), e);
            }
        }
    }

    private void handleInvoicePaymentSucceeded(Invoice invoice) {
        String subscriptionId = null;
        if (invoice.getRawJsonObject() != null && invoice.getRawJsonObject().has("subscription") && !invoice.getRawJsonObject().get("subscription").isJsonNull()) {
            subscriptionId = invoice.getRawJsonObject().get("subscription").getAsString();
        }
        if (subscriptionId == null) {
            return;
        }
        
        try {
            Stripe.apiKey = stripeSecretKey;
            Subscription subscription = Subscription.retrieve(subscriptionId);
            Map<String, String> subMetadata = subscription.getMetadata();
            
            String userIdStr = subMetadata != null ? subMetadata.get("userId") : null;
            if (userIdStr != null) {
                Long userId = Long.valueOf(userIdStr);
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    
                    if (user.getStripeSubscriptionId() == null) {
                        user.setStripeSubscriptionId(subscriptionId);
                        user.setSubscriptionRecurring(true);
                        userRepository.save(user);
                    }
                    
                    // If it is the first invoice (subscription creation), it is already credited
                    // by handleCheckoutSessionCompleted or fallback. We do not double credit.
                    if ("subscription_create".equals(invoice.getBillingReason())) {
                        return;
                    }
                    
                    if (subMetadata != null && subMetadata.containsKey("level")) {
                        int level = Integer.parseInt(subMetadata.get("level"));
                        int days = Integer.parseInt(subMetadata.get("days"));
                        
                        String invoiceId = invoice.getId();
                        boolean alreadyProcessed = auditLogRepository.existsByDetailsContaining(invoiceId);
                        if (!alreadyProcessed) {
                            extendUserSponsorship(user.getId(), level, days, "USER_SPONSORSHIP_RECURRING_BILLING_SUCCESS",
                                    "Успешное автопродление спонсорства Уровень %d на %d дней (подписка Stripe ID: " + subscriptionId + ", инвойс ID: " + invoiceId + ").");
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error processing invoice payment succeeded event for invoice: {}", invoice.getId(), e);
        }
    }

    private void extendUserSponsorship(Long userId, int level, int days, String actionType, String logTemplate) {
        userRepository.findById(userId).ifPresent(user -> {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime newExpiry;
            int finalLevel = level;
            
            if (user.getSponsorshipLevel() != null && user.getSponsorshipLevel() > level && 
                    user.getSponsorshipExpiresAt() != null && user.getSponsorshipExpiresAt().isAfter(now)) {
                newExpiry = user.getSponsorshipExpiresAt().plusDays(days);
                finalLevel = user.getSponsorshipLevel(); // Keep the current higher level
            } else if (user.getSponsorshipLevel() != null && user.getSponsorshipLevel() == level && 
                    user.getSponsorshipExpiresAt() != null && user.getSponsorshipExpiresAt().isAfter(now)) {
                newExpiry = user.getSponsorshipExpiresAt().plusDays(days);
            } else {
                newExpiry = now.plusDays(days);
            }

            // Determine price paid
            int price = 0;
            try {
                price = (int) (sponsorshipPlanService.getVerifiedPriceInCents(level, days, true) / 100);
            } catch (Exception e1) {
                try {
                    price = (int) (sponsorshipPlanService.getVerifiedPriceInCents(level, days, false) / 100);
                } catch (Exception e2) {
                    if (level == 1) {
                        if (days == 60) price = 349;
                        else if (days == 90) price = 499;
                        else price = 199;
                    } else if (level == 2) {
                        if (days == 60) price = 629;
                        else if (days == 90) price = 899;
                        else price = 349;
                    } else if (level == 3) {
                        if (days == 60) price = 1049;
                        else if (days == 90) price = 1499;
                        else price = 599;
                    }
                }
            }

            // Increment user's total donation amount
            user.setTotalDonated((user.getTotalDonated() != null ? user.getTotalDonated() : 0) + price);
            
            user.setSponsorshipLevel(finalLevel);
            user.setSponsorshipExpiresAt(newExpiry);
            userRepository.save(user);

            // Increment public settings sponsorshipGoalCurrent automatically
            try {
                siteSettingsService.incrementSponsorshipGoal(price);
            } catch (Exception e) {
                log.error("Failed to automatically increment sponsorship goal by: " + price, e);
            }
            
            auditLogService.logAction(userId, user.getUsername(), actionType,
                    String.format(logTemplate, finalLevel, days) + " Действует до " + newExpiry.toString(),
                    userId, user.getUsername());
        });
    }

    private double getRubToEurRate() {
        try {
            Stripe.apiKey = stripeSecretKey;
            com.stripe.model.ExchangeRate rate = com.stripe.model.ExchangeRate.retrieve("rub");
            if (rate != null && rate.getRates() != null && rate.getRates().containsKey("eur")) {
                java.math.BigDecimal val = rate.getRates().get("eur");
                if (val != null) {
                    double doubleVal = val.doubleValue();
                    if (doubleVal > 0.001 && doubleVal < 0.1) {
                        return doubleVal;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch RUB to EUR exchange rate from Stripe, using fallback: {}", e.getMessage());
        }
        return 0.0102; // Fallback rate: ~98 RUB per 1 EUR
    }
}
