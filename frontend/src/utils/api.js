const API = import.meta.env.VITE_API_URL || '/api';
export async function api(path, opts = {}) {
  const token = localStorage.getItem('bp_token');
  const r = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  if (r.status === 401) { localStorage.removeItem('bp_token'); localStorage.removeItem('bp_user'); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || 'Request failed');
  return data;
}
export const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
export const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
