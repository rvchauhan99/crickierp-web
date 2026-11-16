/** Strip UI pagination keys so export requests send filters/sort only. */
export function withoutPagination<T extends Record<string, unknown>>(params: T): Omit<T, "page" | "pageSize" | "limit" | "cursor"> {
  const { page: _page, pageSize: _pageSize, limit: _limit, cursor: _cursor, ...rest } = params;
  return rest;
}

/** Axios timeout for backend Excel/CSV export downloads. */
export const EXPORT_REQUEST_TIMEOUT_MS = 60_000;
