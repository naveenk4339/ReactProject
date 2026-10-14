package com.carshop.web;

import com.carshop.model.Car;
import com.carshop.repo.CarRepository;
import com.carshop.service.ApiException;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cars")
public class CarController {

    private final CarRepository cars;

    public CarController(CarRepository cars) {
        this.cars = cars;
    }

    @GetMapping
    public List<Car> list() {
        return cars.findAll(Sort.by("make", "model"));
    }

    @GetMapping("/{id}")
    public Car get(@PathVariable Long id) {
        return cars.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Car " + id + " not found."));
    }
}
