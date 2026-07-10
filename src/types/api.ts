export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface ArreteFilters {
  statut?: string;
  type_code?: string;
  recherche?: string;
  date_debut?: string;
  date_fin?: string;
}
