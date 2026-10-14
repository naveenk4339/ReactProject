import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { cardBrand, formatCardNumber, formatExpiry, validateCard } from '../cardValidation.js';

const formatPrice = (value) => `$${value.toFixed(2)}`;

export default function Checkout() {
  const navigate = useNavigate();
  const [cartLines, setCartLines] = useState(null);
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.cart().then(setCartLines).catch((err) => setError(err.message));
  }, []);

  const update = (field, format = (v) => v) => (e) => {
    setCard((prev) => ({ ...prev, [field]: format(e.target.value) }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePay = async (e) => {
    e.preventDefault();
    const errors = validateCard(card);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setError('');
    setPaying(true);
    try {
      const order = await api.checkout(card);
      navigate(`/order/${order.id}`, { replace: true, state: { order } });
    } catch (err) {
      setError(err.message);
      if (err.fields) setFieldErrors(err.fields);
      setPaying(false);
    }
  };

  if (cartLines === null) {
    return <p className="loading">{error || 'Loading…'}</p>;
  }

  if (cartLines.length === 0) {
    return (
      <div className="page-center">
        <div className="card narrow">
          <h1>Your cart is empty</h1>
          <p className="muted">Add some items before checking out.</p>
          <Link className="btn primary" to="/home">Back to shop</Link>
        </div>
      </div>
    );
  }

  const totalItems = cartLines.reduce((sum, l) => sum + l.qty, 0);
  const totalPrice = cartLines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const brand = cardBrand(card.number.replace(/\s/g, ''));

  return (
    <div className="checkout-page">
      <Link className="back-link" to="/home">← Back to shop</Link>
      <div className="checkout-layout">
        <section className="card">
          <h2>Order summary</h2>
          <ul className="cart-lines">
            {cartLines.map((line) => (
              <li key={line.id}>
                <span>{line.name} × {line.qty}</span>
                <span>{formatPrice(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="totals">
            <div><span>Total items</span><strong>{totalItems}</strong></div>
            <div><span>Total</span><strong>{formatPrice(totalPrice)}</strong></div>
          </div>
        </section>

        <form className="card payment-form" onSubmit={handlePay} noValidate>
          <h2>Pay by card</h2>
          <label>
            Name on card
            <input
              id="card-name"
              value={card.name}
              onChange={update('name')}
              placeholder="Jane Smith"
              autoComplete="cc-name"
            />
            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
          </label>
          <label>
            <span>Card number {brand && <span className="brand">{brand}</span>}</span>
            <input
              id="card-number"
              value={card.number}
              onChange={update('number', formatCardNumber)}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              autoComplete="cc-number"
            />
            {fieldErrors.number && <span className="field-error">{fieldErrors.number}</span>}
          </label>
          <div className="row">
            <label>
              Expiry (MM/YY)
              <input
                id="card-expiry"
                value={card.expiry}
                onChange={update('expiry', formatExpiry)}
                placeholder="MM/YY"
                inputMode="numeric"
                autoComplete="cc-exp"
              />
              {fieldErrors.expiry && <span className="field-error">{fieldErrors.expiry}</span>}
            </label>
            <label>
              CVV
              <input
                id="card-cvv"
                type="password"
                value={card.cvv}
                onChange={update('cvv', (v) => v.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
              />
              {fieldErrors.cvv && <span className="field-error">{fieldErrors.cvv}</span>}
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary" disabled={paying}>
            {paying ? 'Processing…' : `Pay ${formatPrice(totalPrice)}`}
          </button>
          <p className="muted small">
            Test mode: no real payment is made. Use 4242 4242 4242 4242 to approve or
            4000 0000 0000 0002 to see a decline.
          </p>
        </form>
      </div>
    </div>
  );
}
