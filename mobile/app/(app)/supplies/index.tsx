import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBanner } from '@/components/ui';
import { useSupplies } from '@/hooks/useSupplies';
import { colors, radius, spacing, typography } from '@/theme';
import type { Supply, SupplyType } from '@/types/supply';
import { apiErrorMessage } from '@/utils/apiErrorMessage';

const TYPE_OPTIONS: { value: SupplyType; label: string }[] = [
  { value: 'NOTEBOOK', label: 'Cahiers' },
  { value: 'PEN', label: 'Stylos' },
  { value: 'BAG', label: 'Sacs' },
  { value: 'OTHER', label: 'Autres' },
];

export default function SuppliesListScreen() {
  const router = useRouter();
  const [type, setType] = useState<SupplyType | undefined>(undefined);
  const filters = useMemo(() => ({ type }), [type]);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = useSupplies(filters);

  const supplies = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.data),
    [data?.pages],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Fournitures</Text>
        <Text style={styles.subtitle}>
          Trouvez vos fournitures scolaires aupres des fournisseurs partenaires.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        <FilterChip label="Toutes" active={!type} onPress={() => setType(undefined)} />
        {TYPE_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={type === opt.value}
            onPress={() => setType(type === opt.value ? undefined : opt.value)}
          />
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.errorWrapper}>
          <ErrorBanner message={apiErrorMessage(error)} />
        </View>
      ) : null}

      <FlatList
        data={supplies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SupplyRow item={item} onPress={() => router.push(`/supplies/${item.id}`)} />
        )}
        refreshControl={<RefreshControl refreshing={isFetching && !isFetchingNextPage} onRefresh={refetch} />}
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
              <Text style={styles.emptyText}>Aucune fourniture pour ces filtres.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function SupplyRow({ item, onPress }: { item: Supply; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {item.imageUrl ? (
        <Image
          source={item.imageUrl}
          style={styles.thumb}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.supplier}>
          {item.supplier.firstName} {item.supplier.lastName.charAt(0)}.
        </Text>
        {item.price ? (
          <Text style={styles.price}>{Number(item.price).toLocaleString('fr-FR')} FCFA</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  filters: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: spacing.sm },
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
  rowPressed: { opacity: 0.7 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    marginRight: spacing.md,
  },
  thumbPlaceholder: { backgroundColor: colors.border },
  body: { flex: 1, justifyContent: 'center' },
  name: { ...typography.bodyBold, color: colors.text },
  supplier: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  price: { ...typography.caption, color: colors.primary, marginTop: spacing.xs, fontWeight: '600' },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.chipBg, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text },
  chipTextActive: { color: colors.chipText, fontWeight: '600' },
});
