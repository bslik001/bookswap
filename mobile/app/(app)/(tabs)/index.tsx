import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookCard } from '@/components/books/BookCard';
import { BookFilters } from '@/components/books/BookFilters';
import { SearchBar } from '@/components/books/SearchBar';
import { ErrorBanner } from '@/components/ui';
import { useBooks } from '@/hooks/useBooks';
import { useDebounce } from '@/hooks/useDebounce';
import { colors, spacing, typography } from '@/theme';
import type { BookCondition } from '@/types/book';
import { apiErrorMessage } from '@/utils/apiErrorMessage';

export default function BooksListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [grade, setGrade] = useState<string | undefined>(undefined);
  const [condition, setCondition] = useState<BookCondition | undefined>(undefined);

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      grade,
      condition,
    }),
    [debouncedSearch, grade, condition],
  );

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useBooks(filters);

  const books = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Livres disponibles</Text>
      </View>

      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} />
        <BookFilters
          grade={grade}
          condition={condition}
          onChange={(next) => {
            setGrade(next.grade);
            setCondition(next.condition);
          }}
        />
      </View>

      {error ? (
        <View style={styles.errorWrapper}>
          <ErrorBanner message={apiErrorMessage(error)} />
        </View>
      ) : null}

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <BookCard book={item} onPress={() => router.push(`/books/${item.id}`)} />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isFetchingNextPage} onRefresh={refetch} />
        }
        ListEmptyComponent={() =>
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucun livre trouve.</Text>
            </View>
          )
        }
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.footerLoader} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.title, color: colors.text },
  controls: { paddingHorizontal: spacing.xl },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  errorWrapper: { paddingHorizontal: spacing.xl },
  loader: { marginTop: spacing.xxl },
  footerLoader: { marginVertical: spacing.lg },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...typography.body, color: colors.textMuted },
});
