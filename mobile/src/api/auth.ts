import { api } from './client';
import type { LoginResult, User } from '@/types/user';

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  gradeInterests: string[];
};

export type RegisterResult = Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>;

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<RegisterResult>('/auth/register', payload, { skipAuth: true }),

  verifyOtp: (payload: { phone: string; code: string }) =>
    api.post<LoginResult>('/auth/verify-otp', payload, { skipAuth: true }),

  resendOtp: (payload: { phone: string }) =>
    api.post<{ message: string }>('/auth/resend-otp', payload, { skipAuth: true }),

  login: (payload: { email: string; password: string }) =>
    api.post<LoginResult>('/auth/login', payload, { skipAuth: true }),

  logout: (refreshToken: string) =>
    api.post<{ message: string }>('/auth/logout', { refreshToken }),

  forgotPassword: (payload: { phone: string }) =>
    api.post<{ message: string }>('/auth/forgot-password', payload, { skipAuth: true }),

  resetPassword: (payload: { phone: string; code: string; newPassword: string }) =>
    api.post<{ message: string }>('/auth/reset-password', payload, { skipAuth: true }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.put<{ message: string }>('/auth/change-password', payload),
};
