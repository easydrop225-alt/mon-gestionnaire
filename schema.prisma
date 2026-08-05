'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, saveTokens, clearTokens, getAccessToken, isSuperAdmin as readIsSuperAdmin } from './api-client';

interface AuthContextValue {
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message: string; isSuperAdmin: boolean }>;
  register: (params: {
    tenantName: string; email: string; password: string; firstName: string; lastName: string; phone?: string;
  }) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdminState, setIsSuperAdminState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsAuthenticated(!!getAccessToken());
    setIsSuperAdminState(readIsSuperAdmin());
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const { ok, body } = await apiFetch<{ accessToken: string; refreshToken: string; isSuperAdmin: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (ok && body.data) {
      const superAdmin = !!body.data.isSuperAdmin;
      saveTokens(body.data.accessToken, body.data.refreshToken, superAdmin);
      setIsAuthenticated(true);
      setIsSuperAdminState(superAdmin);
      return { ok: true, message: 'Connecté avec succès.', isSuperAdmin: superAdmin };
    }
    return { ok: false, message: body.message ?? 'Identifiants invalides.', isSuperAdmin: false };
  }

  async function register(params: {
    tenantName: string; email: string; password: string; firstName: string; lastName: string; phone?: string;
  }) {
    const { ok, body } = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(params) });
    return { ok, message: body.message ?? (ok ? 'Compte créé.' : 'Une erreur est survenue.') };
  }

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    clearTokens();
    setIsAuthenticated(false);
    setIsSuperAdminState(false);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isSuperAdmin: isSuperAdminState, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>');
  return ctx;
}
