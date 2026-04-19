import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { booksApi, type ListBooksParams } from '@/api/books';

const PAGE_SIZE = 20;

export function useBooks(filters: Omit<ListBooksParams, 'page' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: ['books', 'list', filters],
    queryFn: ({ pageParam }) =>
      booksApi.list({ ...filters, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: ['books', 'detail', id],
    queryFn: () => booksApi.getById(id),
    enabled: !!id,
  });
}

export function useMyBooks() {
  return useQuery({
    queryKey: ['books', 'mine'],
    queryFn: () => booksApi.getMine(),
  });
}
