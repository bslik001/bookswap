import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '@/api/requests';

export function useMyRequests() {
  return useQuery({
    queryKey: ['requests', 'mine'],
    queryFn: () => requestsApi.getMine(),
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ['requests', 'detail', id],
    queryFn: () => requestsApi.getById(id),
    enabled: !!id,
  });
}

export function useRequestsForBook(bookId: string) {
  return useQuery({
    queryKey: ['requests', 'forBook', bookId],
    queryFn: () => requestsApi.getForBook(bookId),
    enabled: !!bookId,
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => requestsApi.create(bookId),
    onSuccess: (_data, bookId) => {
      qc.invalidateQueries({ queryKey: ['requests', 'mine'] });
      qc.invalidateQueries({ queryKey: ['books', 'detail', bookId] });
      qc.invalidateQueries({ queryKey: ['books', 'list'] });
    },
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requestsApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['books'] });
    },
  });
}
