import { api } from './client';
import type { Book, BookDetail, BookFilters, Paginated } from '@/types/book';

export type ListBooksParams = BookFilters & {
  page?: number;
  limit?: number;
};

function buildQuery(params: ListBooksParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.grade) search.set('grade', params.grade);
  if (params.condition) search.set('condition', params.condition);
  if (params.status) search.set('status', params.status);
  if (params.search) search.set('search', params.search);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const booksApi = {
  list: (params: ListBooksParams = {}) =>
    api.get<Paginated<Book>>(`/books${buildQuery(params)}`),
  getById: (id: string) => api.get<BookDetail>(`/books/${id}`),
  getMine: () => api.get<Book[]>('/books/me'),
};
