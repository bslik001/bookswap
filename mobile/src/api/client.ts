import { authStore } from '@/auth/authStore';
import { tokenStorage } from '@/auth/tokenStorage';
import { ApiError, type ApiResponse } from '@/types/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL manquant — verifier mobile/.env');
}

let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const refresh = await tokenStorage.getRefresh();
  if (!refresh) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    const json = (await res.json()) as ApiResponse<{ accessToken: string; refreshToken: string }>;
    if (!res.ok || !json.success) return false;

    authStore.setAccessToken(json.data.accessToken);
    await tokenStorage.setRefresh(json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function refreshTokensSafely(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
};

async function rawFetch<T>(path: string, options: RequestOptions): Promise<T> {
  const { body, skipAuth, headers, ...rest } = options;
  const access = skipAuth ? null : authStore.getAccessToken();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string> | undefined),
  };
  if (access) finalHeaders.Authorization = `Bearer ${access}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body:
      body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !json || !json.success) {
    const code = json && !json.success ? json.error.code : 'UNKNOWN_ERROR';
    const message = json && !json.success ? json.error.message : `HTTP ${res.status}`;
    const details = json && !json.success ? json.error.details : undefined;
    throw new ApiError(code, message, res.status, details);
  }

  return json.data;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawFetch<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !options.skipAuth) {
      const ok = await refreshTokensSafely();
      if (!ok) {
        authStore.setAccessToken(null);
        await tokenStorage.clearRefresh();
        authStore.notifySessionExpired();
        throw new ApiError('SESSION_EXPIRED', 'Session expiree, veuillez vous reconnecter', 401);
      }
      return await rawFetch<T>(path, options);
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};
