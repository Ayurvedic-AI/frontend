/** Shared list-query → SDK params mapping for masters sections (feature 027). */

export interface MastersListQuery {
  search?: string;
  page: number; // 0-based
  pageSize: number;
  /** Signed sort field, e.g. "-created_at". */
  sort: string;
  activeOnly?: boolean;
}

export interface MastersListParams {
  search?: string;
  is_active?: boolean;
  limit: number;
  offset: number;
  sort: string;
}

export function toListParams(query: MastersListQuery): MastersListParams {
  const trimmed = query.search?.trim();
  return {
    ...(trimmed ? { search: trimmed } : {}),
    ...(query.activeOnly ? { is_active: true } : {}),
    limit: query.pageSize,
    offset: query.page * query.pageSize,
    sort: query.sort,
  };
}
