import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Button, ErrorBanner, Screen } from '@/components/ui';
import { useBook } from '@/hooks/useBooks';
import { colors, radius, spacing, typography } from '@/theme';
import { apiErrorMessage } from '@/utils/apiErrorMessage';

const conditionLabel = { NEW: 'Neuf', USED: 'Occasion' } as const;
const statusLabel = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reserve',
  EXCHANGED: 'Echange',
} as const;

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: book, isLoading, error } = useBook(id ?? '');

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  if (error || !book) {
    return (
      <Screen>
        <ErrorBanner message={apiErrorMessage(error, 'Livre introuvable.')} />
        <Button label="Retour" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      {book.imageUrl ? (
        <Image source={{ uri: book.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>Sans image</Text>
        </View>
      )}

      <Text style={styles.title}>{book.title}</Text>
      {book.author ? <Text style={styles.author}>{book.author}</Text> : null}

      <View style={styles.metaRow}>
        <Chip label={book.grade} />
        <Chip label={conditionLabel[book.condition]} />
        <Chip label={statusLabel[book.status]} />
      </View>

      {book.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.body}>{book.description}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Proprietaire</Text>
        <Text style={styles.body}>
          {book.owner.firstName} {book.owner.lastName}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label={book.hasRequested ? 'Demande deja envoyee' : 'Demander ce livre'}
          disabled={book.hasRequested || book.status !== 'AVAILABLE'}
          onPress={() => {
            // Phase 5 : creation de demande
          }}
        />
      </View>
    </Screen>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    marginBottom: spacing.lg,
  },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { ...typography.caption, color: colors.textMuted },
  title: { ...typography.title, color: colors.text },
  author: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, flexWrap: 'wrap' },
  chip: {
    backgroundColor: colors.chipBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  chipText: { ...typography.caption, color: colors.chipText, fontWeight: '600' },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.xs },
  body: { ...typography.body, color: colors.text },
  actions: { marginTop: spacing.xxl },
});
