import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); const [form, setForm] = useState({ name: '', email: 'demo@budgetpro.app', password: 'demo1234' }); const [err, setErr] = useState('');
  const submit = async (e) => { e.preventDefault(); setErr(''); try { mode === 'login' ? await login(form.email, form.password) : await register(form.name, form.email, form.password); } catch (ex) { setErr(ex.message); } };
  return (<div className="center"><form className="card auth" onSubmit={submit}>
    <h1>💰 BudgetPro</h1><p className="muted">Advanced budgeting — budgets, goals, forecasts, recurring.</p>
    {mode === 'register' && <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />}
    <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
    <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
    {err && <p className="error">{err}</p>}
    <button className="primary">{mode === 'login' ? 'Log in' : 'Create account'}</button>
    <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'No account? Register' : 'Have an account? Log in'}</button>
    <p className="muted small">Demo seed: demo@budgetpro.app / demo1234 (run <code>npm run seed</code>)</p>
  </form></div>);
}
