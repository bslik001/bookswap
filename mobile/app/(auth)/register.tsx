import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { Button, ChipSelect, ErrorBanner, Screen, TextField } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { GRADE_OPTIONS } from '@/utils/grades';
import { registerSchema, type RegisterValues } from '@/utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      gradeInterests: [],
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await register({
        ...values,
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
      });
      router.replace({ pathname: '/(auth)/otp', params: { phone: values.phone.trim() } });
    } catch (err) {
      setSubmitError(apiErrorMessage(err));
    }
  });

  return (
    <Screen scrollable>
      <Text style={styles.title}>Creer un compte</Text>
      <Text style={styles.subtitle}>Rejoignez BookSwap pour echanger vos livres scolaires.</Text>

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
            error={errors.email?.message}
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
            placeholder="+221 77 123 45 67"
            keyboardType="phone-pad"
            hint="Inclure l'indicatif pays. Vous recevrez un code par SMS."
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
            placeholder="Quartier, ville"
            error={errors.address?.message}
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
            hint="8 caracteres min, avec majuscule, minuscule et chiffre."
            error={errors.password?.message}
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

      <Button label="Creer mon compte" loading={isSubmitting} onPress={onSubmit} />

      <View style={styles.footer}>
        <Text style={styles.muted}>Deja un compte ? </Text>
        <Link href="/(auth)/login" style={styles.link}>
          Se connecter
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl },
  footer: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  muted: { ...typography.body, color: colors.textMuted },
  link: { ...typography.bodyBold, color: colors.primary },
});
