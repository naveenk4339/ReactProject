package com.carshop.service;

import com.carshop.model.Car;
import com.carshop.model.CustomerOrder;
import com.carshop.model.OrderItem;
import com.carshop.repo.CarRepository;
import com.carshop.repo.OrderRepository;
import com.carshop.web.dto.CheckoutRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final CarRepository cars;
    private final OrderRepository orders;
    private final PaymentService payments;
    private final BigDecimal taxRate;
    private final BigDecimal docFeePerCar;

    public OrderService(CarRepository cars, OrderRepository orders, PaymentService payments,
                        @Value("${carshop.tax-rate}") BigDecimal taxRate,
                        @Value("${carshop.doc-fee}") BigDecimal docFeePerCar) {
        this.cars = cars;
        this.orders = orders;
        this.payments = payments;
        this.taxRate = taxRate;
        this.docFeePerCar = docFeePerCar;
    }

    /** Prices come from the database, never from the client, so a tampered cart can't change the bill. */
    @Transactional
    public CustomerOrder checkout(CheckoutRequest req) {
        List<OrderItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int carCount = 0;

        for (CheckoutRequest.Item line : req.items()) {
            Car car = cars.findById(line.carId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Car " + line.carId() + " not found."));
            if (car.getStock() < line.quantity()) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Only " + car.getStock() + " left of " + car.getDisplayName() + ".");
            }
            OrderItem item = new OrderItem(car.getId(), car.getDisplayName(), car.getPrice(), line.quantity());
            items.add(item);
            subtotal = subtotal.add(item.getLineTotal());
            carCount += line.quantity();
        }

        BigDecimal docFees = docFeePerCar.multiply(BigDecimal.valueOf(carCount));
        BigDecimal tax = subtotal.add(docFees).multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(docFees).add(tax).setScale(2, RoundingMode.HALF_UP);

        CheckoutRequest.Card c = req.card();
        PaymentService.PaymentResult paid = payments.charge(
                new PaymentService.CardDetails(c.number(), c.holderName(), c.expMonth(), c.expYear(), c.cvv()), total);

        for (CheckoutRequest.Item line : req.items()) {
            Car car = cars.getReferenceById(line.carId());
            car.setStock(car.getStock() - line.quantity());
        }

        CheckoutRequest.Customer cu = req.customer();
        CustomerOrder order = new CustomerOrder(cu.name(), cu.email(), cu.phone(), cu.address(),
                items, subtotal, docFees, tax, total);
        order.markPaid(paid.transactionId(), paid.brand(), paid.last4());
        order = orders.save(order);
        order.setInvoiceNumber("INV-" + order.getCreatedAt().format(DateTimeFormatter.BASIC_ISO_DATE)
                + "-" + String.format("%05d", order.getId()));
        return order;
    }

    public CustomerOrder find(Long id) {
        return orders.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order " + id + " not found."));
    }
}
