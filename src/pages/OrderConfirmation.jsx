import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api.js';

const formatPrice = (value) => `$${value.toFixed(2)}`;

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const location = useLocation();
  // Use the order passed from checkout; otherwise (e.g. after a reload) load it.
  const [order, setOrder] = useState(location.state?.order ?? null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (order) return;
    api.order(orderId).then(setOrder).catch((err) => setError(err.message));
  }, [order, orderId]);

  if (!order) return <p className="loading">{error || 'Loading…'}</p>;

  return (
    <div className="page-center">
      <div className="card confirmation">
        <div className="approved-badge">✓ Payment approved</div>
        <p className="approved-amount">{formatPrice(order.totalAmount)}</p>
        <dl className="order-meta">
          <div><dt>Order ID</dt><dd>{order.id}</dd></div>
          <div><dt>Total items</dt><dd>{order.totalItems}</dd></div>
          <div><dt>Paid with</dt><dd>{order.card.brand} ending {order.card.last4}</dd></div>
        </dl>
        <ul className="cart-lines">
          {order.items.map((item) => (
            <li key={item.productId}>
              <span>{item.name} × {item.qty}</span>
              <span>{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="totals">
          <div><span>Total items</span><strong>{order.totalItems}</strong></div>
          <div><span>Approved amount</span><strong>{formatPrice(order.totalAmount)}</strong></div>
        </div>
        <Link className="btn primary" to="/home">Continue shopping</Link>
      </div>
    </div>
  );
}
