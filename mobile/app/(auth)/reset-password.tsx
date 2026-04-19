import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { authApi } from '@/api/auth';
import { Button, ErrorBanner, Screen, TextField } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { resetPasswordSchema, type ResetPasswordValues } from '@/utils/validation';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: '', newPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!phone) {
      setSubmitError('Numero manquant, recommencez la procedure.');
      return;
    }
    setSubmitError(null);
    try {
      await authApi.resetPassword({
        phone,
        code: values.code,
        newPassword: values.newPassword,
      });
      setSuccess(true);
      setTimeout(() => router.replace('/(auth)/login'), 1500);
    } catch (err) {
      setSubmitError(apiErrorMessage(err));
    }
  });

  return (
    <Screen scrollable>
      <Text style={styles.title}>Nouveau mot de passe</Text>
      <Text style={styles.subtitle}>
        Entrez le code recu par SMS et choisissez un nouveau mot de passe.
      </Text>

      {DEMO_MODE ? (
        <View style={styles.demo}>
          <Text style={styles.demoText}>Mode demo — code OTP : 1234</Text>
        </View>
      ) : null}

      {submitError ? <ErrorBanner message={submitError} /> : null}
      {success ? <Text style={styles.info}>Mot de passe reinitialise. Redirection...</Text> : null}

      <Controller
        control={control}
        name="code"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Code"
            value={value}
            onBlur={onBlur}
            onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 4))}
            placeholder="1234"
            keyboardType="number-pad"
            maxLength={4}
            error={errors.code?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Nouveau mot de passe"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="********"
            secureTextEntry
            hint="8 caracteres min, avec majuscule, minuscule et chiffre."
            error={errors.newPassword?.message}
          />
        )}
      />

      <Button
        label="Reinitialiser"
        loading={isSubmitting}
        onPress={onSubmit}
        disabled={success}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl },
  demo: {
    backgroundColor: colors.warningBg,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  demoText: { ...typography.caption, color: colors.warning },
  info: {
    ...typography.body,
    color: colors.success,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
