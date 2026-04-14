"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { DetailsSidebar } from "@/components/common/DetailsSidebar";
import { Button } from "@/components/ui/Button";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  exportExpenses,
  getExpenseDocumentViewUrl,
  listExpensesNormalized,
} from "@/services/expenseService";
import type { ExpenseRow } from "@/types/expense";
import { EXPENSE_FINAL_FILTER_KEYS } from "@/modules/expense/expenseFinalListConstants";
import { ExpenseFinalListFilterPanel } from "@/modules/expense/components/ExpenseFinalListFilterPanel";

function toOptionalFilterValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
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
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRow | null>(null);
  const [viewingDocIndex, setViewingDocIndex] = useState<number | null>(null);

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

  const closeSidebar = useCallback(() => {
    setSelectedExpense(null);
    setViewingDocIndex(null);
  }, []);

  const onViewDocument = useCallback(
    async (docIndex: number) => {
      if (!selectedExpense) return;
      setViewingDocIndex(docIndex);
      try {
        const data = await getExpenseDocumentViewUrl(selectedExpense.id, docIndex);
        const url = String(data.url || "").trim();
        if (!url) {
          toast.error("Document URL is unavailable.");
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, "Failed to open document"));
      } finally {
        setViewingDocIndex(null);
      }
    },
    [selectedExpense],
  );

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
            onRowClick={(row) => setSelectedExpense(row as ExpenseRow)}
            selectedRowKey={selectedExpense?.id ?? null}
            getRowKey={(row) => String((row as ExpenseRow).id)}
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
      <DetailsSidebar
        open={!!selectedExpense}
        title="Expense Details"
        subtitle={selectedExpense ? `Amount: ₹${selectedExpense.amount.toLocaleString()}` : undefined}
        onClose={closeSidebar}
        width="420px"
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Expense Info</p>
                <TableStatusBadge status={selectedExpense.status} />
              </div>
              <dl className="space-y-2">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Type</dt>
                  <dd className="text-sm text-gray-800">{selectedExpense.expenseTypeName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Expense date</dt>
                  <dd className="text-sm text-gray-800">{selectedExpense.expenseDate || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Bank</dt>
                  <dd className="text-sm text-gray-800">{selectedExpense.bankName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Description</dt>
                  <dd className="text-sm text-gray-800">{selectedExpense.description || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Created by</dt>
                  <dd className="text-sm text-gray-800">{selectedExpense.createdByName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Approved by</dt>
                  <dd className="text-sm text-gray-800">{selectedExpense.approvedByName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Created at</dt>
                  <dd className="text-sm text-gray-800">{formatDateTime(selectedExpense.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Updated at</dt>
                  <dd className="text-sm text-gray-800">{formatDateTime(selectedExpense.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-white p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Documents</p>
              {Array.isArray(selectedExpense.documents) && selectedExpense.documents.length > 0 ? (
                <div className="space-y-2">
                  {selectedExpense.documents.map((doc, index) => (
                    <div
                      key={`${doc.path}-${index}`}
                      className="flex items-center justify-between rounded-md border border-[var(--border)] bg-slate-50 px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-gray-800">{doc.filename}</p>
                        <p className="text-[11px] text-gray-500">
                          {formatFileSize(doc.size)} • {doc.mime_type || "file"} • {formatDateTime(doc.uploaded_at)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="shrink-0"
                        disabled={viewingDocIndex === index}
                        onClick={() => void onViewDocument(index)}
                      >
                        {viewingDocIndex === index ? "Opening..." : "View"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No documents uploaded.</p>
              )}
            </div>
          </div>
        )}
      </DetailsSidebar>
    </ListingPageContainer>
  );
}
