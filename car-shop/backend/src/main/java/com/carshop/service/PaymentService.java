package com.carshop.service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Simulated card payment gateway. It validates the card the way a real gateway would
 * (Luhn checksum, expiry, CVV) and approves the charge without moving real money.
 * Swap {@link #charge} for a Stripe/Razorpay/PayPal call to take real payments.
 *
 * Test card 4000 0000 0000 0002 is always declined so the failure path can be tried.
 */
@Service
public class PaymentService {

    public static final String DECLINED_TEST_CARD = "4000000000000002";

    public record CardDetails(String number, String holderName, int expMonth, int expYear, String cvv) {
    }

    public record PaymentResult(String transactionId, String brand, String last4) {
    }

    public PaymentResult charge(CardDetails card, BigDecimal amount) {
        String number = card.number() == null ? "" : card.number().replaceAll("[\\s-]", "");
        if (!number.matches("\\d{13,19}") || !passesLuhn(number)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Card number is invalid.");
        }
        if (card.expMonth() < 1 || card.expMonth() > 12) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Expiry month is invalid.");
        }
        if (YearMonth.of(card.expYear(), card.expMonth()).isBefore(YearMonth.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Card has expired.");
        }
        if (card.cvv() == null || !card.cvv().matches("\\d{3,4}")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CVV is invalid.");
        }
        if (amount.signum() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Amount must be positive.");
        }
        if (DECLINED_TEST_CARD.equals(number)) {
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED, "Payment declined by the card issuer.");
        }
        String txn = "TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        return new PaymentResult(txn, detectBrand(number), number.substring(number.length() - 4));
    }

    static boolean passesLuhn(String number) {
        int sum = 0;
        boolean dbl = false;
        for (int i = number.length() - 1; i >= 0; i--) {
            int d = number.charAt(i) - '0';
            if (dbl) {
                d *= 2;
                if (d > 9) {
                    d -= 9;
                }
            }
            sum += d;
            dbl = !dbl;
        }
        return sum % 10 == 0;
    }

    static String detectBrand(String number) {
        if (number.startsWith("4")) {
            return "Visa";
        }
        if (number.matches("^(5[1-5]|2[2-7]).*")) {
            return "Mastercard";
        }
        if (number.matches("^3[47].*")) {
            return "American Express";
        }
        if (number.startsWith("6")) {
            return "Discover/RuPay";
        }
        return "Card";
    }
}
