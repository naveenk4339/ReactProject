import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Car, CheckoutRequest, Order } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  cars(): Observable<Car[]> {
    return this.http.get<Car[]>('/api/cars');
  }

  car(id: number): Observable<Car> {
    return this.http.get<Car>(`/api/cars/${id}`);
  }

  checkout(req: CheckoutRequest): Observable<Order> {
    return this.http.post<Order>('/api/orders', req);
  }

  order(id: number): Observable<Order> {
    return this.http.get<Order>(`/api/orders/${id}`);
  }

  invoicePdfUrl(id: number): string {
    return `/api/orders/${id}/invoice.pdf`;
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0 || err.status === 504) {
      return 'Cannot reach the server. Is the Java backend running on port 8080?';
    }
    return err.error?.message ?? `Request failed (${err.status}).`;
  }
  return 'Something went wrong.';
}
