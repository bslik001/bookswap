export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiSuccess<T> = { success: true; data: T; meta?: PaginationMeta };

export type ApiErrorPayload = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorPayload;

export type Paginated<T> = { data: T[]; meta: PaginationMeta };

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
