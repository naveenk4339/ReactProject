import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { Car } from '../core/models';

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'year-desc';

@Component({
  selector: 'app-catalog',
  imports: [RouterLink, FormsModule, CurrencyPipe, DecimalPipe],
  template: `
    <section class="hero">
      <div class="container hero-inner">
        <div>
          <p class="eyebrow">New & certified pre-owned</p>
          <h1>Drive home your<br />dream car today.</h1>
          <p class="hero-sub">Browse the showroom, add to cart and pay securely online. Your invoice is ready the moment you pay.</p>
        </div>
        <div class="hero-stats">
          <div><strong>{{ cars().length }}</strong><span>Models in stock</span></div>
          <div><strong>8%</strong><span>Flat sales tax</span></div>
          <div><strong>24h</strong><span>Delivery prep</span></div>
        </div>
      </div>
    </section>

    <section class="container">
      <div class="toolbar">
        <input class="search" type="search" placeholder="Search make or model…" [ngModel]="query()" (ngModelChange)="query.set($event)" />
        <div class="chips">
          @for (t of bodyTypes(); track t) {
            <button class="chip" [class.on]="bodyType() === t" (click)="bodyType.set(t)">{{ t }}</button>
          }
        </div>
        <select [ngModel]="sort()" (ngModelChange)="sort.set($event)">
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="year-desc">Newest first</option>
        </select>
      </div>

      @if (error()) {
        <div class="alert error">{{ error() }}</div>
      } @else if (loading()) {
        <div class="grid">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="card skeleton"></div>
          }
        </div>
      } @else if (!visible().length) {
        <p class="empty">No cars match your search.</p>
      } @else {
        <div class="grid">
          @for (car of visible(); track car.id) {
            <article class="card">
              <a [routerLink]="['/cars', car.id]" class="card-img">
                <img [src]="car.imageUrl" [alt]="car.displayName" loading="lazy" />
                <span class="tag">{{ car.bodyType }}</span>
                @if (car.stock <= 2 && car.stock > 0) {
                  <span class="tag hot">Only {{ car.stock }} left</span>
                }
              </a>
              <div class="card-body">
                <div class="card-title">
                  <h3><a [routerLink]="['/cars', car.id]">{{ car.make }} {{ car.model }}</a></h3>
                  <span class="year">{{ car.year }}</span>
                </div>
                <ul class="specs">
                  <li>{{ car.mileage | number }} mi</li>
                  <li>{{ car.fuelType }}</li>
                  <li>{{ car.transmission }}</li>
                </ul>
                <div class="card-foot">
                  <span class="price">{{ car.price | currency: 'USD' : 'symbol' : '1.0-0' }}</span>
                  @if (car.stock === 0) {
                    <button class="btn" disabled>Sold out</button>
                  } @else if (cart.has(car.id)) {
                    <a routerLink="/cart" class="btn ghost">In cart ✓</a>
                  } @else {
                    <button class="btn" (click)="cart.add(car)">Add to cart</button>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class CatalogComponent {
  private api = inject(ApiService);
  cart = inject(CartService);

  cars = signal<Car[]>([]);
  loading = signal(true);
  error = signal('');
  query = signal('');
  bodyType = signal('All');
  sort = signal<SortKey>('featured');

  bodyTypes = computed(() => ['All', ...new Set(this.cars().map((c) => c.bodyType))]);

  visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.cars().filter(
      (c) =>
        (this.bodyType() === 'All' || c.bodyType === this.bodyType()) &&
        (!q || `${c.make} ${c.model} ${c.year}`.toLowerCase().includes(q)),
    );
    switch (this.sort()) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price);
      case 'year-desc':
        return [...list].sort((a, b) => b.year - a.year);
      default:
        return list;
    }
  });

  constructor() {
    this.api.cars().subscribe({
      next: (cars) => {
        this.cars.set(cars);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
