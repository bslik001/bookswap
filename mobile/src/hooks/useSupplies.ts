import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { suppliesApi, type ListSuppliesParams } from '@/api/supplies';

const PAGE_SIZE = 20;

export function useSupplies(filters: Omit<ListSuppliesParams, 'page' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: ['supplies', 'list', filters],
    queryFn: ({ pageParam }) =>
      suppliesApi.list({ ...filters, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

export function useSupply(id: string) {
  return useQuery({
    queryKey: ['supplies', 'detail', id],
    queryFn: () => suppliesApi.getById(id),
    enabled: !!id,
  });
}

export function useContactSupplier(id: string) {
  return useMutation({
    mutationFn: (message: string) => suppliesApi.contact(id, message),
  });
}
