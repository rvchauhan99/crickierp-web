"use client";

import { useCallback, useMemo, useState } from "react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { useExport } from "@/hooks/useExport";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { exportWithdrawals, listWithdrawalsNormalized } from "@/services/withdrawalService";
import type { WithdrawalRow } from "@/types/withdrawal";
import { withdrawalStatusApiParam } from "@/modules/withdrawal/withdrawalListingStatusFilter";
import { WITHDRAWAL_FINAL_FILTER_KEYS } from "@/modules/withdrawal/withdrawalFinalListConstants";
import { WithdrawalFinalListFilterPanel } from "@/modules/withdrawal/components/WithdrawalFinalListFilterPanel";

function toOptionalFilterValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function WithdrawalFinalListClient() {
  const listingState = useListingQueryStateReference({
    defaultLimit: 50,
    filterKeys: [...WITHDRAWAL_FINAL_FILTER_KEYS],
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
  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    return listWithdrawalsNormalized("final", params);
  }, []);

  const filterParams = useMemo(
    () => ({
      q: toOptionalFilterValue(q || ""),
      utr: toOptionalFilterValue(filters.utr || ""),
      utr_op: toOptionalFilterValue(filters.utr_op || ""),
      playerName: toOptionalFilterValue(filters.playerName || ""),
      playerName_op: toOptionalFilterValue(filters.playerName_op || ""),
      bankName: toOptionalFilterValue(filters.bankName || ""),
      bankName_op: toOptionalFilterValue(filters.bankName_op || ""),
      status: withdrawalStatusApiParam(filters.status),
      amount: toOptionalFilterValue(filters.amount || ""),
      amount_to: toOptionalFilterValue(filters.amount_to || ""),
      amount_op: toOptionalFilterValue(filters.amount_op || ""),
      payableAmount: toOptionalFilterValue(filters.payableAmount || ""),
      payableAmount_to: toOptionalFilterValue(filters.payableAmount_to || ""),
      payableAmount_op: toOptionalFilterValue(filters.payableAmount_op || ""),
      createdBy: toOptionalFilterValue(filters.createdBy || ""),
      approvedBy: toOptionalFilterValue(filters.approvedBy || ""),
      createdAt_from: toOptionalFilterValue(filters.createdAt_from || ""),
      createdAt_to: toOptionalFilterValue(filters.createdAt_to || ""),
      createdAt_op: toOptionalFilterValue(filters.createdAt_op || ""),
    }),
    [filters, q],
  );

  const { exporting, handleExport } = useExport(exportWithdrawals, {
    fileName: `withdrawals-final-${new Date().toISOString().split("T")[0]}.xlsx`,
  });

  const onExportClick = useCallback(() => {
    handleExport({
      view: "final",
      page: 1,
      limit: 10000,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
      q: toOptionalFilterValue(q || ""),
      utr: toOptionalFilterValue(filters.utr || ""),
      utr_op: toOptionalFilterValue(filters.utr_op || ""),
      playerName: toOptionalFilterValue(filters.playerName || ""),
      playerName_op: toOptionalFilterValue(filters.playerName_op || ""),
      bankName: toOptionalFilterValue(filters.bankName || ""),
      bankName_op: toOptionalFilterValue(filters.bankName_op || ""),
      status: withdrawalStatusApiParam(filters.status),
      amount: toOptionalFilterValue(filters.amount || ""),
      amount_to: toOptionalFilterValue(filters.amount_to || ""),
      amount_op: toOptionalFilterValue(filters.amount_op || ""),
      payableAmount: toOptionalFilterValue(filters.payableAmount || ""),
      payableAmount_to: toOptionalFilterValue(filters.payableAmount_to || ""),
      payableAmount_op: toOptionalFilterValue(filters.payableAmount_op || ""),
      createdBy: toOptionalFilterValue(filters.createdBy || ""),
      approvedBy: toOptionalFilterValue(filters.approvedBy || ""),
      createdAt_from: toOptionalFilterValue(filters.createdAt_from || ""),
      createdAt_to: toOptionalFilterValue(filters.createdAt_to || ""),
      createdAt_op: toOptionalFilterValue(filters.createdAt_op || ""),
    });
  }, [handleExport, filters, sortBy, sortOrder, q]);

  const columns = useMemo<PaginatedTableReferenceColumn[]>(
    () => [
      {
        field: "playerName",
        label: "Player",
        render: (row: WithdrawalRow) => row.playerName,
        ...tableColumnPresets.nameCol,
        sortable: true,
      },
      {
        field: "account",
        label: "Origin Bank",
        minWidth: 200,
        sortable: false,
        render: (row: WithdrawalRow) => (
          <div className="text-sm">
            <div>{row.accountNumber || "—"}</div>
            <div className="text-xs text-gray-500">{row.bankName}</div>
          </div>
        ),
      },
      {
        field: "payoutBankName",
        label: "Payout bank",
        minWidth: 160,
        sortable: false,
        render: (row: WithdrawalRow) => row.payoutBankName || "—",
      },
      {
        field: "utr",
        label: "UTR",
        sortable: true,
        render: (row: WithdrawalRow) => row.utr || "—",
      },
      {
        field: "amount",
        label: "Requested",
        render: (row: WithdrawalRow) => row.amount.toLocaleString(),
        sortable: true,
      },
      {
        field: "reverseBonus",
        label: "Reverse Bonus",
        render: (row: WithdrawalRow) => (row.reverseBonus != null ? row.reverseBonus.toLocaleString() : "—"),
        sortable: true,
      },
      {
        field: "payableAmount",
        label: "Payable",
        render: (row: WithdrawalRow) => (row.payableAmount != null ? row.payableAmount.toLocaleString() : "—"),
        sortable: true,
        minWidth: 100,
      },
      {
        field: "status",
        label: "Status",
        ...tableColumnPresets.statusCol,
        render: (row: WithdrawalRow) => <TableStatusBadge status={row.status} />,
      },
      {
        field: "createdByName",
        label: "Created By",
        render: (row: WithdrawalRow) => row.createdByName || "—",
        minWidth: 150,
      },
      {
        field: "approvedByName",
        label: "Approved By",
        render: (row: WithdrawalRow) => row.approvedByName || "—",
        minWidth: 150,
      },
      {
        field: "createdAt",
        label: "Created at",
        sortable: true,
        ...tableColumnPresets.dateCol,
        render: (row: WithdrawalRow) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"),
      },
    ],
    [],
  );

  return (
    <ListingPageContainer
      title="Withdrawal / Final list"
      description="All withdrawals including rejections. Use advanced filters for UTR, player, bank, status, and dates."
      density="compact"
      fullWidth
      secondaryButtonLabel="Reset filters"
      onSecondaryClick={() => clearFilters({ keepQuickSearch: true })}
      exportButtonLabel="Export"
      onExportClick={onExportClick}
      exportDisabled={exporting}
      filters={
        <WithdrawalFinalListFilterPanel
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
          rowsPerPageOptions={[20, 50, 100, 200]}
        />
      </div>
    </ListingPageContainer>
  );
}

