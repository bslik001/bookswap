import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';

export default function AppLayout() {
  const { status } = useAuth();

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
