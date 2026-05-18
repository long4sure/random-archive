import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bizlerp_user')); } catch { return null; }
  });

  const login = async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password });
    localStorage.setItem('bizlerp_token', token);
    localStorage.setItem('bizlerp_user', JSON.stringify(user));
    setUser(user);
  };

  const register = async (name, email, password) => {
    const { token, user } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('bizlerp_token', token);
    localStorage.setItem('bizlerp_user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('bizlerp_token');
    localStorage.removeItem('bizlerp_user');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
