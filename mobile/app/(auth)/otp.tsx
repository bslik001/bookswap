import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { authApi } from '@/api/auth';
import { useAuth } from '@/auth/AuthContext';
import { Button, ErrorBanner, Screen, TextField } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { verifyOtpSchema, type VerifyOtpValues } from '@/utils/validation';

const RESEND_COOLDOWN = 60;
const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = handleSubmit(async (values) => {
    if (!phone) {
      setSubmitError('Numero de telephone manquant, recommencez l\'inscription.');
      return;
    }
    setSubmitError(null);
    setInfo(null);
    try {
      await verifyOtp(phone, values.code);
    } catch (err) {
      setSubmitError(apiErrorMessage(err));
    }
  });

  const onResend = async () => {
    if (!phone || cooldown > 0 || resending) return;
    setSubmitError(null);
    setInfo(null);
    setResending(true);
    try {
      await authApi.resendOtp({ phone });
      setInfo('Un nouveau code a ete envoye.');
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setSubmitError(apiErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen scrollable>
      <Text style={styles.title}>Verification</Text>
      <Text style={styles.subtitle}>
        Entrez le code a 4 chiffres envoye au {phone ?? 'votre numero'}.
      </Text>

      {DEMO_MODE ? (
        <View style={styles.demo}>
          <Text style={styles.demoText}>Mode demo — code OTP : 1234</Text>
        </View>
      ) : null}

      {submitError ? <ErrorBanner message={submitError} /> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

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
            style={styles.codeInput}
            error={errors.code?.message}
          />
        )}
      />

      <Button label="Valider" loading={isSubmitting} onPress={onSubmit} />

      <Pressable onPress={onResend} disabled={cooldown > 0 || resending} style={styles.resend}>
        <Text style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
          {cooldown > 0 ? `Renvoyer un code dans ${cooldown}s` : 'Renvoyer un code'}
        </Text>
      </Pressable>
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
    ...typography.caption,
    color: colors.success,
    marginBottom: spacing.md,
  },
  codeInput: {
    fontSize: 28,
    letterSpacing: 12,
    textAlign: 'center',
  },
  resend: { alignSelf: 'center', marginTop: spacing.xl, padding: spacing.sm },
  resendText: { ...typography.bodyBold, color: colors.primary },
  resendDisabled: { color: colors.textMuted },
});
