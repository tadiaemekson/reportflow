import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
  tenantSlug: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, tenant: Tenant, tenantSlug: string) => void;
  logout: () => void;
  setTenantSlug: (slug: string) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  tenant: null,
  tenantSlug: null,
  isAuthenticated: false,

  login: (token, user, tenant, tenantSlug) => {
    localStorage.setItem('rf_token', token);
    localStorage.setItem('rf_tenant_slug', tenantSlug);
    localStorage.setItem('rf_user', JSON.stringify(user));
    localStorage.setItem('rf_tenant', JSON.stringify(tenant));
    set({ token, user, tenant, tenantSlug, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('rf_token');
    localStorage.removeItem('rf_tenant_slug');
    localStorage.removeItem('rf_user');
    localStorage.removeItem('rf_tenant');
    set({ token: null, user: null, tenant: null, tenantSlug: null, isAuthenticated: false });
  },

  setTenantSlug: (tenantSlug) => {
    localStorage.setItem('rf_tenant_slug', tenantSlug);
    set({ tenantSlug });
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('rf_token');
      const tenantSlug = localStorage.getItem('rf_tenant_slug');
      const userStr = localStorage.getItem('rf_user');
      const tenantStr = localStorage.getItem('rf_tenant');

      if (token && userStr && tenantStr) {
        set({
          token,
          tenantSlug,
          user: JSON.parse(userStr),
          tenant: JSON.parse(tenantStr),
          isAuthenticated: true,
        });
      } else if (tenantSlug) {
        set({ tenantSlug });
      }
    }
  },
}));
