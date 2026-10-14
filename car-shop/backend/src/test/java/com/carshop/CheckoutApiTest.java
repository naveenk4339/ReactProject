package com.carshop;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.Year;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class CheckoutApiTest {

    @Autowired
    MockMvc mvc;

    private String body(String cardNumber, int quantity) {
        return """
                {"items":[{"carId":1,"quantity":%d}],
                 "customer":{"name":"Jo Buyer","email":"jo@example.com","phone":"+1 313 555 0100","address":"1 Main St"},
                 "card":{"number":"%s","holderName":"Jo Buyer","expMonth":12,"expYear":%d,"cvv":"123"}}
                """.formatted(quantity, cardNumber, Year.now().getValue() + 2);
    }

    @Test
    void listsSeededCars() throws Exception {
        mvc.perform(get("/api/cars")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(9)));
    }

    @Test
    void checkoutChargesCardComputesBillAndProducesPdf() throws Exception {
        // Car 1 is the Tesla Model 3 at $38,990: 38990 + 499 doc fee = 39489, tax 8% = 3159.12, total 42648.12
        String json = mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(body("4242424242424242", 1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.cardLast4").value("4242"))
                .andExpect(jsonPath("$.invoiceNumber").value(startsWith("INV-")))
                .andExpect(jsonPath("$.subtotal").value(38990.00))
                .andExpect(jsonPath("$.tax").value(3159.12))
                .andExpect(jsonPath("$.total").value(42648.12))
                .andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(json, "$.id");

        mvc.perform(get("/api/cars/1")).andExpect(jsonPath("$.stock").value(3));
        mvc.perform(get("/api/orders/" + id + "/invoice.pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));
    }

    @Test
    void declinedCardCreatesNoOrderAndKeepsStock() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(body("4000000000000002", 1)))
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.message").value("Payment declined by the card issuer."));
        mvc.perform(get("/api/cars/1")).andExpect(jsonPath("$.stock").value(4));
    }

    @Test
    void cannotBuyMoreThanInStock() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(body("4242424242424242", 5)))
                .andExpect(status().isConflict());
    }
}
