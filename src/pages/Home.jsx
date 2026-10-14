import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const formatPrice = (value) => `$${value.toFixed(2)}`;

export default function Home({ user, onLogout }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  // Cart lines from the server: [{ id, name, price, emoji, qty }]
  const [cartLines, setCartLines] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.products(), api.cart()])
      .then(([products, cart]) => {
        setProducts(products);
        setCartLines(cart);
      })
      .catch((err) => setError(err.message));
  }, []);

  const qtyById = Object.fromEntries(cartLines.map((line) => [line.id, line.qty]));

  const changeQty = async (id, delta) => {
    try {
      setCartLines(await api.setQty(id, Math.max(0, (qtyById[id] || 0) + delta)));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const clearCart = async () => {
    try {
      setCartLines(await api.clearCart());
    } catch (err) {
      setError(err.message);
    }
  };

  const totalItems = cartLines.reduce((sum, line) => sum + line.qty, 0);
  const totalPrice = cartLines.reduce((sum, line) => sum + line.price * line.qty, 0);

  const handleLogout = async () => {
    await onLogout();
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
          {error && <p className="error">{error}</p>}
          <div className="product-grid">
            {products.map((p) => (
              <div key={p.id} className="card product">
                <div className="emoji">{p.emoji}</div>
                <h3>{p.name}</h3>
                <p className="price">{formatPrice(p.price)}</p>
                {qtyById[p.id] ? (
                  <div className="qty-controls">
                    <button className="btn" onClick={() => changeQty(p.id, -1)}>−</button>
                    <span>{qtyById[p.id]}</span>
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
                  <span>{formatPrice(line.price * line.qty)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="totals">
            <div><span>Total items</span><strong>{totalItems}</strong></div>
            <div><span>Total</span><strong>{formatPrice(totalPrice)}</strong></div>
          </div>
          {cartLines.length > 0 && (
            <button className="btn" onClick={clearCart}>Clear cart</button>
          )}
        </aside>
      </main>
    </div>
  );
}
