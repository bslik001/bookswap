import * as SecureStore from 'expo-secure-store';

const REFRESH_KEY = 'bookswap.refreshToken';

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
};
