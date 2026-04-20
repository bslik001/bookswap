import { api } from './client';
import type { Supply, SupplyFilters } from '@/types/supply';

export type ListSuppliesParams = SupplyFilters & {
  page?: number;
  limit?: number;
};

function buildQuery(params: ListSuppliesParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.type) search.set('type', params.type);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const suppliesApi = {
  list: (params: ListSuppliesParams = {}) =>
    api.getPaginated<Supply>(`/supplies${buildQuery(params)}`),
  getById: (id: string) => api.get<Supply>(`/supplies/${id}`),
  contact: (id: string, message: string) =>
    api.post<{ id: string; message: string; createdAt: string }>(`/supplies/${id}/contact`, {
      message,
    }),
};
