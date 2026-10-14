# React Shopping Cart (moved)

This project has been split into two repositories:

| Repository | What it contains |
| ---------- | ---------------- |
| [shop-frontend](https://github.com/naveenk4339/shop-frontend) | React (Vite) UI: login, cart with totals, card checkout, order confirmation |
| [shop-backend](https://github.com/naveenk4339/shop-backend) | Node.js (Express + SQLite) API: users, carts, simulated card payments, orders |

## New: AutoMart car shop (Angular + Java)

The [`car-shop/`](car-shop) module is an online car store with an Angular frontend and a Spring Boot (Java) backend:
car catalog with images and prices, cart, online card payment and bill/PDF invoice generation. See [car-shop/README.md](car-shop/README.md).

## Run the React shop

```bash
git clone https://github.com/naveenk4339/shop-backend
cd shop-backend && npm install && npm start      # http://localhost:4000

git clone https://github.com/naveenk4339/shop-frontend
cd shop-frontend && npm install && npm run dev   # http://localhost:5173
```

Log in with the demo account `demo@shop.com` / `demo123`.

The original combined code is still in this branch's git history.
