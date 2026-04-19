import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { Button, ChipSelect, ErrorBanner, Screen, TextField } from '@/components/ui';
import { useUpdateProfile } from '@/hooks/useUser';
import { colors, spacing, typography } from '@/theme';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { GRADE_OPTIONS } from '@/utils/grades';
import { updateProfileSchema, type UpdateProfileValues } from '@/utils/validation';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      address: user?.address ?? '',
      gradeInterests: user?.gradeInterests ?? [],
    },
  });

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null);
    updateProfile.mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        gradeInterests: values.gradeInterests,
      },
      {
        onSuccess: () => router.back(),
        onError: (err) => setSubmitError(apiErrorMessage(err)),
      },
    );
  });

  return (
    <Screen scrollable>
      <Text style={styles.title}>Modifier mon profil</Text>

      {submitError ? <ErrorBanner message={submitError} /> : null}

      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Prenom"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            autoCapitalize="words"
            error={errors.firstName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Nom"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            autoCapitalize="words"
            error={errors.lastName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Telephone"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            keyboardType="phone-pad"
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Adresse"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.address?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="gradeInterests"
        render={({ field: { onChange, value } }) => (
          <ChipSelect
            label="Niveaux qui vous interessent"
            options={[...GRADE_OPTIONS]}
            selected={value}
            onChange={onChange}
            error={errors.gradeInterests?.message}
          />
        )}
      />

      <Button
        label="Enregistrer"
        loading={isSubmitting || updateProfile.isPending}
        onPress={onSubmit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xl },
});
