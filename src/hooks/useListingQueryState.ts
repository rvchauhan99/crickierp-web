"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ListingQueryState = {
  search: string;
  fromDate: string;
  toDate: string;
  page: number;
  pageSize: number;
};

const DEFAULTS: ListingQueryState = {
  search: "",
  fromDate: "",
  toDate: "",
  page: 1,
  pageSize: 10,
};

export function useListingQueryState() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const state = useMemo<ListingQueryState>(() => {
    return {
      search: params.get("search") ?? DEFAULTS.search,
      fromDate: params.get("fromDate") ?? DEFAULTS.fromDate,
      toDate: params.get("toDate") ?? DEFAULTS.toDate,
      page: Number(params.get("page") ?? DEFAULTS.page),
      pageSize: Number(params.get("pageSize") ?? DEFAULTS.pageSize),
    };
  }, [params]);

  const setState = useCallback(
    (next: Partial<ListingQueryState>) => {
      const merged = { ...state, ...next };
      const query = new URLSearchParams();
      if (merged.search) query.set("search", merged.search);
      if (merged.fromDate) query.set("fromDate", merged.fromDate);
      if (merged.toDate) query.set("toDate", merged.toDate);
      if (merged.page !== DEFAULTS.page) query.set("page", String(merged.page));
      if (merged.pageSize !== DEFAULTS.pageSize) query.set("pageSize", String(merged.pageSize));
      const queryString = query.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname, router, state],
  );

  return { state, setState };
}
