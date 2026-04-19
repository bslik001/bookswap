type Listener = () => void;

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;
const listeners = new Set<Listener>();

export const authStore = {
  getAccessToken(): string | null {
    return accessToken;
  },
  setAccessToken(token: string | null): void {
    accessToken = token;
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setSessionExpiredHandler(handler: (() => void) | null): void {
    onSessionExpired = handler;
  },
  notifySessionExpired(): void {
    onSessionExpired?.();
  },
};
