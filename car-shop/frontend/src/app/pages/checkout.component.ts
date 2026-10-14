import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { OrderSummaryComponent } from './order-summary.component';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, OrderSummaryComponent],
  template: `
    <section class="container page">
      <h1>Checkout</h1>
      @if (!cart.lines().length) {
        <div class="empty-cart">
          <p>Your cart is empty.</p>
          <a routerLink="/" class="btn">Browse the showroom</a>
        </div>
      } @else {
        <form class="two-col" [formGroup]="form" (ngSubmit)="pay()">
          <div class="panel form">
            <h2><span class="step">1</span> Buyer details</h2>
            <div class="fields" formGroupName="customer">
              <label class="full">Full name<input formControlName="name" autocomplete="name" /></label>
              <label>Email<input type="email" formControlName="email" autocomplete="email" /></label>
              <label>Phone<input type="tel" formControlName="phone" autocomplete="tel" /></label>
              <label class="full">Address<textarea rows="2" formControlName="address" autocomplete="street-address"></textarea></label>
            </div>

            <h2><span class="step">2</span> Payment</h2>
            <div class="card-preview">
              <span class="chip-icon"></span>
              <span class="brand">{{ brand() }}</span>
              <span class="num">{{ maskedNumber() }}</span>
              <span class="holder">{{ form.value.card?.holderName || 'CARDHOLDER NAME' }}</span>
              <span class="exp">{{ form.value.card?.expiry || 'MM/YY' }}</span>
            </div>
            <div class="fields" formGroupName="card">
              <label class="full">Card number
                <input formControlName="number" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242"
                       (input)="formatNumber($event)" maxlength="23" />
              </label>
              <label class="full">Name on card<input formControlName="holderName" autocomplete="cc-name" /></label>
              <label>Expiry (MM/YY)
                <input formControlName="expiry" placeholder="08/29" autocomplete="cc-exp" (input)="formatExpiry($event)" maxlength="5" />
              </label>
              <label>CVV<input formControlName="cvv" inputmode="numeric" autocomplete="cc-csc" maxlength="4" type="password" /></label>
            </div>
            <p class="hint">Demo gateway: use <code>4242 4242 4242 4242</code> to pay, <code>4000 0000 0000 0002</code> to see a declined card. Any future expiry and any 3-digit CVV.</p>
          </div>

          <app-order-summary>
            @if (error()) {
              <div class="alert error">{{ error() }}</div>
            }
            <button class="btn lg block" type="submit" [disabled]="paying()">
              {{ paying() ? 'Processing payment…' : 'Pay now' }}
            </button>
          </app-order-summary>
        </form>
      }
    </section>
  `,
})
export class CheckoutComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  cart = inject(CartService);

  paying = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    customer: this.fb.nonNullable.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[+\d][\d\s()-]{6,}$/)]],
      address: ['', Validators.required],
    }),
    card: this.fb.nonNullable.group({
      number: ['', [Validators.required, Validators.pattern(/^[\d ]{13,23}$/)]],
      holderName: ['', Validators.required],
      expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    }),
  });

  brand(): string {
    const n = this.form.value.card?.number?.replace(/\s/g, '') ?? '';
    if (n.startsWith('4')) return 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(n)) return 'MASTERCARD';
    if (/^3[47]/.test(n)) return 'AMEX';
    return 'CARD';
  }

  maskedNumber(): string {
    const n = (this.form.value.card?.number ?? '').replace(/\s/g, '').padEnd(16, '•');
    return n.replace(/(.{4})/g, '$1 ').trim();
  }

  formatNumber(e: Event): void {
    const el = e.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, '').slice(0, 19);
    this.form.controls.card.controls.number.setValue(digits.replace(/(.{4})(?=.)/g, '$1 '));
  }

  formatExpiry(e: Event): void {
    const el = e.target as HTMLInputElement;
    const d = el.value.replace(/\D/g, '').slice(0, 4);
    this.form.controls.card.controls.expiry.setValue(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
  }

  pay(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fill in all fields correctly.');
      return;
    }
    const { customer, card } = this.form.getRawValue();
    const [mm, yy] = card.expiry.split('/');
    this.error.set('');
    this.paying.set(true);
    this.api
      .checkout({
        items: this.cart.lines().map((l) => ({ carId: l.car.id, quantity: l.quantity })),
        customer,
        card: {
          number: card.number.replace(/\s/g, ''),
          holderName: card.holderName,
          expMonth: +mm,
          expYear: 2000 + +yy,
          cvv: card.cvv,
        },
      })
      .subscribe({
        next: (order) => {
          this.cart.clear();
          this.router.navigate(['/orders', order.id], { queryParams: { paid: 1 } });
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.paying.set(false);
        },
      });
  }
}
