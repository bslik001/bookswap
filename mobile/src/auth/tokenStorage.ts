import * as SecureStore from 'expo-secure-store';
import type { User } from '@/types/user';

const REFRESH_KEY = 'bookswap.refreshToken';
const USER_KEY = 'bookswap.user';

export const tokenStorage = {
  async getRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async setRefresh(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_KEY, token);
  },
  async clearRefresh(): Promise<void> {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
  async getUser(): Promise<User | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  async setUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  async clearUser(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
