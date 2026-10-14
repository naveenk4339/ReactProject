import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnChanges, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { Order } from '../core/models';

@Component({
  selector: 'app-invoice',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <section class="container page">
      @if (order(); as o) {
        @if (paid()) {
          <div class="success no-print">
            <div class="tick">✓</div>
            <div>
              <h2>Payment successful!</h2>
              <p>{{ o.total | currency: 'USD' }} was charged to your {{ o.cardBrand }} ending in {{ o.cardLast4 }}. A copy of your bill is below.</p>
            </div>
          </div>
        }
        <div class="invoice-actions no-print">
          <a [href]="pdfUrl(o.id)" class="btn">⬇ Download PDF bill</a>
          <button class="btn ghost" (click)="print()">🖨 Print</button>
          <a routerLink="/" class="btn ghost">Continue shopping</a>
        </div>

        <article class="invoice">
          <header class="inv-head">
            <div>
              <div class="logo dark"><span class="logo-mark">◆</span> Auto<span>Mart</span></div>
              <p class="muted small">123 Motor Avenue, Detroit, MI 48201<br />sales&#64;automart.example</p>
            </div>
            <div class="right">
              <h2>INVOICE</h2>
              <p><strong>{{ o.invoiceNumber }}</strong></p>
              <p class="muted small">{{ o.createdAt | date: 'medium' }}</p>
            </div>
          </header>
          <div class="inv-parties">
            <div>
              <p class="label">Bill to</p>
              <p><strong>{{ o.customerName }}</strong></p>
              <p class="pre">{{ o.address }}</p>
              <p>{{ o.email }} · {{ o.phone }}</p>
            </div>
            <div class="right">
              <p class="label">Payment</p>
              <p><span class="paid">{{ o.paymentStatus }}</span></p>
              <p>{{ o.cardBrand }} •••• {{ o.cardLast4 }}</p>
              <p class="muted small">{{ o.transactionId }}</p>
            </div>
          </div>
          <table class="inv-table">
            <thead><tr><th>Vehicle</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead>
            <tbody>
              @for (it of o.items; track it.carId) {
                <tr><td>{{ it.carName }}</td><td>{{ it.quantity }}</td><td>{{ it.unitPrice | currency: 'USD' }}</td><td>{{ it.lineTotal | currency: 'USD' }}</td></tr>
              }
            </tbody>
          </table>
          <div class="inv-totals">
            <div class="row"><span>Subtotal</span><span>{{ o.subtotal | currency: 'USD' }}</span></div>
            <div class="row"><span>Documentation fees</span><span>{{ o.docFees | currency: 'USD' }}</span></div>
            <div class="row"><span>Sales tax</span><span>{{ o.tax | currency: 'USD' }}</span></div>
            <div class="row total"><span>Total paid</span><span>{{ o.total | currency: 'USD' }}</span></div>
          </div>
          <p class="thanks">Thank you for buying with AutoMart!</p>
        </article>
      } @else if (error()) {
        <div class="alert error">{{ error() }}</div>
      } @else {
        <div class="invoice skeleton tall"></div>
      }
    </section>
  `,
})
export class InvoiceComponent implements OnChanges {
  private api = inject(ApiService);

  id = input.required<string>();
  paid = input<string>();
  order = signal<Order | null>(null);
  error = signal('');

  ngOnChanges(): void {
    this.api.order(+this.id()).subscribe({
      next: (o) => this.order.set(o),
      error: (e) => this.error.set(errorMessage(e)),
    });
  }

  pdfUrl(id: number): string {
    return this.api.invoicePdfUrl(id);
  }

  print(): void {
    window.print();
  }
}
