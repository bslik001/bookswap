import { ApiError } from '@/types/api';

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  ACCOUNT_INACTIVE: 'Compte non active. Verifiez votre numero de telephone.',
  CONFLICT: 'Cet email ou ce numero est deja utilise.',
  INVALID_OTP: 'Code OTP incorrect.',
  OTP_EXPIRED: 'Le code a expire, demandez-en un nouveau.',
  TOO_MANY_ATTEMPTS: 'Trop de tentatives, demandez un nouveau code.',
  COOLDOWN: 'Veuillez patienter quelques secondes avant de reessayer.',
  RATE_LIMITED: 'Trop de demandes, reessayez plus tard.',
  SESSION_EXPIRED: 'Session expiree, veuillez vous reconnecter.',
  VALIDATION_ERROR: 'Donnees invalides, verifiez les champs.',
  NOT_FOUND: 'Ressource introuvable.',
};

export function apiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (error instanceof ApiError) {
    return MESSAGES[error.code] ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
