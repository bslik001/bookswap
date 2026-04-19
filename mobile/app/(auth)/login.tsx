import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { Button, ErrorBanner, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/auth/AuthContext';
import { colors, spacing, typography } from '@/theme';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { loginSchema, type LoginValues } from '@/utils/validation';

export default function LoginScreen() {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await login(values.email.trim().toLowerCase(), values.password);
    } catch (err) {
      setSubmitError(apiErrorMessage(err));
    }
  });

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>BookSwap</Text>
        <Text style={styles.subtitle}>Connexion a votre compte</Text>
      </View>

      {submitError ? <ErrorBanner message={submitError} /> : null}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="exemple@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Mot de passe"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="********"
            secureTextEntry
            autoComplete="password"
            error={errors.password?.message}
          />
        )}
      />

      <Button label="Se connecter" loading={isSubmitting} onPress={onSubmit} />

      <View style={styles.links}>
        <Link href="/(auth)/forgot-password" style={styles.link}>
          Mot de passe oublie ?
        </Link>
        <View style={styles.row}>
          <Text style={styles.muted}>Pas de compte ? </Text>
          <Link href="/(auth)/register" style={styles.link}>
            Creer un compte
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.display,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  links: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  link: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  muted: { ...typography.body, color: colors.textMuted },
});
