import axios from 'axios';

// Base URL: use VITE_API_URL if set, otherwise rely on the Vite dev proxy (/api).
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
});

// Attach the JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pfm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, drop the session and bounce to login (unless we're already there)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('pfm_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
