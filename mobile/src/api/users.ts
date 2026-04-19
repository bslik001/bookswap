import { api } from './client';
import type { User } from '@/types/user';

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  gradeInterests?: string[];
};

export const usersApi = {
  getMe: () => api.get<User>('/users/me'),
  updateMe: (payload: UpdateProfilePayload) => api.put<User>('/users/me', payload),
  deleteMe: (password: string) =>
    api.delete<{ message: string }>('/users/me', { body: { password } }),
};
