export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  imageUrl: string;
  description: string;
  stock: number;
  displayName: string;
}

export interface CartLine {
  car: Car;
  quantity: number;
}

export interface OrderItem {
  carId: number;
  carName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  docFees: number;
  tax: number;
  total: number;
  paymentStatus: string;
  transactionId: string;
  cardBrand: string;
  cardLast4: string;
}

export interface CheckoutRequest {
  items: { carId: number; quantity: number }[];
  customer: { name: string; email: string; phone: string; address: string };
  card: { number: string; holderName: string; expMonth: number; expYear: number; cvv: string };
}

/** Mirrors carshop.tax-rate / carshop.doc-fee on the backend; used only for the cart preview, the server computes the real bill. */
export const TAX_RATE = 0.08;
export const DOC_FEE = 499;
