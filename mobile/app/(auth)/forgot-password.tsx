import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import { authApi } from '@/api/auth';
import { Button, ErrorBanner, Screen, TextField } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await authApi.forgotPassword({ phone: values.phone.trim() });
      router.push({ pathname: '/(auth)/reset-password', params: { phone: values.phone.trim() } });
    } catch (err) {
      setSubmitError(apiErrorMessage(err));
    }
  });

  return (
    <Screen scrollable>
      <Text style={styles.title}>Mot de passe oublie</Text>
      <Text style={styles.subtitle}>
        Indiquez votre numero pour recevoir un code de reinitialisation par SMS.
      </Text>

      {submitError ? <ErrorBanner message={submitError} /> : null}

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Telephone"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="+221 77 123 45 67"
            keyboardType="phone-pad"
            error={errors.phone?.message}
          />
        )}
      />

      <Button label="Envoyer le code" loading={isSubmitting} onPress={onSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl },
});
