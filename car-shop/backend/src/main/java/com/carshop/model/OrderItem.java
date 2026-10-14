package com.carshop.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;

/** Snapshot of a car at the time it was bought, so later price changes don't alter old bills. */
@Embeddable
public class OrderItem {

    private Long carId;
    private String carName;

    @Column(precision = 12, scale = 2)
    private BigDecimal unitPrice;

    private int quantity;

    @Column(precision = 12, scale = 2)
    private BigDecimal lineTotal;

    protected OrderItem() {
    }

    public OrderItem(Long carId, String carName, BigDecimal unitPrice, int quantity) {
        this.carId = carId;
        this.carName = carName;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public Long getCarId() { return carId; }
    public String getCarName() { return carName; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public int getQuantity() { return quantity; }
    public BigDecimal getLineTotal() { return lineTotal; }
}
