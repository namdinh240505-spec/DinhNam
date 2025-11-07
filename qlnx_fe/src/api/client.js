// api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('auth_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default api;
