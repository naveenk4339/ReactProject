package com.carshop.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String invoiceNumber;
    private LocalDateTime createdAt;

    private String customerName;
    private String email;
    private String phone;
    private String address;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_item")
    private List<OrderItem> items = new ArrayList<>();

    @Column(precision = 12, scale = 2)
    private BigDecimal subtotal;
    @Column(precision = 12, scale = 2)
    private BigDecimal docFees;
    @Column(precision = 12, scale = 2)
    private BigDecimal tax;
    @Column(precision = 12, scale = 2)
    private BigDecimal total;

    private String paymentStatus;
    private String transactionId;
    private String cardBrand;
    /** Only the last 4 digits are ever stored; the full card number is never persisted. */
    private String cardLast4;

    protected CustomerOrder() {
    }

    public CustomerOrder(String customerName, String email, String phone, String address, List<OrderItem> items,
                         BigDecimal subtotal, BigDecimal docFees, BigDecimal tax, BigDecimal total) {
        this.customerName = customerName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.items = new ArrayList<>(items);
        this.subtotal = subtotal;
        this.docFees = docFees;
        this.tax = tax;
        this.total = total;
        this.createdAt = LocalDateTime.now();
    }

    public void markPaid(String transactionId, String cardBrand, String cardLast4) {
        this.paymentStatus = "PAID";
        this.transactionId = transactionId;
        this.cardBrand = cardBrand;
        this.cardLast4 = cardLast4;
    }

    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public Long getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getCustomerName() { return customerName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }
    public List<OrderItem> getItems() { return items; }
    public BigDecimal getSubtotal() { return subtotal; }
    public BigDecimal getDocFees() { return docFees; }
    public BigDecimal getTax() { return tax; }
    public BigDecimal getTotal() { return total; }
    public String getPaymentStatus() { return paymentStatus; }
    public String getTransactionId() { return transactionId; }
    public String getCardBrand() { return cardBrand; }
    public String getCardLast4() { return cardLast4; }
}
