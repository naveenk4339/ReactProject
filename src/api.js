const TOKEN_KEY = 'shop_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`);
    error.fields = data.fields;
    throw error;
  }
  return data;
}

export const api = {
  register: (email, password) => request('/register', { method: 'POST', body: { email, password } }),
  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/logout', { method: 'POST' }),
  me: () => request('/me'),
  products: () => request('/products'),
  cart: () => request('/cart'),
  setQty: (productId, qty) => request(`/cart/${productId}`, { method: 'PUT', body: { qty } }),
  clearCart: () => request('/cart', { method: 'DELETE' }),
  checkout: (card) => request('/checkout', { method: 'POST', body: { card } }),
  order: (orderId) => request(`/orders/${encodeURIComponent(orderId)}`),
};
