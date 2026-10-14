# AutoMart — online car shop (Angular + Java)

A small car-selling website that works like an online store: browse cars with images and prices,
add them to a cart, pay online by card and get a bill (on screen, printable, and as a PDF).

| Folder | Stack | Port |
| ------ | ----- | ---- |
| [`backend/`](backend) | Java 21, Spring Boot 3.5, Spring Data JPA, H2 (in-memory), OpenPDF | 8080 |
| [`frontend/`](frontend) | Angular 19 (standalone components, signals) | 4200 |

## Features

- **Showroom** – 9 cars with pictures, price, mileage, fuel and gearbox; search, filter by body type, sort by price/year.
- **Car details** – full specs, "Buy now" or "Add to cart"; low-stock and sold-out badges.
- **Cart** – change quantity, remove, live subtotal + doc fees + 8% tax (kept in `localStorage`).
- **Checkout & online payment** – buyer details and card form with live card preview. The backend validates the card
  (Luhn check, expiry, CVV), charges it, reduces stock and saves the order in one transaction.
  Prices are always taken from the database, never trusted from the browser. Only the last 4 card digits are stored.
- **Bill generation** – invoice number `INV-yyyyMMdd-00001`, itemised bill page with a Print button,
  and a downloadable PDF from `GET /api/orders/{id}/invoice.pdf`.

## Run it

You need Java 17+ (21 recommended), Maven and Node 18+.

```bash
# 1. backend
cd car-shop/backend
mvn spring-boot:run              # http://localhost:8080/api/cars

# 2. frontend (new terminal)
cd car-shop/frontend
npm install
npm start                        # http://localhost:4200  (proxies /api and /images to :8080)
```

### Test cards (demo payment gateway)

| Card number | Result |
| ----------- | ------ |
| `4242 4242 4242 4242` | Payment approved |
| `4000 0000 0000 0002` | Declined by issuer |

Use any future expiry (e.g. `08/29`) and any 3-digit CVV.

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/cars` | List all cars |
| GET | `/api/cars/{id}` | One car |
| POST | `/api/orders` | Pay and place an order; returns the bill (201), or 400/402/409 with `{ "message" }` |
| GET | `/api/orders/{id}` | Bill as JSON |
| GET | `/api/orders/{id}/invoice.pdf` | Bill as PDF |

## Going live

- **Real payments:** `PaymentService.charge` is a simulated gateway. Replace it with a Stripe / Razorpay / PayPal
  call (use their hosted card fields so card numbers never reach your server).
- **Real database:** swap the H2 URL in `application.properties` for MySQL/PostgreSQL and add its driver.
  Orders are lost on restart while H2 in-memory is used.
- **Real photos:** the car pictures are SVG illustrations in `backend/src/main/resources/static/images`
  (regenerate with `node scripts/generate-car-images.mjs`). Drop in `.jpg` photos and update `imageUrl` in `DataSeeder`.
- Tax rate and doc fee are set in `application.properties` (`carshop.tax-rate`, `carshop.doc-fee`).

## Tests

```bash
cd car-shop/backend && mvn test      # payment validation + checkout/bill/PDF API tests
cd car-shop/frontend && npm run build
```
