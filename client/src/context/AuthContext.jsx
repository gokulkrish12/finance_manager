import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on load if a token exists
  useEffect(() => {
    const token = localStorage.getItem('pfm_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('pfm_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password, mfaToken) => {
    const res = await api.post('/auth/login', { email, password, mfaToken });
    // 206 => MFA required, no token yet
    if (res.status === 206 || res.data.mfaRequired) return { mfaRequired: true };
    localStorage.setItem('pfm_token', res.data.token);
    setUser(res.data.user);
    return { ok: true };
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    localStorage.setItem('pfm_token', res.data.token);
    setUser(res.data.user);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pfm_token');
    setUser(null);
  }, []);

  // Let pages update the cached user after profile/currency changes
  const updateUser = useCallback((patch) => setUser((u) => ({ ...u, ...patch })), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
