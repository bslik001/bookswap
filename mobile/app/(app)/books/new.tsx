import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, ErrorBanner, Screen, TextField } from '@/components/ui';
import { useCreateBook } from '@/hooks/useBooks';
import { colors, radius, spacing, typography } from '@/theme';
import type { BookCondition } from '@/types/book';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { GRADE_OPTIONS } from '@/utils/grades';
import { createBookSchema, type CreateBookValues } from '@/utils/validation';

const CONDITION_OPTIONS: { value: BookCondition; label: string }[] = [
  { value: 'NEW', label: 'Neuf' },
  { value: 'USED', label: 'Occasion' },
];

type PickedImage = { uri: string; name: string; type: string };

export default function NewBookScreen() {
  const router = useRouter();
  const createBook = useCreateBook();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [image, setImage] = useState<PickedImage | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookValues>({
    resolver: zodResolver(createBookSchema),
    defaultValues: {
      title: '',
      author: '',
      grade: '',
      className: '',
      condition: 'USED',
      description: '',
    },
  });

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSubmitError("Autorisez l'acces a la galerie pour choisir une image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    setImage({ uri: asset.uri, name: `book.${ext}`, type: mime });
  };

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null);
    createBook.mutate(
      {
        title: values.title.trim(),
        author: values.author?.trim() || undefined,
        grade: values.grade,
        className: values.className?.trim() || undefined,
        condition: values.condition,
        description: values.description?.trim() || undefined,
        image: image ?? undefined,
      },
      {
        onSuccess: (book) => router.replace(`/books/${book.id}`),
        onError: (err) => setSubmitError(apiErrorMessage(err)),
      },
    );
  });

  return (
    <Screen scrollable>
      <Text style={styles.title}>Ajouter un livre</Text>
      <Text style={styles.subtitle}>Decrivez votre livre pour qu&apos;il puisse etre echange.</Text>

      {submitError ? <ErrorBanner message={submitError} /> : null}

      <Pressable
        onPress={pickImage}
        style={({ pressed }) => [styles.imagePicker, pressed && styles.pressed]}
      >
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
            <Text style={styles.imageHint}>Ajouter une photo (optionnel)</Text>
          </View>
        )}
      </Pressable>

      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Titre"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.title?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="author"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Auteur (optionnel)"
            value={value ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.author?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="grade"
        render={({ field: { onChange, value } }) => (
          <View style={styles.field}>
            <Text style={styles.label}>Niveau</Text>
            <View style={styles.chipRow}>
              {GRADE_OPTIONS.map((opt) => {
                const active = value === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => onChange(opt.value)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.grade ? <Text style={styles.error}>{errors.grade.message}</Text> : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="className"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Classe / matiere (optionnel)"
            value={value ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="ex. Maths"
            error={errors.className?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="condition"
        render={({ field: { onChange, value } }) => (
          <View style={styles.field}>
            <Text style={styles.label}>Etat</Text>
            <View style={styles.chipRow}>
              {CONDITION_OPTIONS.map((opt) => {
                const active = value === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => onChange(opt.value)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.condition ? (
              <Text style={styles.error}>{errors.condition.message}</Text>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Description (optionnel)"
            value={value ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            multiline
            numberOfLines={4}
            style={styles.textarea}
            error={errors.description?.message}
          />
        )}
      />

      <Button
        label="Publier le livre"
        loading={isSubmitting || createBook.isPending}
        onPress={onSubmit}
      />
      <View style={styles.cancelWrapper}>
        <Button label="Annuler" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl },
  imagePicker: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageHint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  pressed: { opacity: 0.7 },
  field: { marginBottom: spacing.lg },
  label: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.chipBg, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text },
  chipTextActive: { color: colors.chipText, fontWeight: '600' },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  cancelWrapper: { marginTop: spacing.md },
});
