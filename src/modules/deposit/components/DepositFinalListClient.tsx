"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { useExport } from "@/hooks/useExport";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { exportDeposits, listDepositsNormalized } from "@/services/depositService";
import type { DepositRow } from "@/types/deposit";
import { userService } from "@/services/userService";
import { DEPOSIT_FINAL_FILTER_KEYS } from "@/modules/deposit/depositFinalListConstants";
import { DepositFinalListFilterPanel } from "@/modules/deposit/components/DepositFinalListFilterPanel";

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
    defaultLimit: 50,
    filterKeys: [...DEPOSIT_FINAL_FILTER_KEYS],
  });
  const {
    page,
    limit,
    q,
    sortBy,
    sortOrder,
    filters,
    setPage,
    setLimit,
    setSort,
    setQ,
    setFilters,
    clearFilters,
  } = listingState;

  const [totalCount, setTotalCount] = useState(0);
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

  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    return listDepositsNormalized("final", params);
  }, []);

  const filterParams = useMemo(
    () => ({
      q: toOptionalFilterValue(q || ""),
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
    }),
    [filters, q],
  );

  const { exporting, handleExport } = useExport((params) => exportDeposits("final", params), {
    fileName: `deposits-final-${new Date().toISOString().split("T")[0]}.xlsx`,
  });

  const onExportClick = useCallback(() => {
    handleExport({
      page: 1,
      limit: 10000,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
      q: toOptionalFilterValue(q || ""),
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
  }, [handleExport, filters, sortBy, sortOrder, q]);

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
      },
      {
        field: "utr",
        label: "UTR",
        render: (row: DepositRow) => row.utr,
        minWidth: 130,
        sortable: true,
      },
      {
        field: "amount",
        label: "Amount",
        render: (row: DepositRow) => row.amount.toLocaleString(),
        sortable: true,
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
      },
      {
        field: "createdAt",
        label: "Created at",
        sortable: true,
        ...tableColumnPresets.dateCol,
        render: (row: DepositRow) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"),
      },
    ],
    [cachedUsers],
  );

  return (
    <ListingPageContainer
      title="Deposit / Final list"
      description="All deposits including rejections. Use advanced filters for UTR, bank, status, dates, and more."
      density="compact"
      fullWidth
      secondaryButtonLabel="Reset filters"
      onSecondaryClick={() => clearFilters({ keepQuickSearch: true })}
      exportButtonLabel="Export"
      onExportClick={onExportClick}
      exportDisabled={exporting}
      filters={
        <DepositFinalListFilterPanel
          q={q}
          filters={filters}
          setQ={setQ}
          setFilters={setFilters}
          onClear={() => clearFilters({ keepQuickSearch: false })}
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="min-h-0 flex-1 overflow-hidden">
          <PaginatedTableReference
            columns={columns}
            fetcher={fetcher}
            height="calc(100vh - 300px)"
            showSearch={false}
            showPagination={false}
            onTotalChange={setTotalCount}
            filterParams={filterParams}
            page={page}
            limit={limit}
            sortBy={sortBy || "createdAt"}
            sortOrder={sortOrder || "desc"}
            onPageChange={(zeroBased) => setPage(zeroBased + 1)}
            onRowsPerPageChange={setLimit}
            onSortChange={(field, order) => setSort(field, order)}
            compactDensity={false}
          />
        </div>
        <PaginationControlsReference
          page={page - 1}
          rowsPerPage={limit}
          totalCount={totalCount}
          onPageChange={(zeroBased) => setPage(zeroBased + 1)}
          onRowsPerPageChange={setLimit}
          rowsPerPageOptions={[10, 20, 50, 100, 200]}
        />
      </div>
    </ListingPageContainer>
  );
}
