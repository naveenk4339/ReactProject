import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartService } from './core/cart.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar no-print">
      <div class="container topbar-inner">
        <a routerLink="/" class="logo"><span class="logo-mark">◆</span> Auto<span>Mart</span></a>
        <nav>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Showroom</a>
          <a routerLink="/cart" routerLinkActive="active" class="cart-link">
            Cart
            @if (cart.count()) {
              <span class="badge">{{ cart.count() }}</span>
            }
          </a>
        </nav>
      </div>
    </header>
    <main>
      <router-outlet />
    </main>
    <footer class="footer no-print">
      <div class="container">
        <span>© 2026 AutoMart Motors · 123 Motor Avenue, Detroit</span>
        <span>Secure checkout · Instant invoice</span>
      </div>
    </footer>
  `,
})
export class AppComponent {
  cart = inject(CartService);
}
