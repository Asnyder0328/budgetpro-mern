import React, { createContext, useContext, useState } from 'react';
import { api } from '../utils/api';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('bp_user') || 'null'));
  const save = (d) => { localStorage.setItem('bp_token', d.token); localStorage.setItem('bp_user', JSON.stringify(d.user)); setUser(d.user); };
  const login = async (email, password) => save(await api('/auth/login', { method: 'POST', body: { email, password } }));
  const register = async (name, email, password) => save(await api('/auth/register', { method: 'POST', body: { name, email, password } }));
  const logout = () => { localStorage.clear(); setUser(null); };
  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>;
}
