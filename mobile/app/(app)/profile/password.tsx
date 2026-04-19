import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button, ErrorBanner, Screen, TextField } from '@/components/ui';
import { useChangePassword } from '@/hooks/useUser';
import { colors, spacing, typography } from '@/theme';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { changePasswordSchema, type ChangePasswordValues } from '@/utils/validation';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const changePassword = useChangePassword();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null);
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          Alert.alert('Mot de passe modifie', 'Votre mot de passe a ete mis a jour.');
          router.back();
        },
        onError: (err) => setSubmitError(apiErrorMessage(err)),
      },
    );
  });

  return (
    <Screen scrollable>
      <Text style={styles.title}>Changer mon mot de passe</Text>

      {submitError ? <ErrorBanner message={submitError} /> : null}

      <Controller
        control={control}
        name="currentPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Mot de passe actuel"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            secureTextEntry
            error={errors.currentPassword?.message}
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
            secureTextEntry
            hint="8 caracteres min, avec majuscule, minuscule et chiffre."
            error={errors.newPassword?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Confirmer le nouveau mot de passe"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            secureTextEntry
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <Button
        label="Mettre a jour"
        loading={isSubmitting || changePassword.isPending}
        onPress={onSubmit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xl },
});
