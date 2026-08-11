'use client';

/**
 * Client API central : ajoute automatiquement le token d'accès, gère le
 * rafraîchissement automatique en cas d'expiration (401), et centralise
 * la lecture du format de réponse standard { success, message, data, errors }.
 */

const ACCESS_TOKEN_KEY = 'mg_access_token';
const REFRESH_TOKEN_KEY = 'mg_refresh_token';
const IS_SUPER_ADMIN_KEY = 'mg_is_super_admin';

export function saveTokens(accessToken: string, refreshToken: string, isSuperAdmin = false) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(IS_SUPER_ADMIN_KEY, isSuperAdmin ? '1' : '0');
}

export function isSuperAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(IS_SUPER_ADMIN_KEY) === '1';
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(IS_SUPER_ADMIN_KEY);
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors: { field: string | null; message: string }[] | null;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;

  const json: ApiResponse<{ accessToken: string }> = await res.json();
  if (!json.success) return null;

  localStorage.setItem(ACCESS_TOKEN_KEY, json.data.accessToken);
  return json.data.accessToken;
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<{ ok: boolean; status: number; body: ApiResponse<T> }> {
  const doFetch = async (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`/api/v1${path}`, { ...options, headers });
  };

  try {
    let token = getAccessToken();
    let res = await doFetch(token);

    // Le token a expiré (15 min) -> on tente un rafraîchissement automatique une fois.
    if (res.status === 401 && getRefreshToken()) {
      token = await refreshAccessToken();
      if (token) res = await doFetch(token);
    }

    const body: ApiResponse<T> = await res.json().catch(() => ({
      success: false,
      message: 'Réponse invalide du serveur.',
      data: null as any,
      errors: null,
    }));

    return { ok: res.ok && body.success, status: res.status, body };
  } catch (err: any) {
    // Échec réseau (serveur injoignable, CORS, etc.) — jamais d'exception non
    // gérée ici, pour que les écrans appelants puissent toujours sortir de
    // leur état "chargement" au lieu de rester bloqués indéfiniment.
    return {
      ok: false,
      status: 0,
      body: {
        success: false,
        message: `Impossible de contacter le serveur (${err?.message ?? 'erreur réseau'}).`,
        data: null as any,
        errors: null,
      },
    };
  }
}
