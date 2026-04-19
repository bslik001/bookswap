import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const passwordRules = z
  .string()
  .min(8, 'Minimum 8 caracteres')
  .regex(passwordRegex, 'Doit contenir majuscule, minuscule et chiffre');

export const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caracteres').max(100),
  lastName: z.string().min(2, 'Minimum 2 caracteres').max(100),
  email: z.string().email("Format d'email invalide"),
  password: passwordRules,
  phone: z.string().min(8, 'Minimum 8 caracteres').max(20),
  address: z.string().min(5, 'Minimum 5 caracteres').max(500),
  gradeInterests: z.array(z.string()).min(1, 'Selectionnez au moins un niveau'),
});

export const verifyOtpSchema = z.object({
  code: z.string().length(4, 'Le code doit contenir 4 chiffres'),
});

export const forgotPasswordSchema = z.object({
  phone: z.string().min(8, 'Minimum 8 caracteres').max(20),
});

export const resetPasswordSchema = z.object({
  code: z.string().length(4, 'Le code doit contenir 4 chiffres'),
  newPassword: passwordRules,
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caracteres').max(100),
  lastName: z.string().min(2, 'Minimum 2 caracteres').max(100),
  phone: z.string().min(8, 'Minimum 8 caracteres').max(20),
  address: z.string().min(5, 'Minimum 5 caracteres').max(500),
  gradeInterests: z.array(z.string()).min(1, 'Selectionnez au moins un niveau'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, 'Confirmation requise'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les mots de passe ne correspondent pas',
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Mot de passe requis'),
});

export const createBookSchema = z.object({
  title: z.string().min(2, 'Minimum 2 caracteres').max(255),
  author: z.string().max(255).optional().or(z.literal('')),
  grade: z.string().min(1, 'Niveau requis').max(100),
  className: z.string().max(100).optional().or(z.literal('')),
  condition: z.enum(['NEW', 'USED'], { message: 'Etat requis' }),
  description: z.string().max(2000).optional().or(z.literal('')),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type CreateBookValues = z.infer<typeof createBookSchema>;
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;
