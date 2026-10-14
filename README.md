# React Shopping Cart

React (Vite) frontend with a Node.js (Express + SQLite) backend.

- **Login page** – sign in, or create an account. Accounts are saved in the database with hashed passwords.
- **Home page** – list of shopping items; add items to the cart, adjust quantities with −/+, and see **total items** and **total price**. The cart is saved per user, so it is still there after a reload or a new login.
- **Checkout** – pay by card. Card details are validated (name, card number checksum, expiry not in the past, 3- or 4-digit CVV) in the browser and again on the server.
- **Order confirmation** – after payment shows *Payment approved*, the approved amount, order ID, total items and each item. The order and its items are saved in the database and the cart is emptied.

### Test cards

Payments are simulated; no real money moves.

| Card number           | Result   |
| --------------------- | -------- |
| `4242 4242 4242 4242` | Approved |
| `4000 0000 0000 0002` | Declined |

Use any name, any future expiry (e.g. `12/30`) and any 3-digit CVV. Only the card brand and last 4 digits are stored, never the full number or CVV.

## Project layout

```
.            React frontend (Vite)
server/      Node.js backend (Express + SQLite)
  src/db.js     database tables and sample products
  src/auth.js   password hashing and login sessions
  src/payment.js card validation and simulated payment
  src/index.js  API routes
```

The database is a single file, `server/shop.db`, created automatically on first start.

## Run

Open two terminals.

**1. Backend** (http://localhost:4000)

```bash
cd server
npm install
npm start
```

**2. Frontend** (http://localhost:5173)

```bash
npm install
npm run dev
```

Open http://localhost:5173, click **Create one** to register, then log in.
The frontend forwards `/api` requests to the backend (see `vite.config.js`).

## API

| Method | Path                    | Auth | Description                              |
| ------ | ----------------------- | ---- | ---------------------------------------- |
| POST   | `/api/register`         | no   | `{ email, password }` → `{ token, user }` |
| POST   | `/api/login`            | no   | `{ email, password }` → `{ token, user }` |
| POST   | `/api/logout`           | yes  | Ends the session                         |
| GET    | `/api/me`               | yes  | Current user                             |
| GET    | `/api/products`         | no   | All products                             |
| GET    | `/api/cart`             | yes  | Current user's cart                      |
| PUT    | `/api/cart/:productId`  | yes  | `{ qty }` sets quantity (0 removes)      |
| DELETE | `/api/cart`             | yes  | Empties the cart                         |
| POST   | `/api/checkout`         | yes  | `{ card: { name, number, expiry, cvv } }` → saved order |
| GET    | `/api/orders`           | yes  | Current user's orders                    |
| GET    | `/api/orders/:orderId`  | yes  | One order with its items                 |

### Database tables

`users`, `sessions`, `products`, `cart_items`, `orders` (order ID, total items, total amount, status, card brand/last 4) and `order_items` (product, unit price, quantity, line total). Amounts are stored in cents.

Authenticated routes need the header `Authorization: Bearer <token>`.
