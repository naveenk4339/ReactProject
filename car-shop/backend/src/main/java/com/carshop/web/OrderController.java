package com.carshop.web;

import com.carshop.model.CustomerOrder;
import com.carshop.service.InvoicePdfService;
import com.carshop.service.OrderService;
import com.carshop.web.dto.CheckoutRequest;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orders;
    private final InvoicePdfService invoices;

    public OrderController(OrderService orders, InvoicePdfService invoices) {
        this.orders = orders;
        this.invoices = invoices;
    }

    /** Charges the card and creates the order; the response is the bill. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerOrder checkout(@Valid @RequestBody CheckoutRequest request) {
        return orders.checkout(request);
    }

    @GetMapping("/{id}")
    public CustomerOrder get(@PathVariable Long id) {
        return orders.find(id);
    }

    @GetMapping(value = "/{id}/invoice.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> invoice(@PathVariable Long id) {
        CustomerOrder order = orders.find(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(order.getInvoiceNumber() + ".pdf").build().toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(invoices.render(order));
    }
}
