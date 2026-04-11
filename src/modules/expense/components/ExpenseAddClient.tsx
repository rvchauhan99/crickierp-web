"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconDeviceFloppy, IconPencil, IconX, IconCheck, IconPlus } from "@tabler/icons-react";
import { AutocompleteField, type AutocompleteOption } from "@/components/common/AutocompleteField";
import { FormActions, FormContainer } from "@/components/common/FormContainer";
import { FormGrid } from "@/components/common/FormGrid";
import { FieldLabel } from "@/components/common/FieldLabel";
import { FieldError } from "@/components/common/FieldError";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { createExpense, listExpenseTypes, listExpensesNormalized, updateExpense } from "@/services/expenseService";
import { listBanksNormalized } from "@/services/bankService";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/lib/apiError";
import type { ExpenseRow } from "@/types/expense";

const COLUMN_FILTER_KEYS = [
  "expenseTypeId",
  "bankId",
  "status",
  "amount",
  "amount_to",
  "amount_op",
  "createdBy",
  "expenseDate_from",
  "expenseDate_to",
  "expenseDate_op",
];

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toOptionalFilterValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

type UserRow = {
  _id?: string;
  id?: string;
  fullName?: string;
  username?: string;
};

function buildUserLabel(row: UserRow): string {
  const fn = row.fullName?.trim();
  const un = row.username?.trim();
  if (fn && un) return `${fn} (${un})`;
  return fn || un || "";
}

export function ExpenseAddClient() {
  const listingState = useListingQueryStateReference({
    defaultLimit: 10,
    filterKeys: COLUMN_FILTER_KEYS,
  });
  const { page, limit, sortBy, sortOrder, filters, setPage, setLimit, setFilter, setSort, clearFilters } =
    listingState;

  const expenseListFetcher = useCallback(async (params: Record<string, unknown>) => {
    return listExpensesNormalized(params);
  }, []);

  const expenseTableColumnFilterValues = useMemo(() => ({ ...filters }), [filters]);

  const expenseTableFilterParams = useMemo(
    () => ({
      expenseTypeId: toOptionalFilterValue(filters.expenseTypeId || ""),
      bankId: toOptionalFilterValue(filters.bankId || ""),
      status: toOptionalFilterValue(filters.status || ""),
      amount: toOptionalFilterValue(filters.amount || ""),
      amount_to: toOptionalFilterValue(filters.amount_to || ""),
      amount_op: toOptionalFilterValue(filters.amount_op || ""),
      createdBy: toOptionalFilterValue(filters.createdBy || ""),
      expenseDate_from: toOptionalFilterValue(filters.expenseDate_from || ""),
      expenseDate_to: toOptionalFilterValue(filters.expenseDate_to || ""),
      expenseDate_op: toOptionalFilterValue(filters.expenseDate_op || ""),
    }),
    [filters],
  );

  const handleExpenseColumnFilterChange = useCallback(
    (k: string, v: string) => setFilter(k, v),
    [setFilter],
  );

  const [expenseTypeId, setExpenseTypeId] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayYmd);
  const [description, setDescription] = useState("");
  const [bankId, setBankId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    expenseTypeId?: string;
    amount?: string;
    expenseDate?: string;
  }>({});

  const [totalCount, setTotalCount] = useState(0);
  const [tableKey, setTableKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadTypeOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const rows = await listExpenseTypes();
      const q = query.trim().toLowerCase();
      return rows
        .filter((r) => !q || r.name.toLowerCase().includes(q) || (r.code ?? "").toLowerCase().includes(q))
        .map((r) => ({
          value: r._id,
          label: r.code ? `${r.name} (${r.code})` : r.name,
        }));
    } catch {
      return [];
    }
  }, []);

  const loadBankOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const res = await listBanksNormalized({
        page: 1,
        limit: 25,
        q: query || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      return res.data.map((b) => ({
        value: b.id,
        label: `${b.holderName} - ${b.bankName} (${String(b.accountNumber).slice(-4)})`,
      }));
    } catch {
      return [];
    }
  }, []);

  const loadUserOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const response = await userService.list({
        q: query || undefined,
        page: 1,
        limit: 20,
        sortBy: "fullName",
        sortOrder: "asc",
      });
      const rows = Array.isArray(response?.data) ? (response.data as UserRow[]) : [];
      return rows
        .map((row) => ({
          value: String(row._id ?? row.id ?? "").trim(),
          label: buildUserLabel(row),
        }))
        .filter((o) => o.value.length > 0 && o.label.length > 0);
    } catch {
      return [];
    }
  }, []);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setExpenseTypeId("");
    setAmount("");
    setExpenseDate(todayYmd());
    setDescription("");
    setBankId("");
    setErrors({});
  }, []);

  const onSubmit = async () => {
    const next: typeof errors = {};
    if (!expenseTypeId.trim()) next.expenseTypeId = "Expense type is required.";
    const amt = Number(amount);
    if (!amount.trim() || Number.isNaN(amt) || amt < 0.01) next.amount = "Enter a valid amount.";
    if (!expenseDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate.trim())) {
      next.expenseDate = "Expense date is required (YYYY-MM-DD).";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      if (editingId) {
        await updateExpense(editingId, {
          expenseTypeId: expenseTypeId.trim(),
          amount: amt,
          expenseDate: expenseDate.trim(),
          description: description.trim() || undefined,
          bankId: bankId.trim() || null,
        });
        toast.success("Expense updated.");
      } else {
        await createExpense({
          expenseTypeId: expenseTypeId.trim(),
          amount: amt,
          expenseDate: expenseDate.trim(),
          description: description.trim() || undefined,
          bankId: bankId.trim() || undefined,
        });
        toast.success("Expense created. Pending audit.");
      }
      resetForm();
      setTableKey((k) => k + 1);
    } catch (error: unknown) {
      const msg = editingId ? "Failed to update expense" : "Failed to create expense";
      toast.error(getApiErrorMessage(error, msg));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (row: ExpenseRow) => {
    setEditingId(row.id);
    setExpenseTypeId(row.expenseTypeId || "");
    setAmount(String(row.amount));
    setExpenseDate(row.expenseDate || todayYmd());
    setDescription(row.description || "");
    setBankId(row.bankId || "");
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const columns = useMemo<PaginatedTableReferenceColumn[]>(
    () => [
      {
        field: "expenseDate",
        label: "Date",
        ...tableColumnPresets.dateCol,
        sortable: true,
        filterType: "date" as const,
        filterKey: "expenseDate_from",
        filterKeyTo: "expenseDate_to",
        operatorKey: "expenseDate_op",
      },
      {
        field: "expenseTypeName",
        label: "Type",
        render: (row: ExpenseRow) => row.expenseTypeName || "—",
        minWidth: 150,
        filterType: "autocomplete" as const,
        filterKey: "expenseTypeId",
        filterLoadOptions: loadTypeOptions,
      },
      {
        field: "bankName",
        label: "Bank",
        render: (row: ExpenseRow) => row.bankName || "—",
        minWidth: 150,
        filterType: "autocomplete" as const,
        filterKey: "bankId",
        filterLoadOptions: loadBankOptions,
      },
      {
        field: "amount",
        label: "Amount",
        render: (row: ExpenseRow) => row.amount.toLocaleString(),
        sortable: true,
        minWidth: 110,
        filterType: "number" as const,
        filterKey: "amount",
        filterKeyTo: "amount_to",
        operatorKey: "amount_op",
      },
      {
        field: "status",
        label: "Status",
        ...tableColumnPresets.statusCol,
        render: (row: ExpenseRow) => <TableStatusBadge status={row.status} />,
        filterType: "select" as const,
        filterKey: "status",
        filterOptions: [
          { label: "Pending", value: "pending_audit" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
        ],
      },
      {
        field: "createdBy",
        label: "Created By",
        render: (row: ExpenseRow) => row.createdByName || "—",
        minWidth: 150,
        filterType: "autocomplete" as const,
        filterKey: "createdBy",
        filterLoadOptions: loadUserOptions,
      },
      {
        field: "actions",
        label: "Actions",
        isActionColumn: true,
        ...tableColumnPresets.actionsCol,
        render: (row: ExpenseRow) =>
          row.status === "pending_audit" ? (
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<IconPencil size={16} />}
              onClick={() => handleEditClick(row)}
            >
              Edit
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    ],
    [loadTypeOptions, loadBankOptions, loadUserOptions],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 pb-4">
      <div className="w-full shrink-0">
        <FormContainer
          className="!flex-none"
          title={editingId ? "Update pending expense" : "Add new expense"}
          description={
            editingId
              ? "Correct the details below. Changes will be saved to the existing pending record."
              : "Enter the details for a new business expense. All entries require audit approval."
          }
        >
          <FormGrid className="md:grid-cols-4">
            <div className="space-y-1.5">
              <FieldLabel>Expense type *</FieldLabel>
              <AutocompleteField
                value={expenseTypeId}
                onChange={setExpenseTypeId}
                loadOptions={loadTypeOptions}
                placeholder="Select type"
              />
              <FieldError message={errors.expenseTypeId} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Amount *</FieldLabel>
              <Input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              <FieldError message={errors.amount} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Expense date *</FieldLabel>
              <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
              <FieldError message={errors.expenseDate} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Description (optional)</FieldLabel>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Memo" />
            </div>
            <div className="md:col-span-4 space-y-1.5 border-t border-[var(--border)] pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <FieldLabel>Debit Account (optional)</FieldLabel>
                  <p className="text-[10px] text-muted-foreground">Optional at this stage.</p>
                </div>
                <div className="w-full max-w-xs">
                  <AutocompleteField
                    value={bankId}
                    onChange={setBankId}
                    loadOptions={loadBankOptions}
                    placeholder="Search bank…"
                  />
                </div>
              </div>
            </div>
          </FormGrid>
          <FormActions className="justify-between px-5 py-4">
            <Button
              type="button"
              variant={editingId ? "success" : "primary"}
              onClick={() => void onSubmit()}
              disabled={loading}
              leftIcon={editingId ? <IconDeviceFloppy size={18} /> : <IconPlus size={18} />}
            >
              {loading ? (editingId ? "Updating…" : "Adding…") : editingId ? "Update expense" : "Add expense"}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm} disabled={loading} leftIcon={<IconX size={18} />}>
                Cancel edit
              </Button>
            )}
          </FormActions>
        </FormContainer>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ListingPageContainer
          title="Recent expense entries"
          description="View and manage your recently submitted expenses. Click edit on pending items to correct details."
          density="compact"
          fullWidth
          secondaryButtonLabel="Reset filters"
          onSecondaryClick={() => clearFilters({ keepQuickSearch: true })}
        >
          <PaginatedTableReference
            key={tableKey}
            columns={columns}
            fetcher={expenseListFetcher}
            height="calc(100vh - 400px)"
            showSearch={false}
            showPagination={false}
            onTotalChange={setTotalCount}
            columnFilterValues={expenseTableColumnFilterValues}
            onColumnFilterChange={handleExpenseColumnFilterChange}
            filterParams={expenseTableFilterParams}
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
      </div>
    </div>
  );
}
