import { useMemo, useState } from "react";

const PAGE_SIZE = 10;

/**
 * Búsqueda + paginación cliente (la API admin lista todo de una).
 */
export function useAdminPagination(items, { filterFn, pageSize = PAGE_SIZE } = {}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    if (!filterFn) return list;
    return filterFn(list, query.trim().toLowerCase());
  }, [items, query, filterFn]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  function setQueryAndReset(value) {
    setQuery(value);
    setPage(1);
  }

  return {
    query,
    setQuery: setQueryAndReset,
    page: safePage,
    setPage,
    pageItems,
    filtered,
    total,
    totalPages,
    pageSize,
    from: total === 0 ? 0 : (safePage - 1) * pageSize + 1,
    to: Math.min(safePage * pageSize, total),
  };
}

export { PAGE_SIZE };
