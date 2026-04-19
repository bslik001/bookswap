import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, type RegisterPayload } from '@/api/auth';
import { authStore } from './authStore';
import { tokenStorage } from './tokenStorage';
import type { LoginResult, User } from '@/types/user';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const applySession = useCallback(async (result: LoginResult) => {
    authStore.setAccessToken(result.accessToken);
    await tokenStorage.setRefresh(result.refreshToken);
    await tokenStorage.setUser(result.user);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(async () => {
    authStore.setAccessToken(null);
    await tokenStorage.clearRefresh();
    await tokenStorage.clearUser();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Bootstrap : on a un refresh token + un user en cache → on tente un refresh
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [refresh, cachedUser] = await Promise.all([
        tokenStorage.getRefresh(),
        tokenStorage.getUser(),
      ]);
      if (!refresh || !cachedUser) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      // Tente de rafraichir l'access via le client (qui gere le mutex)
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error('refresh failed');
        authStore.setAccessToken(json.data.accessToken);
        await tokenStorage.setRefresh(json.data.refreshToken);
        if (!cancelled) {
          setUser(cachedUser);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) {
          await tokenStorage.clearRefresh();
          await tokenStorage.clearUser();
          setStatus('unauthenticated');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Si le client signale une session expiree, on nettoie l'etat React
  useEffect(() => {
    authStore.setSessionExpiredHandler(() => {
      setUser(null);
      setStatus('unauthenticated');
    });
    return () => authStore.setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login({ email, password });
      await applySession(result);
    },
    [applySession],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    await authApi.register(payload);
  }, []);

  const verifyOtp = useCallback(
    async (phone: string, code: string) => {
      const result = await authApi.verifyOtp({ phone, code });
      await applySession(result);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const refresh = await tokenStorage.getRefresh();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        // On ignore : nettoyage local prioritaire
      }
    }
    await clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, verifyOtp, logout }),
    [status, user, login, register, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit etre utilise dans un AuthProvider');
  return ctx;
}
