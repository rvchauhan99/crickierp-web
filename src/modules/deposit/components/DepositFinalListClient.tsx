"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { exportDeposits, listDepositsNormalized } from "@/services/depositService";
import type { DepositRow } from "@/types/deposit";
import { userService } from "@/services/userService";

const COLUMN_FILTER_KEYS = [
  "utr",
  "utr_op",
  "bankName",
  "bankName_op",
  "bankId",
  "status",
  "amount",
  "amount_to",
  "amount_op",
  "totalAmount",
  "totalAmount_to",
  "totalAmount_op",
  "player",
  "createdBy",
  "createdAt_from",
  "createdAt_to",
  "createdAt_op",
];

function toOptionalFilterValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

type ExchangeUserRow = {
  _id?: string;
  id?: string;
  fullName?: string;
  username?: string;
  name?: string;
};

function buildUserLabel(row: ExchangeUserRow): string {
  const fullName = row.fullName?.trim();
  const username = row.username?.trim();
  const name = row.name?.trim();
  if (fullName && username) return `${fullName} (${username})`;
  if (fullName) return fullName;
  if (username) return username;
  return name || "";
}

export function DepositFinalListClient() {
  const listingState = useListingQueryStateReference({
    defaultLimit: 20,
    filterKeys: COLUMN_FILTER_KEYS,
  });
  const { page, limit, sortBy, sortOrder, filters, setPage, setLimit, setFilter, setSort, clearFilters } =
    listingState;

  const [totalCount, setTotalCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [cachedUsers, setCachedUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    userService
      .list({ page: 1, limit: 500, sortBy: "fullName", sortOrder: "asc" })
      .then((response) => {
        if (!active) return;
        const rows = Array.isArray(response?.data) ? (response.data as ExchangeUserRow[]) : [];
        setCachedUsers((prev) => {
          const next = { ...prev };
          for (const row of rows) {
            const value = String(row._id ?? row.id ?? "").trim();
            const label = buildUserLabel(row);
            if (!value || !label) continue;
            next[value] = label;
          }
          return next;
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const loadCreatedByOptions = useCallback(
    async (query: string) => {
      try {
        const response = await userService.list({
          q: query || undefined,
          page: 1,
          limit: 20,
          sortBy: "fullName",
          sortOrder: "asc",
        });
        const rows = Array.isArray(response?.data) ? (response.data as ExchangeUserRow[]) : [];
        return rows
          .map((row) => {
            const value = String(row._id ?? row.id ?? "").trim();
            const label = buildUserLabel(row);
            if (!value || !label) return null;
            return { value, label };
          })
          .filter((row): row is { value: string; label: string } => row !== null);
      } catch {
        return [];
      }
    },
    [],
  );

  const columnFilterValues = useMemo(() => ({ ...filters }), [filters]);

  const handleColumnFilterChange = useCallback(
    (key: string, value: string) => {
      setFilter(key, value);
    },
    [setFilter],
  );

  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    return listDepositsNormalized("final", params);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportDeposits("final", {
        page: 1,
        limit: 20,
        sortBy: sortBy || "createdAt",
        sortOrder: sortOrder || "desc",
        utr: toOptionalFilterValue(filters.utr || ""),
        utr_op: toOptionalFilterValue(filters.utr_op || ""),
        bankName: toOptionalFilterValue(filters.bankName || ""),
        bankName_op: toOptionalFilterValue(filters.bankName_op || ""),
        bankId: toOptionalFilterValue(filters.bankId || ""),
        status: toOptionalFilterValue(filters.status || ""),
        amount: toOptionalFilterValue(filters.amount || ""),
        amount_to: toOptionalFilterValue(filters.amount_to || ""),
        amount_op: toOptionalFilterValue(filters.amount_op || ""),
        totalAmount: toOptionalFilterValue(filters.totalAmount || ""),
        totalAmount_to: toOptionalFilterValue(filters.totalAmount_to || ""),
        totalAmount_op: toOptionalFilterValue(filters.totalAmount_op || ""),
        player: toOptionalFilterValue(filters.player || ""),
        createdBy: toOptionalFilterValue(filters.createdBy || ""),
        createdAt_from: toOptionalFilterValue(filters.createdAt_from || ""),
        createdAt_to: toOptionalFilterValue(filters.createdAt_to || ""),
        createdAt_op: toOptionalFilterValue(filters.createdAt_op || ""),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deposits-final-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Failed to export.");
    } finally {
      setExporting(false);
    }
  }, [filters, sortBy, sortOrder]);

  const columns = useMemo<PaginatedTableReferenceColumn[]>(
    () => [
      {
        field: "player",
        label: "Player",
        render: (row: DepositRow) => row.playerIdLabel || "—",
        minWidth: 120,
        sortable: false,
      },
      {
        field: "bankName",
        label: "Bank",
        render: (row: DepositRow) => row.bankName,
        ...tableColumnPresets.nameCol,
        sortable: true,
        filterType: "text" as const,
        filterKey: "bankName",
        operatorKey: "bankName_op",
        defaultFilterOperator: "contains",
      },
      {
        field: "utr",
        label: "UTR",
        render: (row: DepositRow) => row.utr,
        minWidth: 130,
        sortable: true,
        filterType: "text" as const,
        filterKey: "utr",
        operatorKey: "utr_op",
        defaultFilterOperator: "contains",
      },
      {
        field: "amount",
        label: "Amount",
        render: (row: DepositRow) => row.amount.toLocaleString(),
        sortable: true,
        filterType: "number" as const,
        filterKey: "amount",
        filterKeyTo: "amount_to",
        operatorKey: "amount_op",
        defaultFilterOperator: "equals",
      },
      {
        field: "bonusAmount",
        label: "Bonus",
        render: (row: DepositRow) => (row.bonusAmount != null ? row.bonusAmount.toLocaleString() : "—"),
        sortable: true,
        minWidth: 90,
      },
      {
        field: "totalAmount",
        label: "Total",
        render: (row: DepositRow) => (row.totalAmount != null ? row.totalAmount.toLocaleString() : "—"),
        sortable: true,
        filterType: "number" as const,
        filterKey: "totalAmount",
        filterKeyTo: "totalAmount_to",
        operatorKey: "totalAmount_op",
        defaultFilterOperator: "equals",
      },
      {
        field: "rejectReason",
        label: "Remark",
        render: (row: DepositRow) => row.rejectReason || "—",
        minWidth: 140,
        sortable: false,
      },
      {
        field: "status",
        label: "Status",
        filterType: "select" as const,
        filterKey: "status",
        filterOptions: [
          { label: "Pending", value: "pending" },
          { label: "Verified", value: "verified" },
          { label: "Rejected", value: "rejected" },
          { label: "Finalized", value: "finalized" },
        ],
        ...tableColumnPresets.statusCol,
        render: (row: DepositRow) => <TableStatusBadge status={row.status} />,
      },
      {
        field: "bankBalanceAfter",
        label: "Bank balance after",
        render: (row: DepositRow) =>
          row.bankBalanceAfter != null ? row.bankBalanceAfter.toLocaleString() : "—",
        sortable: false,
        minWidth: 140,
      },
      {
        field: "settledAt",
        label: "Settled at",
        render: (row: DepositRow) => (row.settledAt ? new Date(row.settledAt).toLocaleString() : "—"),
        sortable: true,
        minWidth: 170,
      },
      {
        field: "createdBy",
        label: "Created by",
        render: (row: DepositRow) => {
          const uid =
            typeof row.createdBy === "object" && row.createdBy && "_id" in row.createdBy
              ? String((row.createdBy as { _id: unknown })._id)
              : "";
          return row.createdByName || (uid ? cachedUsers[uid] : "") || "—";
        },
        minWidth: 160,
        filterType: "autocomplete" as const,
        filterKey: "createdBy",
        filterLoadOptions: loadCreatedByOptions,
        filterPlaceholder: "Search user",
        filterEmptyText: "No users found",
      },
      {
        field: "createdAt",
        label: "Created at",
        sortable: true,
        filterType: "date" as const,
        filterKey: "createdAt_from",
        filterKeyTo: "createdAt_to",
        operatorKey: "createdAt_op",
        defaultFilterOperator: "inRange",
        ...tableColumnPresets.dateCol,
        render: (row: DepositRow) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"),
      },
    ],
    [cachedUsers, loadCreatedByOptions],
  );

  return (
    <ListingPageContainer
      title="Deposit / Final list"
      description="All deposits including rejections. Filter by date range, UTR, bank, status, and more."
      density="compact"
      fullWidth
      secondaryButtonLabel="Reset filters"
      onSecondaryClick={() => clearFilters({ keepQuickSearch: true })}
      exportButtonLabel="Export"
      onExportClick={handleExport}
      exportDisabled={exporting}
    >
      <PaginatedTableReference
        columns={columns}
        fetcher={fetcher}
        height="calc(100vh - 220px)"
        showSearch={false}
        showPagination={false}
        onTotalChange={setTotalCount}
        columnFilterValues={columnFilterValues}
        onColumnFilterChange={handleColumnFilterChange}
        filterParams={{
          utr: toOptionalFilterValue(filters.utr || ""),
          utr_op: toOptionalFilterValue(filters.utr_op || ""),
          bankName: toOptionalFilterValue(filters.bankName || ""),
          bankName_op: toOptionalFilterValue(filters.bankName_op || ""),
          bankId: toOptionalFilterValue(filters.bankId || ""),
          status: toOptionalFilterValue(filters.status || ""),
          amount: toOptionalFilterValue(filters.amount || ""),
          amount_to: toOptionalFilterValue(filters.amount_to || ""),
          amount_op: toOptionalFilterValue(filters.amount_op || ""),
          totalAmount: toOptionalFilterValue(filters.totalAmount || ""),
          totalAmount_to: toOptionalFilterValue(filters.totalAmount_to || ""),
          totalAmount_op: toOptionalFilterValue(filters.totalAmount_op || ""),
          player: toOptionalFilterValue(filters.player || ""),
          createdBy: toOptionalFilterValue(filters.createdBy || ""),
          createdAt_from: toOptionalFilterValue(filters.createdAt_from || ""),
          createdAt_to: toOptionalFilterValue(filters.createdAt_to || ""),
          createdAt_op: toOptionalFilterValue(filters.createdAt_op || ""),
        }}
        page={page}
        limit={limit}
        sortBy={sortBy || "createdAt"}
        sortOrder={sortOrder || "desc"}
        onPageChange={(zeroBased) => setPage(zeroBased + 1)}
        onRowsPerPageChange={setLimit}
        onSortChange={(field, order) => setSort(field, order)}
        compactDensity
      />
      <PaginationControlsReference
        page={page - 1}
        rowsPerPage={limit}
        totalCount={totalCount}
        onPageChange={(zeroBased) => setPage(zeroBased + 1)}
        onRowsPerPageChange={setLimit}
        rowsPerPageOptions={[10, 20, 50, 100, 200]}
      />
    </ListingPageContainer>
  );
}
