import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { OrderSummaryComponent } from './order-summary.component';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe, OrderSummaryComponent],
  template: `
    <section class="container page">
      <h1>Your cart</h1>
      @if (!cart.lines().length) {
        <div class="empty-cart">
          <p>Your cart is empty.</p>
          <a routerLink="/" class="btn">Browse the showroom</a>
        </div>
      } @else {
        <div class="two-col">
          <div class="panel">
            @for (line of cart.lines(); track line.car.id) {
              <div class="cart-line">
                <img [src]="line.car.imageUrl" [alt]="line.car.displayName" />
                <div class="cart-line-info">
                  <a [routerLink]="['/cars', line.car.id]"><strong>{{ line.car.displayName }}</strong></a>
                  <span class="muted">{{ line.car.color }} · {{ line.car.fuelType }}</span>
                  <button class="link danger" (click)="cart.remove(line.car.id)">Remove</button>
                </div>
                <div class="qty">
                  <button (click)="cart.setQuantity(line.car.id, line.quantity - 1)" aria-label="Decrease">−</button>
                  <span>{{ line.quantity }}</span>
                  <button (click)="cart.setQuantity(line.car.id, line.quantity + 1)"
                          [disabled]="line.quantity >= line.car.stock || line.quantity >= 5" aria-label="Increase">+</button>
                </div>
                <strong class="line-total">{{ line.car.price * line.quantity | currency: 'USD' }}</strong>
              </div>
            }
          </div>
          <app-order-summary>
            <a routerLink="/checkout" class="btn lg block">Proceed to checkout</a>
          </app-order-summary>
        </div>
      }
    </section>
  `,
})
export class CartComponent {
  cart = inject(CartService);
}
