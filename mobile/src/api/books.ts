import { api } from './client';
import type { Book, BookCondition, BookDetail, BookFilters, Paginated } from '@/types/book';

export type ListBooksParams = BookFilters & {
  page?: number;
  limit?: number;
};

export type CreateBookInput = {
  title: string;
  author?: string;
  grade: string;
  className?: string;
  condition: BookCondition;
  description?: string;
  image?: { uri: string; name: string; type: string };
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

function buildFormData(input: CreateBookInput): FormData {
  const form = new FormData();
  form.append('title', input.title);
  form.append('grade', input.grade);
  form.append('condition', input.condition);
  if (input.author) form.append('author', input.author);
  if (input.className) form.append('className', input.className);
  if (input.description) form.append('description', input.description);
  if (input.image) {
    form.append('image', {
      uri: input.image.uri,
      name: input.image.name,
      type: input.image.type,
    } as unknown as Blob);
  }
  return form;
}

export const booksApi = {
  list: (params: ListBooksParams = {}) =>
    api.get<Paginated<Book>>(`/books${buildQuery(params)}`),
  getById: (id: string) => api.get<BookDetail>(`/books/${id}`),
  getMine: () => api.get<Book[]>('/books/me'),
  create: (input: CreateBookInput) => api.post<Book>('/books', buildFormData(input)),
  remove: (id: string) => api.delete<{ message: string }>(`/books/${id}`),
};
