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
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(async () => {
    authStore.setAccessToken(null);
    await tokenStorage.clearRefresh();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Bootstrap : on essaie de refresh si on a un refresh token persiste
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refresh = await tokenStorage.getRefresh();
      if (!refresh) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      // Le client se charge du refresh ; on tente un endpoint /me a venir.
      // En attendant, on considere qu'avoir un refresh = session a confirmer
      // au premier appel API. On force "unauthenticated" sans user pour que
      // le user se reconnecte. Phase 3 ajoutera /auth/me ou un GET initial.
      authStore.setAccessToken(null);
      if (!cancelled) setStatus('unauthenticated');
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
