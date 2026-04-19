import { api } from './client';
import type {
  BookRequestSummary,
  MyRequest,
  RequestDetail,
  RequestSummary,
} from '@/types/request';

export const requestsApi = {
  create: (bookId: string) => api.post<RequestSummary>('/requests', { bookId }),
  getMine: () => api.get<MyRequest[]>('/requests/me'),
  getById: (id: string) => api.get<RequestDetail>(`/requests/${id}`),
  cancel: (id: string) => api.delete<{ message: string }>(`/requests/${id}`),
  getForBook: (bookId: string) => api.get<BookRequestSummary[]>(`/books/${bookId}/requests`),
};
