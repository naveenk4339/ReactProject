package com.carshop.config;

import com.carshop.model.Car;
import com.carshop.repo.CarRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/** Fills the in-memory database with the showroom inventory on startup. */
@Component
public class DataSeeder implements CommandLineRunner {

    private final CarRepository cars;

    public DataSeeder(CarRepository cars) {
        this.cars = cars;
    }

    @Override
    public void run(String... args) {
        if (cars.count() > 0) {
            return;
        }
        cars.saveAll(List.of(
                car("Tesla", "Model 3", 2024, "38990", 1200, "Electric", "Automatic", "Sedan", "Pearl White", "tesla-model-3",
                        "Long-range dual motor, autopilot, 15\" touchscreen and glass roof. Up to 341 miles per charge.", 4),
                car("BMW", "M4 Competition", 2023, "78500", 8400, "Petrol", "Automatic", "Coupe", "Isle of Man Green", "bmw-m4",
                        "503 hp twin-turbo inline-six, carbon bucket seats and adaptive M suspension.", 2),
                car("Toyota", "RAV4 Hybrid", 2024, "34250", 300, "Hybrid", "Automatic", "SUV", "Blueprint", "toyota-rav4",
                        "All-wheel drive hybrid with 40 mpg combined, Toyota Safety Sense 2.5 and roomy cargo bay.", 6),
                car("Ford", "Mustang GT", 2023, "45900", 5600, "Petrol", "Manual", "Coupe", "Race Red", "ford-mustang",
                        "5.0L V8 with 480 hp, six-speed manual, launch control and active exhaust.", 3),
                car("Honda", "Civic Sport", 2024, "26800", 900, "Petrol", "CVT", "Sedan", "Sonic Gray", "honda-civic",
                        "Efficient, fun and reliable. Apple CarPlay, Honda Sensing and sporty 18\" alloys.", 8),
                car("Porsche", "911 Carrera", 2022, "118000", 12300, "Petrol", "PDK", "Coupe", "Guards Red", "porsche-911",
                        "The icon: 379 hp flat-six, 0-60 in 3.9s, sport chrono package and Bose audio.", 1),
                car("Jeep", "Wrangler Rubicon", 2023, "52400", 7100, "Petrol", "Automatic", "SUV", "Sarge Green", "jeep-wrangler",
                        "Trail rated 4x4 with locking differentials, removable roof and doors.", 3),
                car("Mercedes-Benz", "E 350", 2024, "62300", 2100, "Petrol", "Automatic", "Sedan", "Obsidian Black", "mercedes-e350",
                        "Executive comfort, MBUX Superscreen, Burmester sound and driver assistance package.", 2),
                car("Hyundai", "Ioniq 5", 2024, "43650", 600, "Electric", "Automatic", "SUV", "Lucid Blue", "hyundai-ioniq5",
                        "800V ultra-fast charging (10-80% in 18 min), 303 mi range and retro-futuristic design.", 5)));
    }

    private static Car car(String make, String model, int year, String price, int mileage, String fuel, String trans,
                           String body, String color, String image, String desc, int stock) {
        return new Car(make, model, year, new BigDecimal(price), mileage, fuel, trans, body, color,
                "/images/" + image + ".svg", desc, stock);
    }
}
