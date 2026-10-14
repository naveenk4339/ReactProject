import { Routes } from '@angular/router';
import { CatalogComponent } from './pages/catalog.component';
import { CarDetailComponent } from './pages/car-detail.component';
import { CartComponent } from './pages/cart.component';
import { CheckoutComponent } from './pages/checkout.component';
import { InvoiceComponent } from './pages/invoice.component';

export const routes: Routes = [
  { path: '', component: CatalogComponent, title: 'AutoMart · Buy cars online' },
  { path: 'cars/:id', component: CarDetailComponent, title: 'Car details · AutoMart' },
  { path: 'cart', component: CartComponent, title: 'Your cart · AutoMart' },
  { path: 'checkout', component: CheckoutComponent, title: 'Checkout · AutoMart' },
  { path: 'orders/:id', component: InvoiceComponent, title: 'Invoice · AutoMart' },
  { path: '**', redirectTo: '' },
];
