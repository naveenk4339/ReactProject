package com.carshop;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.carshop.service.ApiException;
import com.carshop.service.PaymentService;
import com.carshop.service.PaymentService.CardDetails;
import java.math.BigDecimal;
import java.time.Year;
import org.junit.jupiter.api.Test;

class PaymentServiceTest {

    private final PaymentService payments = new PaymentService();
    private final int nextYear = Year.now().getValue() + 1;

    @Test
    void approvesValidCard() {
        var result = payments.charge(new CardDetails("4242 4242 4242 4242", "Jo", 12, nextYear, "123"), BigDecimal.TEN);
        assertThat(result.brand()).isEqualTo("Visa");
        assertThat(result.last4()).isEqualTo("4242");
        assertThat(result.transactionId()).startsWith("TXN-");
    }

    @Test
    void rejectsBadLuhn() {
        assertThatThrownBy(() -> payments.charge(new CardDetails("4242424242424241", "Jo", 12, nextYear, "123"), BigDecimal.TEN))
                .isInstanceOf(ApiException.class).hasMessageContaining("invalid");
    }

    @Test
    void rejectsExpiredCard() {
        assertThatThrownBy(() -> payments.charge(new CardDetails("4242424242424242", "Jo", 1, 2020, "123"), BigDecimal.TEN))
                .hasMessageContaining("expired");
    }

    @Test
    void declinesTestCard() {
        assertThatThrownBy(() -> payments.charge(new CardDetails("4000000000000002", "Jo", 12, nextYear, "123"), BigDecimal.TEN))
                .hasMessageContaining("declined");
    }
}
