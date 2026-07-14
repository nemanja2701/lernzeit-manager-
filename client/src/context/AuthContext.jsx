import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken, getToken } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => { setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  // api.js feuert das Event, wenn der Server 401 zurückgibt
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('lzm-unauthorized', handler);
    return () => window.removeEventListener('lzm-unauthorized', handler);
  }, []);

  const login = useCallback(async (username, password) => {
    const { token, user } = await api.login({ username, password });
    setToken(token);
    setUser(user);
  }, []);

  // TODO: Passwort-vergessen fehlt noch. Braucht Mailversand, deshalb erstmal raus.
  const register = useCallback(async (username, password) => {
    const { token, user } = await api.register({ username, password });
    setToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
