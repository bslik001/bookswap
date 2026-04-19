import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBanner } from '@/components/ui';
import { useDeleteBook, useMyBooks } from '@/hooks/useBooks';
import { colors, radius, spacing, typography } from '@/theme';
import type { Book } from '@/types/book';
import { apiErrorMessage } from '@/utils/apiErrorMessage';

const conditionLabel = { NEW: 'Neuf', USED: 'Occasion' } as const;
const statusLabel = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reserve',
  EXCHANGED: 'Echange',
} as const;

export default function MyBooksScreen() {
  const router = useRouter();
  const { data: books, isLoading, isFetching, refetch, error } = useMyBooks();
  const deleteBook = useDeleteBook();

  const onLongPress = (book: Book) => {
    Alert.alert(book.title, undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Supprimer ce livre ?', 'Cette action est irreversible.', [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Supprimer',
              style: 'destructive',
              onPress: () => deleteBook.mutate(book.id),
            },
          ]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes livres</Text>
      </View>

      {error ? (
        <View style={styles.errorWrapper}>
          <ErrorBanner message={apiErrorMessage(error)} />
        </View>
      ) : null}

      <FlatList
        data={books ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <BookRow
            book={item}
            onPress={() => router.push(`/books/${item.id}`)}
            onLongPress={() => onLongPress(item)}
          />
        )}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={() =>
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Vous n&apos;avez encore publie aucun livre.</Text>
              <Text style={styles.emptyHint}>Touchez le + pour en ajouter un.</Text>
            </View>
          )
        }
      />

      <Pressable
        accessibilityLabel="Ajouter un livre"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/books/new')}
      >
        <Ionicons name="add" size={28} color={colors.surface} />
      </Pressable>
    </SafeAreaView>
  );
}

function BookRow({
  book,
  onPress,
  onLongPress,
}: {
  book: Book;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {book.imageUrl ? (
        <Image source={{ uri: book.imageUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}
      <View style={styles.body}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.meta}>
          {book.grade} · {conditionLabel[book.condition]}
        </Text>
        <Text style={styles.status}>{statusLabel[book.status]}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.title, color: colors.text },
  errorWrapper: { paddingHorizontal: spacing.xl },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  loader: { marginTop: spacing.xxl },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  emptyHint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowPressed: { opacity: 0.7 },
  thumb: {
    width: 60,
    height: 80,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    marginRight: spacing.md,
  },
  thumbPlaceholder: { backgroundColor: colors.border },
  body: { flex: 1, justifyContent: 'space-between' },
  bookTitle: { ...typography.bodyBold, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  status: { ...typography.caption, color: colors.primary, marginTop: spacing.xs },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabPressed: { opacity: 0.85 },
});
