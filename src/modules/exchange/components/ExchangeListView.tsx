"use client";

import { useMemo, useState } from "react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import { FilterToolbar } from "@/components/common/FilterToolbar";
import { PaginatedTable, TableColumn } from "@/components/common/PaginatedTable";
import { PaginationControls } from "@/components/common/PaginationControls";
import { Badge } from "@/components/ui/Badge";
import { Exchange } from "@/types/exchange";
import { useListingQueryState } from "@/hooks/useListingQueryState";

type Props = {
  rows: Exchange[];
};

export function ExchangeListView({ rows }: Props) {
  const { state, setState } = useListingQueryState();
  const [search, setSearch] = useState(state.search);
  const [fromDate, setFromDate] = useState(state.fromDate);
  const [toDate, setToDate] = useState(state.toDate);
  const [page, setPage] = useState(state.page);
  const pageSize = state.pageSize;

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const value = search.toLowerCase();
    return rows.filter((row) => row.name.toLowerCase().includes(value) || row.provider.toLowerCase().includes(value));
  }, [rows, search]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns: TableColumn<Exchange>[] = [
    { key: "name", label: "Exchange Name", render: (row) => row.name },
    { key: "provider", label: "Provider", render: (row) => row.provider },
    { key: "openingBalance", label: "Opening Balance", render: (row) => row.openingBalance },
    { key: "bonus", label: "Bonus", render: (row) => row.bonus },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : "warning"}>{row.status}</Badge>
      ),
    },
  ];

  return (
    <ListingPageContainer
      title="Exchange / List"
      description="Search, filter and review all exchanges."
      density="compact"
      filters={
        <FilterToolbar
          search={search}
          fromDate={fromDate}
          toDate={toDate}
          onChange={(next) => {
            if (next.search !== undefined) {
              setSearch(next.search);
              setState({ search: next.search, page: 1 });
              setPage(1);
            }
            if (next.fromDate !== undefined) {
              setFromDate(next.fromDate);
              setState({ fromDate: next.fromDate, page: 1 });
              setPage(1);
            }
            if (next.toDate !== undefined) {
              setToDate(next.toDate);
              setState({ toDate: next.toDate, page: 1 });
              setPage(1);
            }
          }}
          onReset={() => {
            setSearch("");
            setFromDate("");
            setToDate("");
            setPage(1);
            setState({ search: "", fromDate: "", toDate: "", page: 1 });
          }}
        />
      }
      footer={
        <PaginationControls
          page={page}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            setState({ page: nextPage });
          }}
        />
      }
    >
      <PaginatedTable columns={columns} rows={pageRows} />
    </ListingPageContainer>
  );
}
