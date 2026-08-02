package com.datapeice.slbackend;

import org.junit.jupiter.api.Test;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;

class SlbackendApplicationTests {

    @Test
    void testStripeValidation() {
        try {
            Stripe.apiKey = "sk_test_dummy";
            // Retrieve session with 67 characters
            Session.retrieve("cs_test_a1awmkikEQjAiVBAmMP3CDlh8WwTKRQSyypg3SjARdei3VuuYrCgl0wuJk3");
        } catch (Exception e) {
            System.out.println("STRIPE_VAL_ERR: " + e.getMessage());
            e.printStackTrace();
        }
    }

}
