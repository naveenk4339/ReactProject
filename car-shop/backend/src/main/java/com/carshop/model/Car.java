package com.carshop.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;

@Entity
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String make;
    private String model;
    @Column(name = "model_year")
    private int year;

    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    private int mileage;
    private String fuelType;
    private String transmission;
    private String bodyType;
    private String color;
    private String imageUrl;

    @Column(length = 1000)
    private String description;

    private int stock;

    protected Car() {
    }

    public Car(String make, String model, int year, BigDecimal price, int mileage, String fuelType,
               String transmission, String bodyType, String color, String imageUrl, String description, int stock) {
        this.make = make;
        this.model = model;
        this.year = year;
        this.price = price;
        this.mileage = mileage;
        this.fuelType = fuelType;
        this.transmission = transmission;
        this.bodyType = bodyType;
        this.color = color;
        this.imageUrl = imageUrl;
        this.description = description;
        this.stock = stock;
    }

    public String getDisplayName() {
        return year + " " + make + " " + model;
    }

    public Long getId() { return id; }
    public String getMake() { return make; }
    public String getModel() { return model; }
    public int getYear() { return year; }
    public BigDecimal getPrice() { return price; }
    public int getMileage() { return mileage; }
    public String getFuelType() { return fuelType; }
    public String getTransmission() { return transmission; }
    public String getBodyType() { return bodyType; }
    public String getColor() { return color; }
    public String getImageUrl() { return imageUrl; }
    public String getDescription() { return description; }
    public int getStock() { return stock; }

    public void setStock(int stock) { this.stock = stock; }
}
