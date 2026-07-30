import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Inject Sanctum Auth token
    const token = localStorage.getItem('rf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Inject active tenant slug
    const tenantSlug = localStorage.getItem('rf_tenant_slug');
    if (tenantSlug) {
      config.headers['X-Tenant-Slug'] = tenantSlug;
    }
  }
  return config;
});

export default api;
