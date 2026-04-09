"use client";

import { useMemo, useState } from "react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import { FilterToolbar } from "@/components/common/FilterToolbar";
import { PaginatedTable, TableColumn } from "@/components/common/PaginatedTable";
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
          config={[
            { key: "search", label: "Search by Name / Provider", type: "search" },
            { key: "fromDate", label: "From Date", type: "date" },
            { key: "toDate", label: "To Date", type: "date" },
          ]}
          values={{ search, fromDate, toDate }}
          onChange={(key, value) => {
            if (key === "search") {
              setSearch(value);
              setState({ search: value, page: 1 });
            }
            if (key === "fromDate") {
              setFromDate(value);
              setState({ fromDate: value, page: 1 });
            }
            if (key === "toDate") {
              setToDate(value);
              setState({ toDate: value, page: 1 });
            }
            setPage(0); // reset page, Note new PaginatedTable is 0-indexed
          }}
          onClear={() => {
            setSearch("");
            setFromDate("");
            setToDate("");
            setPage(0);
            setState({ search: "", fromDate: "", toDate: "", page: 1 });
          }}
        />
      }
    >
      <PaginatedTable
        columns={columns}
        rows={pageRows}
        page={page === 0 ? 0 : page - 1}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={(nextPage) => {
          // nextPage is 0-indexed from component, we map to 1-indexed for state if needed, but lets just store what hook needs
          const apiPage = nextPage + 1;
          setPage(apiPage);
          setState({ page: apiPage });
        }}
        onPageSizeChange={(newSize) => {
          setState({ pageSize: newSize, page: 1 });
          setPage(1);
        }}
      />
    </ListingPageContainer>
  );
}
