import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import type { Book } from '@/types/book';

type BookCardProps = {
  book: Book;
  onPress: () => void;
};

const conditionLabel: Record<Book['condition'], string> = {
  NEW: 'Neuf',
  USED: 'Occasion',
};

export function BookCard({ book, onPress }: BookCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrapper}>
        {book.imageUrl ? (
          <Image source={{ uri: book.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>Sans image</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        {book.author ? (
          <Text style={styles.author} numberOfLines={1}>
            {book.author}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{book.grade}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{conditionLabel[book.condition]}</Text>
          </View>
        </View>
        <Text style={styles.owner}>
          {book.owner.firstName} {book.owner.lastName}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  imageWrapper: { marginRight: spacing.md },
  image: { width: 70, height: 100, borderRadius: radius.sm, backgroundColor: colors.bg },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
  body: { flex: 1, justifyContent: 'space-between' },
  title: { ...typography.bodyBold, color: colors.text },
  author: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  chip: {
    backgroundColor: colors.chipBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  chipText: { ...typography.caption, color: colors.chipText, fontSize: 11 },
  owner: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
});
