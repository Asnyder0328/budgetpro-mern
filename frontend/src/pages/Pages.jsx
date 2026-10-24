import React, { useEffect, useState } from 'react';
import { api, fmt, currentMonth } from '../utils/api';
import { Donut, Bars, Progress, AreaChart, StackedBars } from '../components/Charts';

export function Dashboard() {
  const [s, setS] = useState(null); const [bd, setBd] = useState([]); const [trend, setTrend] = useState(null); const [budgets, setBudgets] = useState([]); const [goals, setGoals] = useState([]); const [accounts, setAccounts] = useState(null); const [nw, setNw] = useState([]); const [ct, setCt] = useState(null);
  useEffect(() => { (async () => {
    setS(await api('/analytics/summary')); setBd(await api('/analytics/category-breakdown'));
    setTrend(await api('/analytics/monthly-trend?months=6')); setBudgets((await api(`/budgets?month=${currentMonth()}`)).budgets);
    setGoals(await api('/goals')); setAccounts(await api('/accounts'));
    setNw(await api('/analytics/net-worth-trend?months=6')); setCt(await api('/analytics/category-trend?months=6'));
  })(); }, []);
  if (!s || !trend || !accounts) return <p>Loading dashboard…</p>;
  return (<div>
    <div className="grid stats">
      <div className="card"><span>Net Worth</span><strong>{fmt(accounts.netWorth)}</strong><small>{accounts.accounts.length} accounts</small></div>
      <div className="card"><span>Income · {s.month}</span><strong className="green">{fmt(s.income)}</strong><small>{s.changes.income ?? '—'}% vs last month</small></div>
      <div className="card"><span>Expenses · {s.month}</span><strong className="red">{fmt(s.expenses)}</strong><small>{s.changes.expenses ?? '—'}% vs last month</small></div>
      <div className="card"><span>Savings Rate</span><strong>{s.savingsRate}%</strong><small>Net {fmt(s.net)} this month</small></div>
    </div>
    <div className="grid two">
      <div className="card"><h3>Cash Flow — Last 6 Months</h3><Bars trend={trend.trend} /><p className="muted small">🟢 Income &nbsp; 🟣 Expenses</p>
        <p><b>Forecast next month:</b> income {fmt(trend.forecast.income)} · expenses {fmt(trend.forecast.expenses)} · net <b className={trend.forecast.net >= 0 ? 'green' : 'red'}>{fmt(trend.forecast.net)}</b></p></div>
      <div className="card"><h3>Spending by Category</h3><div style={{ display: 'flex', gap: 16, alignItems: 'center' }}><Donut data={bd} /><ul className="plain">{bd.slice(0, 6).map(d => <li key={d.category}>{d.category}: <b>{fmt(d.total)}</b> ({d.percent}%)</li>)}</ul></div></div>
    </div>
    <div className="grid two">
      <div className="card"><h3>Net Worth Trend</h3><AreaChart data={nw} /></div>
      <div className="card"><h3>Spending Mix — Stacked by Category</h3>{ct && <StackedBars categories={ct.categories} series={ct.series} />}</div>
    </div>
    <div className="grid two">
      <div className="card"><h3>Budget Health</h3>{budgets.length === 0 && <p className="muted">No budgets this month — add some in Budgets.</p>}
        {budgets.slice(0, 6).map(b => <div key={b._id} style={{ marginBottom: 12 }}><div className="row"><span>{b.category}</span><span>{fmt(b.spent)} / {fmt(b.limit)} · {b.percent}% {b.status === 'over' ? '🔴' : b.status === 'warning' ? '🟠' : '🟢'}</span></div><Progress percent={b.percent} status={b.status} /></div>)}</div>
      <div className="card"><h3>Savings Goals</h3>{goals.map(g => <div key={g._id} style={{ marginBottom: 12 }}><div className="row"><span>{g.icon} {g.name}</span><span>{fmt(g.currentAmount)} / {fmt(g.targetAmount)}</span></div><Progress percent={g.progress} status="on-track" /></div>)}</div>
    </div>
  </div>);
}

export function Transactions() {
  const [items, setItems] = useState([]); const [accounts, setAccounts] = useState([]); const [cats, setCats] = useState([]);
  const [search, setSearch] = useState(''); const [type, setType] = useState('');
  const [form, setForm] = useState({ type: 'expense', category: 'Groceries', amount: '', description: '', merchant: '' });
  const load = async () => { const q = new URLSearchParams({ ...(search ? { search } : {}), ...(type ? { type } : {}), limit: 100 }); setItems((await api(`/transactions?${q}`)).items); };
  useEffect(() => { load(); api('/accounts').then(d => { setAccounts(d.accounts); if (d.accounts[0]) setForm(f => ({ ...f, account: d.accounts[0]._id })); }); api('/categories').then(setCats); }, [search, type]);
  const add = async (e) => { e.preventDefault(); await api('/transactions', { method: 'POST', body: { ...form, amount: Number(form.amount), date: new Date() } }); setForm({ ...form, amount: '', description: '', merchant: '' }); load(); };
  const del = async (id) => { await api(`/transactions/${id}`, { method: 'DELETE' }); load(); };
  const exportCsv = () => { const t = localStorage.getItem('bp_token'); fetch('/api/transactions/export/csv', { headers: { Authorization: `Bearer ${t}` } }).then(r => r.blob()).then(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'transactions.csv'; a.click(); }); };
  return (<div><div className="card"><h3>Add Transaction</h3><form className="inline" onSubmit={add}>
    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select>
    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{cats.filter(c => form.type === 'income' ? c.type !== 'expense' : c.type !== 'income').map(c => <option key={c._id}>{c.name}</option>)}</select>
    <select value={form.account || ''} onChange={e => setForm({ ...form, account: e.target.value })}>{accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}</select>
    <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
    <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
    <input placeholder="Merchant" value={form.merchant} onChange={e => setForm({ ...form, merchant: e.target.value })} />
    <button className="primary">Add</button></form></div>
    <div className="card"><div className="row"><h3>Transactions</h3><span><input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} /> <select value={type} onChange={e => setType(e.target.value)}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select> <button onClick={exportCsv}>Export CSV</button></span></div>
    <table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Merchant</th><th>Amount</th><th></th></tr></thead><tbody>
      {items.map(t => <tr key={t._id}><td>{new Date(t.date).toLocaleDateString()}</td><td>{t.category}</td><td>{t.description}</td><td>{t.merchant}</td><td className={t.type === 'income' ? 'green' : 'red'}>{t.type === 'income' ? '+' : '−'}{fmt(t.amount)}</td><td><button onClick={() => del(t._id)}>✕</button></td></tr>)}
    </tbody></table></div></div>);
}

export function Budgets() {
  const [month, setMonth] = useState(currentMonth()); const [data, setData] = useState(null); const [cats, setCats] = useState([]);
  const [form, setForm] = useState({ category: 'Groceries', limit: '' });
  const load = () => api(`/budgets?month=${month}`).then(setData);
  useEffect(() => { load(); api('/categories').then(c => setCats(c.filter(x => x.type !== 'income'))); }, [month]);
  const add = async (e) => { e.preventDefault(); await api('/budgets', { method: 'POST', body: { category: form.category, month, limit: Number(form.limit) } }); load(); };
  const copy = async () => { const prev = new Date(month + '-02'); prev.setMonth(prev.getMonth() - 1); const from = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`; await api('/budgets/copy', { method: 'POST', body: { fromMonth: from, toMonth: month } }); load(); };
  if (!data) return <p>Loading…</p>;
  return (<div className="card"><div className="row"><h3>Budgets</h3><span><input type="month" value={month} onChange={e => setMonth(e.target.value)} /> <button onClick={copy}>Copy last month</button></span></div>
    <p>Total: <b>{fmt(data.totals.spent)}</b> spent of <b>{fmt(data.totals.limit)}</b> budgeted · <b>{fmt(data.totals.remaining)}</b> remaining</p>
    <form className="inline" onSubmit={add}><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{cats.map(c => <option key={c._id}>{c.name}</option>)}</select><input type="number" placeholder="Monthly limit $" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} required /><button className="primary">Set budget</button></form>
    {data.budgets.map(b => <div key={b._id} style={{ margin: '16px 0' }}><div className="row"><b>{b.category}</b><span>{fmt(b.spent)} / {fmt(b.limit)} — {b.percent}% · projected {fmt(b.projected)} {b.status === 'over' ? '🔴 Over budget' : b.status === 'warning' ? '🟠 Warning (80%+)' : '🟢 On track'}</span></div><Progress percent={b.percent} status={b.status} /></div>)}
  </div>);
}

export function Goals() {
  const [goals, setGoals] = useState([]); const [form, setForm] = useState({ name: '', targetAmount: '', icon: '🎯' }); const [amt, setAmt] = useState({});
  const load = () => api('/goals').then(setGoals); useEffect(load, []);
  const add = async (e) => { e.preventDefault(); await api('/goals', { method: 'POST', body: { ...form, targetAmount: Number(form.targetAmount) } }); setForm({ name: '', targetAmount: '', icon: '🎯' }); load(); };
  const contribute = async (id) => { await api(`/goals/${id}/contribute`, { method: 'POST', body: { amount: Number(amt[id] || 0) } }); load(); };
  return (<div><div className="card"><h3>New Goal</h3><form className="inline" onSubmit={add}><input placeholder="Icon" style={{ width: 60 }} value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} /><input placeholder="Goal name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /><input type="number" placeholder="Target $" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} required /><button className="primary">Create</button></form></div>
    <div className="grid two">{goals.map(g => <div className="card" key={g._id}><div className="row"><h3>{g.icon} {g.name} {g.isCompleted && '✅'}</h3><span className="badge">{g.priority}</span></div>
      <p>{fmt(g.currentAmount)} of {fmt(g.targetAmount)} — <b>{g.progress}%</b>{g.etaMonths != null && !g.isCompleted && <span className="muted"> · ETA ~{g.etaMonths} mo at $200/mo</span>}</p><Progress percent={g.progress} status="on-track" />
      {!g.isCompleted && <div className="inline" style={{ marginTop: 10 }}><input type="number" placeholder="Contribute $" value={amt[g._id] || ''} onChange={e => setAmt({ ...amt, [g._id]: e.target.value })} /><button onClick={() => contribute(g._id)}>Add</button></div>}
    </div>)}</div></div>);
}

export function Accounts() {
  const [data, setData] = useState(null); const [form, setForm] = useState({ name: '', type: 'checking', startingBalance: '' });
  const load = () => api('/accounts').then(setData); useEffect(load, []);
  const add = async (e) => { e.preventDefault(); await api('/accounts', { method: 'POST', body: { ...form, startingBalance: Number(form.startingBalance || 0) } }); setForm({ name: '', type: 'checking', startingBalance: '' }); load(); };
  if (!data) return <p>Loading…</p>;
  return (<div><div className="card"><h3>Add Account</h3><form className="inline" onSubmit={add}><input placeholder="Account name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>checking</option><option>savings</option><option>credit</option><option>cash</option><option>investment</option></select><input type="number" placeholder="Starting balance" value={form.startingBalance} onChange={e => setForm({ ...form, startingBalance: e.target.value })} /><button className="primary">Add</button></form></div>
    <p>Net worth: <b>{fmt(data.netWorth)}</b></p>
    <div className="grid stats">{data.accounts.map(a => <div className="card" key={a._id}><span>{a.type} · {a.institution || ''}</span><strong>{fmt(a.balance)}</strong><small>{a.name}</small></div>)}</div></div>);
}

export function Insights() {
  const [data, setData] = useState(null); const [merchants, setMerchants] = useState([]); const [bva, setBva] = useState([]);
  useEffect(() => { (async () => { setData(await api('/analytics/insights')); setMerchants(await api('/analytics/top-merchants')); setBva(await api('/analytics/budget-vs-actual')); })(); }, []);
  if (!data) return <p>Loading insights…</p>;
  const border = { positive: '#22c55e', warning: '#f59e0b', info: '#6366f1' };
  return (<div>
    <div className="card"><h3>💡 Money Insights — {data.month}</h3><p className="muted">Auto-generated from your transactions: savings rate, spending pace, category movers, 50/30/20 check.</p></div>
    <div className="grid two">{data.insights.map((ins, i) => <div className="card" key={i} style={{ borderLeft: `5px solid ${border[ins.type] || '#6366f1'}` }}><h3 style={{ marginTop: 0 }}>{ins.icon} {ins.title}</h3><p className="muted" style={{ marginBottom: 0 }}>{ins.detail}</p></div>)}</div>
    <div className="grid two">
      <div className="card"><h3>Top Merchants</h3>{merchants.map(m => <div className="row" key={m.merchant}><span>{m.merchant} <span className="muted">×{m.count}</span></span><b>{fmt(m.total)}</b></div>)}</div>
      <div className="card"><h3>Budget vs Actual</h3>{bva.map(b => <div key={b.category} style={{ marginBottom: 10 }}><div className="row"><span>{b.category}</span><span>{fmt(b.spent)} / {fmt(b.limit)} · {b.percent}%</span></div><Progress percent={b.percent} status={b.status} /></div>)}</div>
    </div>
  </div>);
}
