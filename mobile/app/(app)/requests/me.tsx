import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBanner, StatusBadge } from '@/components/ui';
import { useMyRequests } from '@/hooks/useRequests';
import { colors, radius, spacing, typography } from '@/theme';
import type { MyRequest } from '@/types/request';
import { apiErrorMessage } from '@/utils/apiErrorMessage';

export default function MyRequestsScreen() {
  const router = useRouter();
  const { data: requests, isLoading, isFetching, refetch, error } = useMyRequests();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes demandes</Text>
      </View>

      {error ? (
        <View style={styles.errorWrapper}>
          <ErrorBanner message={apiErrorMessage(error)} />
        </View>
      ) : null}

      <FlatList
        data={requests ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RequestRow item={item} onPress={() => router.push(`/requests/${item.id}`)} />
        )}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={() =>
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune demande pour le moment.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function RequestRow({ item, onPress }: { item: MyRequest; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {item.book.imageUrl ? (
        <Image source={{ uri: item.book.imageUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}
      <View style={styles.body}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.book.title}
        </Text>
        <Text style={styles.grade}>{item.book.grade}</Text>
        <View style={styles.statusRow}>
          <StatusBadge status={item.status} />
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.title, color: colors.text },
  errorWrapper: { paddingHorizontal: spacing.xl },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxl },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...typography.body, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
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
  grade: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { ...typography.caption, color: colors.textMuted },
});
