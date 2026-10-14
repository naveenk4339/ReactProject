import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnChanges, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { Car } from '../core/models';

@Component({
  selector: 'app-car-detail',
  imports: [RouterLink, CurrencyPipe, DecimalPipe],
  template: `
    <section class="container page">
      <a routerLink="/" class="back">← Back to showroom</a>
      @if (car(); as car) {
        <div class="detail">
          <div class="detail-img"><img [src]="car.imageUrl" [alt]="car.displayName" /></div>
          <div class="detail-info">
            <p class="eyebrow">{{ car.bodyType }} · {{ car.color }}</p>
            <h1>{{ car.displayName }}</h1>
            <p class="price big">{{ car.price | currency: 'USD' : 'symbol' : '1.0-0' }}</p>
            <p class="muted">{{ car.description }}</p>
            <dl class="spec-grid">
              <div><dt>Year</dt><dd>{{ car.year }}</dd></div>
              <div><dt>Mileage</dt><dd>{{ car.mileage | number }} mi</dd></div>
              <div><dt>Fuel</dt><dd>{{ car.fuelType }}</dd></div>
              <div><dt>Transmission</dt><dd>{{ car.transmission }}</dd></div>
              <div><dt>Color</dt><dd>{{ car.color }}</dd></div>
              <div><dt>In stock</dt><dd>{{ car.stock }}</dd></div>
            </dl>
            <div class="actions">
              @if (car.stock === 0) {
                <button class="btn lg" disabled>Sold out</button>
              } @else {
                <button class="btn lg" (click)="buyNow(car)">Buy now</button>
                <button class="btn lg ghost" (click)="cart.add(car)" [disabled]="cart.has(car.id)">
                  {{ cart.has(car.id) ? 'Added to cart ✓' : 'Add to cart' }}
                </button>
              }
            </div>
          </div>
        </div>
      } @else if (error()) {
        <div class="alert error">{{ error() }}</div>
      } @else {
        <div class="detail"><div class="detail-img skeleton"></div></div>
      }
    </section>
  `,
})
export class CarDetailComponent implements OnChanges {
  private api = inject(ApiService);
  private router = inject(Router);
  cart = inject(CartService);

  id = input.required<string>();
  car = signal<Car | null>(null);
  error = signal('');

  ngOnChanges(): void {
    this.car.set(null);
    this.api.car(+this.id()).subscribe({
      next: (c) => this.car.set(c),
      error: (e) => this.error.set(errorMessage(e)),
    });
  }

  buyNow(car: Car): void {
    if (!this.cart.has(car.id)) {
      this.cart.add(car);
    }
    this.router.navigate(['/checkout']);
  }
}
