import express from 'express';
import cors from 'cors';
import db from './db.js';
import { createSession, hashPassword, requireAuth, verifyPassword } from './auth.js';

const app = express();
app.use(cors());
app.use(express.json());

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(email, password) {
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return 'Please enter a valid email address.';
  }
  if (typeof password !== 'string' || password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

function getCart(userId) {
  return db
    .prepare(
      `SELECT p.id, p.name, p.price, p.emoji, c.qty
       FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ? ORDER BY p.id`
    )
    .all(userId);
}

// --- Auth ---

app.post('/api/register', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { password } = req.body;
  const error = validateCredentials(email, password);
  if (error) return res.status(400).json({ error });

  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'An account with this email already exists.' });

  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(email, hashPassword(password));
  const userId = Number(lastInsertRowid);
  res.status(201).json({ token: createSession(userId), user: { id: userId, email } });
});

app.post('/api/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { password } = req.body;
  const error = validateCredentials(email, password);
  if (error) return res.status(400).json({ error });

  const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  res.json({ token: createSession(user.id), user: { id: user.id, email: user.email } });
});

app.post('/api/logout', requireAuth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
  res.status(204).end();
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// --- Products & cart ---

app.get('/api/products', (req, res) => {
  res.json(db.prepare('SELECT id, name, price, emoji FROM products ORDER BY id').all());
});

app.get('/api/cart', requireAuth, (req, res) => {
  res.json(getCart(req.user.id));
});

// Set the quantity of one product in the cart; qty 0 removes it.
app.put('/api/cart/:productId', requireAuth, (req, res) => {
  const productId = Number(req.params.productId);
  const qty = Number(req.body.qty);
  if (!Number.isInteger(qty) || qty < 0) {
    return res.status(400).json({ error: 'Quantity must be a whole number of 0 or more.' });
  }
  const product = db.prepare('SELECT 1 FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  if (qty === 0) {
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.user.id, productId);
  } else {
    db.prepare(
      `INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, ?)
       ON CONFLICT (user_id, product_id) DO UPDATE SET qty = excluded.qty`
    ).run(req.user.id, productId, qty);
  }
  res.json(getCart(req.user.id));
});

app.delete('/api/cart', requireAuth, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json([]);
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Shop API listening on http://localhost:${PORT}`);
});
