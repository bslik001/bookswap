import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBanner } from '@/components/ui';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications';
import { colors, radius, spacing, typography } from '@/theme';
import type { Notification, NotificationType } from '@/types/notification';
import { apiErrorMessage } from '@/utils/apiErrorMessage';

const ICON_BY_TYPE: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  BOOK_REQUEST: 'mail-unread-outline',
  REQUEST_UPDATE: 'sync-outline',
  SUPPLIER_CONTACT: 'briefcase-outline',
  SYSTEM: 'information-circle-outline',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    data,
    isLoading,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.data),
    [data?.pages],
  );
  const hasUnread = items.some((n) => !n.isRead);

  const onPressItem = (item: Notification) => {
    if (!item.isRead) markRead.mutate(item.id);
    if (item.type === 'BOOK_REQUEST' || item.type === 'REQUEST_UPDATE') {
      router.push('/requests/me');
    } else if (item.type === 'SUPPLIER_CONTACT') {
      router.push('/supplies');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Pressable
          onPress={() => markAllRead.mutate()}
          disabled={!hasUnread || markAllRead.isPending}
          accessibilityRole="button"
          accessibilityLabel="Marquer toutes les notifications comme lues"
          accessibilityState={{ disabled: !hasUnread || markAllRead.isPending }}
          hitSlop={8}
        >
          <Text style={[styles.action, (!hasUnread || markAllRead.isPending) && styles.actionDisabled]}>
            Tout marquer lu
          </Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorWrapper}>
          <ErrorBanner message={apiErrorMessage(error)} />
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <Row item={item} onPress={() => onPressItem(item)} />}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isFetchingNextPage} onRefresh={refetch} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : null
        }
        ListEmptyComponent={() =>
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune notification pour le moment.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function Row({ item, onPress }: { item: Notification; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.isRead ? 'Notification lue' : 'Notification non lue'} : ${item.content}`}
      style={({ pressed }) => [styles.row, !item.isRead && styles.rowUnread, pressed && styles.rowPressed]}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={ICON_BY_TYPE[item.type]} size={20} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.content, !item.isRead && styles.contentUnread]}>{item.content}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {!item.isRead ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.title, color: colors.text },
  action: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  actionDisabled: { color: colors.textMuted },
  errorWrapper: { paddingHorizontal: spacing.xl },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  loader: { marginTop: spacing.xxl },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...typography.body, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowUnread: { borderColor: colors.primary },
  rowPressed: { opacity: 0.7 },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: { flex: 1 },
  content: { ...typography.body, color: colors.text },
  contentUnread: { fontWeight: '700' },
  date: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});
