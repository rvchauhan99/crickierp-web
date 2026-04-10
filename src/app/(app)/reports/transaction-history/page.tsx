"use client";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { reportService } from "@/services/reportService";
import type { AuditRow } from "@/types/financial";

export default function TransactionHistoryPage() {
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      return reportService.transactionHistory({
        search: activeSearch,
        page: params.page as number,
        pageSize: params.limit as number,
      });
    },
    [activeSearch]
  );

  const filterParams = useMemo(() => ({ search: activeSearch }), [activeSearch]);

  const columns = useMemo(
    () => [
      { field: "action", label: "Action", render: (row: AuditRow) => row.action, ...tableColumnPresets.nameCol },
      { field: "entity", label: "Entity", render: (row: AuditRow) => row.entity, ...tableColumnPresets.nameCol },
      { field: "entityId", label: "Entity ID", render: (row: AuditRow) => row.entityId || "-" },
      { field: "requestId", label: "Request ID", render: (row: AuditRow) => row.requestId || "-", minWidth: 180, wrap: true },
    ],
    []
  );

  return (
    <ListingPageContainer
      title="Reports / Transaction History"
      fullWidth
      density="compact"
      filters={
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="max-w-[320px]"
            placeholder="Search action / entity / requestId"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="secondary" onClick={() => { setActiveSearch(search); setPage(1); }}>
            Search
          </Button>
        </div>
      }
    >
      <PaginatedTableReference
        columns={columns}
        fetcher={fetcher}
        filterParams={filterParams}
        height="calc(100vh - 220px)"
        showSearch={false}
        showPagination={false}
        onTotalChange={setTotalCount}
        page={page}
        limit={limit}
        onPageChange={(zeroBased) => setPage(zeroBased + 1)}
        onRowsPerPageChange={setLimit}
        compactDensity
      />
      <PaginationControlsReference
        page={page - 1}
        rowsPerPage={limit}
        totalCount={totalCount}
        onPageChange={(zeroBased) => setPage(zeroBased + 1)}
        onRowsPerPageChange={setLimit}
        rowsPerPageOptions={[20, 50, 100]}
      />
    </ListingPageContainer>
  );
}
