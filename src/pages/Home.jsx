import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PRODUCTS = [
  { id: 1, name: 'Apple', price: 0.99, emoji: '🍎' },
  { id: 2, name: 'Bread', price: 2.49, emoji: '🍞' },
  { id: 3, name: 'Milk', price: 3.29, emoji: '🥛' },
  { id: 4, name: 'Cheese', price: 5.75, emoji: '🧀' },
  { id: 5, name: 'Coffee', price: 8.99, emoji: '☕' },
  { id: 6, name: 'Eggs (12)', price: 4.19, emoji: '🥚' },
];

const formatPrice = (value) => `$${value.toFixed(2)}`;

export default function Home({ user, onLogout }) {
  const navigate = useNavigate();
  // Maps product id -> quantity in cart.
  const [cart, setCart] = useState({});

  const changeQty = (id, delta) => {
    setCart((prev) => {
      const qty = (prev[id] || 0) + delta;
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  const cartLines = PRODUCTS.filter((p) => cart[p.id]).map((p) => ({
    ...p,
    qty: cart[p.id],
    lineTotal: p.price * cart[p.id],
  }));
  const totalItems = cartLines.reduce((sum, line) => sum + line.qty, 0);
  const totalPrice = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="home-page">
      <header className="topbar">
        <h1>Shop</h1>
        <div className="topbar-right">
          <span>{user.email}</span>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="layout">
        <section>
          <h2>Items</h2>
          <div className="product-grid">
            {PRODUCTS.map((p) => (
              <div key={p.id} className="card product">
                <div className="emoji">{p.emoji}</div>
                <h3>{p.name}</h3>
                <p className="price">{formatPrice(p.price)}</p>
                {cart[p.id] ? (
                  <div className="qty-controls">
                    <button className="btn" onClick={() => changeQty(p.id, -1)}>−</button>
                    <span>{cart[p.id]}</span>
                    <button className="btn" onClick={() => changeQty(p.id, 1)}>+</button>
                  </div>
                ) : (
                  <button className="btn primary" onClick={() => changeQty(p.id, 1)}>Add to cart</button>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="card cart">
          <h2>Cart</h2>
          {cartLines.length === 0 ? (
            <p className="muted">Your cart is empty.</p>
          ) : (
            <ul className="cart-lines">
              {cartLines.map((line) => (
                <li key={line.id}>
                  <span>{line.name} × {line.qty}</span>
                  <span>{formatPrice(line.lineTotal)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="totals">
            <div><span>Total items</span><strong>{totalItems}</strong></div>
            <div><span>Total</span><strong>{formatPrice(totalPrice)}</strong></div>
          </div>
          {cartLines.length > 0 && (
            <button className="btn" onClick={() => setCart({})}>Clear cart</button>
          )}
        </aside>
      </main>
    </div>
  );
}
