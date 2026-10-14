import { Injectable, computed, effect, signal } from '@angular/core';
import { Car, CartLine, DOC_FEE, TAX_RATE } from './models';

const STORAGE_KEY = 'automart-cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>(this.load());

  readonly count = computed(() => this.lines().reduce((n, l) => n + l.quantity, 0));
  readonly subtotal = computed(() => this.lines().reduce((s, l) => s + l.car.price * l.quantity, 0));
  readonly docFees = computed(() => this.count() * DOC_FEE);
  readonly tax = computed(() => round2((this.subtotal() + this.docFees()) * TAX_RATE));
  readonly total = computed(() => round2(this.subtotal() + this.docFees() + this.tax()));

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.lines()));
      } catch {
        /* storage unavailable: cart just won't survive a reload */
      }
    });
  }

  add(car: Car): void {
    const existing = this.lines().find((l) => l.car.id === car.id);
    if (existing) {
      this.setQuantity(car.id, existing.quantity + 1);
    } else if (car.stock > 0) {
      this.lines.update((ls) => [...ls, { car, quantity: 1 }]);
    }
  }

  setQuantity(carId: number, quantity: number): void {
    this.lines.update((ls) =>
      ls
        .map((l) => (l.car.id === carId ? { ...l, quantity: Math.min(Math.max(quantity, 0), l.car.stock, 5) } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  remove(carId: number): void {
    this.lines.update((ls) => ls.filter((l) => l.car.id !== carId));
  }

  has(carId: number): boolean {
    return this.lines().some((l) => l.car.id === carId);
  }

  clear(): void {
    this.lines.set([]);
  }

  private load(): CartLine[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
