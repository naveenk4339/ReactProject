import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CartService } from '../core/cart.service';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe],
  template: `
    <aside class="panel summary">
      <h2>Order summary</h2>
      <div class="row"><span>Subtotal ({{ cart.count() }} {{ cart.count() === 1 ? 'car' : 'cars' }})</span><span>{{ cart.subtotal() | currency: 'USD' }}</span></div>
      <div class="row"><span>Documentation fees</span><span>{{ cart.docFees() | currency: 'USD' }}</span></div>
      <div class="row"><span>Sales tax (8%)</span><span>{{ cart.tax() | currency: 'USD' }}</span></div>
      <div class="row total"><span>Total</span><span>{{ cart.total() | currency: 'USD' }}</span></div>
      <ng-content />
      <p class="secure">🔒 Payments are encrypted and processed securely.</p>
    </aside>
  `,
})
export class OrderSummaryComponent {
  cart = inject(CartService);
}
