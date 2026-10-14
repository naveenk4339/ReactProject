# React Shopping Cart

React (Vite) frontend with a Node.js (Express + SQLite) backend.

- **Login page** – sign in, or create an account. Accounts are saved in the database with hashed passwords.
- **Home page** – list of shopping items; add items to the cart, adjust quantities with −/+, and see **total items** and **total price**. The cart is saved per user, so it is still there after a reload or a new login.

## Project layout

```
.            React frontend (Vite)
server/      Node.js backend (Express + SQLite)
  src/db.js     database tables and sample products
  src/auth.js   password hashing and login sessions
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

Authenticated routes need the header `Authorization: Bearer <token>`.
