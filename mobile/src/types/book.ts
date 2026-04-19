export type BookCondition = 'NEW' | 'USED';
export type BookStatus = 'AVAILABLE' | 'RESERVED' | 'EXCHANGED';

export type BookOwner = {
  id: string;
  firstName: string;
  lastName: string;
};

export type Book = {
  id: string;
  title: string;
  author: string | null;
  grade: string;
  className: string | null;
  condition: BookCondition;
  description: string | null;
  imageUrl: string | null;
  status: BookStatus;
  createdAt: string;
  ownerId: string;
  owner: BookOwner;
};

export type BookDetail = Book & {
  hasRequested: boolean;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  books: T[];
  meta: PaginationMeta;
};

export type BookFilters = {
  grade?: string;
  condition?: BookCondition;
  status?: BookStatus;
  search?: string;
};
