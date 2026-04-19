import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBanner, StatusBadge } from '@/components/ui';
import { useRequestsForBook } from '@/hooks/useRequests';
import { colors, radius, spacing, typography } from '@/theme';
import { apiErrorMessage } from '@/utils/apiErrorMessage';

export default function BookRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isFetching, refetch, error } = useRequestsForBook(id ?? '');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Demandes recues</Text>
        <Text style={styles.subtitle}>
          La validation est faite par un administrateur. Vous serez notifie de la decision.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorWrapper}>
          <ErrorBanner message={apiErrorMessage(error)} />
        </View>
      ) : null}

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.body}>
              <Text style={styles.requester}>
                {item.requester.firstName} {item.requester.lastName.charAt(0)}.
              </Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={() =>
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune demande pour ce livre.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: { flex: 1 },
  requester: { ...typography.bodyBold, color: colors.text },
  date: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
