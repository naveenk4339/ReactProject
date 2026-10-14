package com.carshop.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CheckoutRequest(
        @NotEmpty(message = "Cart is empty.") List<@Valid Item> items,
        @NotNull @Valid Customer customer,
        @NotNull @Valid Card card) {

    public record Item(@NotNull Long carId, @Min(1) @Max(5) int quantity) {
    }

    public record Customer(
            @NotBlank(message = "Name is required.") String name,
            @NotBlank @Email(message = "Email is invalid.") String email,
            @NotBlank(message = "Phone is required.") String phone,
            @NotBlank(message = "Address is required.") String address) {
    }

    public record Card(
            @NotBlank String number,
            @NotBlank(message = "Cardholder name is required.") String holderName,
            int expMonth,
            int expYear,
            @NotBlank String cvv) {
    }
}
