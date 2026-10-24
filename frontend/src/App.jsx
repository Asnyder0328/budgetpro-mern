import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import { Dashboard, Transactions, Budgets, Goals, Accounts, Insights } from './pages/Pages';

export default function App() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('dashboard');
  if (!user) return <Login />;
  const pages = { dashboard: <Dashboard />, insights: <Insights />, transactions: <Transactions />, budgets: <Budgets />, goals: <Goals />, accounts: <Accounts /> };
  return (<div className="layout">
    <aside>
      <h2>💰 BudgetPro</h2>
      {Object.keys(pages).map(p => <button key={p} className={page === p ? 'nav active' : 'nav'} onClick={() => setPage(p)}>{p[0].toUpperCase() + p.slice(1)}</button>)}
      <div className="sidefoot"><p>{user.name}<br /><span className="muted">{user.email}</span></p><button onClick={logout}>Log out</button></div>
    </aside>
    <main>{pages[page]}</main>
  </div>);
}
