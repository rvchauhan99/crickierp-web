"use client";

import { useCallback, useMemo, useState } from "react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { exportExpenses, listExpensesNormalized } from "@/services/expenseService";
import type { ExpenseRow } from "@/types/expense";
import { EXPENSE_FINAL_FILTER_KEYS } from "@/modules/expense/expenseFinalListConstants";
import { ExpenseFinalListFilterPanel } from "@/modules/expense/components/ExpenseFinalListFilterPanel";

function toOptionalFilterValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function ExpenseListClient() {
  const listingState = useListingQueryStateReference({
    defaultLimit: 50,
    filterKeys: [...EXPENSE_FINAL_FILTER_KEYS],
  });
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    setPage,
    setLimit,
    setFilter, // note: setFilters used in panel, but listingState has setFilter
    setSort,
    setQ,
    setFilters,
    clearFilters,
    q,
  } = listingState;

  const [totalCount, setTotalCount] = useState(0);
  const [exporting, setExporting] = useState(false);

  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    return listExpensesNormalized(params);
  }, []);

  const filterParams = useMemo(
    () => ({
      q: toOptionalFilterValue(q || ""),
      status: toOptionalFilterValue(filters.status || ""),
      expenseTypeId: toOptionalFilterValue(filters.expenseTypeId || ""),
      bankId: toOptionalFilterValue(filters.bankId || ""),
      amount: toOptionalFilterValue(filters.amount || ""),
      amount_to: toOptionalFilterValue(filters.amount_to || ""),
      amount_op: toOptionalFilterValue(filters.amount_op || ""),
      createdBy: toOptionalFilterValue(filters.createdBy || ""),
      approvedBy: toOptionalFilterValue(filters.approvedBy || ""),
      createdAt_from: toOptionalFilterValue(filters.createdAt_from || ""),
      createdAt_to: toOptionalFilterValue(filters.createdAt_to || ""),
      createdAt_op: toOptionalFilterValue(filters.createdAt_op || ""),
      expenseDate_from: toOptionalFilterValue(filters.expenseDate_from || ""),
      expenseDate_to: toOptionalFilterValue(filters.expenseDate_to || ""),
      expenseDate_op: toOptionalFilterValue(filters.expenseDate_op || ""),
    }),
    [filters, q],
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportExpenses({
        page: 1,
        limit,
        sortBy: sortBy || "createdAt",
        sortOrder: sortOrder || "desc",
        ...filterParams,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Failed to export.");
    } finally {
      setExporting(false);
    }
  }, [filterParams, sortBy, sortOrder, limit]);

  const columns = useMemo<PaginatedTableReferenceColumn[]>(
    () => [
      {
        field: "expenseDate",
        label: "Expense date",
        sortable: true,
        ...tableColumnPresets.dateCol,
        render: (row: ExpenseRow) => (row.expenseDate ? row.expenseDate : "—"),
      },
      {
        field: "expenseTypeName",
        label: "Type",
        render: (row: ExpenseRow) => row.expenseTypeName ?? "—",
        ...tableColumnPresets.nameCol,
        sortable: false,
      },
      {
        field: "amount",
        label: "Amount",
        sortable: true,
        minWidth: 100,
        render: (row: ExpenseRow) => (row.amount != null ? row.amount.toLocaleString() : "—"),
      },
      {
        field: "status",
        label: "Status",
        ...tableColumnPresets.statusCol,
        render: (row: ExpenseRow) => <TableStatusBadge status={row.status} />,
        sortable: true,
      },
      {
        field: "bankName",
        label: "Bank",
        render: (row: ExpenseRow) => row.bankName || "—",
        ...tableColumnPresets.nameCol,
        sortable: true,
      },
      {
        field: "description",
        label: "Description",
        render: (row: ExpenseRow) => row.description || "—",
        minWidth: 200,
        sortable: false,
      },
      {
        field: "createdByName",
        label: "Created by",
        render: (row: ExpenseRow) => row.createdByName ?? "—",
        minWidth: 150,
        sortable: false,
      },
      {
        field: "approvedByName",
        label: "Approved by",
        render: (row: ExpenseRow) => row.approvedByName ?? "—",
        minWidth: 150,
        sortable: false,
      },
      {
        field: "createdAt",
        label: "Audit Created",
        sortable: true,
        ...tableColumnPresets.dateCol,
        render: (row: ExpenseRow) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"),
      },
    ],
    [],
  );

  return (
    <ListingPageContainer
      title="Expenses / List"
      description="Historical expense records. Use advanced filters for audit types, banks, status, and dates."
      fullWidth
      secondaryButtonLabel="Reset filters"
      onSecondaryClick={() => clearFilters({ keepQuickSearch: true })}
      exportButtonLabel="Export"
      onExportClick={handleExport}
      exportDisabled={exporting}
      filters={
        <ExpenseFinalListFilterPanel
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
