import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { usersApi, type UpdateProfilePayload } from '@/api/users';
import { useAuth } from '@/auth/AuthContext';

export function useMe() {
  const { user, updateUser } = useAuth();
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const fresh = await usersApi.getMe();
      await updateUser(fresh);
      return fresh;
    },
    initialData: user ?? undefined,
  });
}

export function useUpdateProfile() {
  const { updateUser } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersApi.updateMe(payload),
    onSuccess: async (next) => {
      await updateUser(next);
      qc.setQueryData(['users', 'me'], next);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(payload),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password: string) => usersApi.deleteMe(password),
  });
}
