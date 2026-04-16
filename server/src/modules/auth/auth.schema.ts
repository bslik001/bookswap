import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caracteres').max(100),
  lastName: z.string().min(2, 'Minimum 2 caracteres').max(100),
  email: z.string().email('Format d\'email invalide'),
  password: z.string()
    .min(8, 'Minimum 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Doit contenir majuscule, minuscule et chiffre'
    ),
  phone: z.string().min(8, 'Minimum 8 caracteres').max(20),
  address: z.string().min(5, 'Minimum 5 caracteres').max(500),
  gradeInterests: z.array(z.string()).min(1, 'Selectionnez au moins un niveau'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(4, 'Le code doit contenir 4 chiffres'),
});

export const resendOtpSchema = z.object({
  phone: z.string().min(8).max(20),
});

export const loginSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requis'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string()
    .min(8, 'Minimum 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Doit contenir majuscule, minuscule et chiffre'
    ),
});

export const forgotPasswordSchema = z.object({
  phone: z.string().min(8).max(20),
});

export const resetPasswordSchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(4, 'Le code doit contenir 4 chiffres'),
  newPassword: z.string()
    .min(8, 'Minimum 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Doit contenir majuscule, minuscule et chiffre'
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
