// Types globaux partagés à travers tout le projet

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  data: T;
  pagination?: Pagination;
};

export type ApiError = {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
};

export type SortOrder = 'asc' | 'desc';

export type PrixRange = {
  min?: number;
  max?: number;
};
