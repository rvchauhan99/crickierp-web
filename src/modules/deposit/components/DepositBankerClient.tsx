"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
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
import {
  createDeposit,
  exportDeposits,
  listDepositsNormalized,
  updateDeposit,
} from "@/services/depositService";
import { useExport } from "@/hooks/useExport";
import {
  depositStatusApiParam,
  depositStatusColumnSelectValue,
} from "@/modules/deposit/depositListingStatusFilter";
import { listBanksNormalized } from "@/services/bankService";
import type { DepositRow } from "@/types/deposit";
import { getApiErrorMessage } from "@/lib/apiError";

const COLUMN_FILTER_KEYS = [
  "utr",
  "utr_op",
  "bankName",
  "bankName_op",
  "status",
  "amount",
  "amount_to",
  "amount_op",
  "createdAt_from",
  "createdAt_to",
  "createdAt_op",
];

function toOptionalFilterValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function formatRelative(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h ago`;
  const days = Math.floor(h / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function DepositBankerClient() {
  const listingState = useListingQueryStateReference({
    defaultLimit: 20,
    filterKeys: COLUMN_FILTER_KEYS,
  });
  const { page, limit, sortBy, sortOrder, filters, setPage, setLimit, setFilter, setSort, clearFilters } =
    listingState;

  const [bankId, setBankId] = useState("");
  const [bankAutocompleteDefault, setBankAutocompleteDefault] = useState<AutocompleteOption | null>(null);
  const bankIdRef = useRef(bankId);
  const hasConsumedInitialListMetaRef = useRef(false);

  useEffect(() => {
    bankIdRef.current = bankId;
  }, [bankId]);
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ bankId?: string; utr?: string; amount?: string }>({});
  const [totalCount, setTotalCount] = useState(0);
  const [tableKey, setTableKey] = useState(0);
  const [editDeposit, setEditDeposit] = useState<DepositRow | null>(null);
  const [editBankId, setEditBankId] = useState("");
  const [editUtr, setEditUtr] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState<{ bankId?: string; utr?: string; amount?: string }>({});

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
        label: `${b.holderName} - ${b.bankName} (${b.accountNumber.slice(-4)})`,
      }));
    } catch {
      return [];
    }
  }, []);

  const onSubmit = async () => {
    const next: typeof errors = {};
    if (!bankId.trim()) next.bankId = "Bank is required.";
    if (!utr.trim()) next.utr = "UTR is required.";
    const amt = Number(amount);
    if (!amount.trim() || Number.isNaN(amt) || amt < 1) next.amount = "Amount must be at least 1.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await createDeposit({ bankId: bankId.trim(), utr: utr.trim(), amount: amt });
      toast.success("Deposit recorded successfully.");
      setUtr("");
      setAmount("");
      setErrors({});
      setTableKey((k) => k + 1);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to record deposit"));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setBankId("");
    setBankAutocompleteDefault(null);
    setUtr("");
    setAmount("");
    setErrors({});
  };

  const closeEdit = () => {
    setEditDeposit(null);
    setEditBankId("");
    setEditUtr("");
    setEditAmount("");
    setEditErrors({});
  };

  const onEditSubmit = async () => {
    if (!editDeposit) return;
    const next: typeof editErrors = {};
    if (!editBankId.trim()) next.bankId = "Bank is required.";
    if (!editUtr.trim()) next.utr = "UTR is required.";
    const amt = Number(editAmount);
    if (!editAmount.trim() || Number.isNaN(amt) || amt < 1) next.amount = "Amount must be at least 1.";
    setEditErrors(next);
    if (Object.keys(next).length > 0) return;

    setEditLoading(true);
    try {
      await updateDeposit(editDeposit.id, {
        bankId: editBankId.trim(),
        utr: editUtr.trim(),
        amount: amt,
      });
      toast.success("Deposit updated.");
      closeEdit();
      setTableKey((k) => k + 1);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update deposit"));
    } finally {
      setEditLoading(false);
    }
  };

  const columnFilterValues = useMemo(
    () => ({
      ...filters,
      status: depositStatusColumnSelectValue(filters.status),
    }),
    [filters],
  );

  const handleColumnFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === "status" && value === "") {
        setFilter("status", "all");
        return;
      }
      setFilter(key, value);
    },
    [setFilter],
  );

  const { exporting, handleExport } = useExport((params) => exportDeposits("banker", params), {
    fileName: `deposits-banker-${new Date().toISOString().split("T")[0]}.xlsx`,
  });

  const onExportClick = useCallback(() => {
    handleExport({
      page: 1,
      limit: 10000,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
      utr: toOptionalFilterValue(filters.utr || ""),
      utr_op: toOptionalFilterValue(filters.utr_op || ""),
      bankName: toOptionalFilterValue(filters.bankName || ""),
      bankName_op: toOptionalFilterValue(filters.bankName_op || ""),
      status: depositStatusApiParam(filters.status),
      amount: toOptionalFilterValue(filters.amount || ""),
      amount_to: toOptionalFilterValue(filters.amount_to || ""),
      amount_op: toOptionalFilterValue(filters.amount_op || ""),
      createdAt_from: toOptionalFilterValue(filters.createdAt_from || ""),
      createdAt_to: toOptionalFilterValue(filters.createdAt_to || ""),
      createdAt_op: toOptionalFilterValue(filters.createdAt_op || ""),
    });
  }, [handleExport, filters, sortBy, sortOrder]);

  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    const res = await listDepositsNormalized("banker", params);
    if (!hasConsumedInitialListMetaRef.current) {
      hasConsumedInitialListMetaRef.current = true;
      const hint = res.meta.lastBankerDeposit;
      if (hint?.bankId && bankIdRef.current === "") {
        setBankId(hint.bankId);
        setBankAutocompleteDefault({ value: hint.bankId, label: hint.bankName });
      }
    }
    return res;
  }, []);

  const columns = useMemo<PaginatedTableReferenceColumn[]>(
    () => [
      {
        field: "utr",
        label: "UTR",
        render: (row: DepositRow) => row.utr,
        minWidth: 140,
        sortable: true,
        filterType: "text" as const,
        filterKey: "utr",
        operatorKey: "utr_op",
        defaultFilterOperator: "contains",
      },
      {
        field: "bankName",
        label: "Bank / Holder",
        render: (row: DepositRow) => row.bankName,
        ...tableColumnPresets.nameCol,
        sortable: true,
        filterType: "text" as const,
        filterKey: "bankName",
        operatorKey: "bankName_op",
        defaultFilterOperator: "contains",
      },
      {
        field: "amount",
        label: "Amount",
        render: (row: DepositRow) => row.amount.toLocaleString(),
        sortable: true,
        minWidth: 110,
        filterType: "number" as const,
        filterKey: "amount",
        filterKeyTo: "amount_to",
        operatorKey: "amount_op",
        defaultFilterOperator: "equals",
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
        field: "due",
        label: "Due time",
        sortable: false,
        minWidth: 120,
        render: (row: DepositRow) => formatRelative(row.createdAt),
      },
      {
        field: "createdAt",
        label: "Created at",
        sortable: true,
        filterType: "date" as const,
        filterKey: "createdAt_from",
        filterKeyTo: "createdAt_to",
        operatorKey: "createdAt_op",
        ...tableColumnPresets.dateCol,
        render: (row: DepositRow) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"),
      },
      {
        field: "actions",
        label: "Actions",
        isActionColumn: true,
        ...tableColumnPresets.actionsCol,
        sortable: false,
        render: (row: DepositRow) =>
          row.status === "pending" ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              startIcon={<IconPencil size={16} />}
              onClick={() => {
                setEditDeposit(row);
                setEditBankId(row.bankId ?? "");
                setEditUtr(row.utr);
                setEditAmount(String(row.amount));
                setEditErrors({});
              }}
            >
              Edit
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 pb-4">
      {/* FormContainer defaults to flex-1; without shrink-0 the table steals height and the add form can disappear above the fold. */}
      <div className="w-full shrink-0">
        <FormContainer
          className="!flex-none"
          title="Banker deposit"
          description="Select a bank account, enter UTR and amount. Pending items appear below and in Exchange Depositors."
        >
        <FormGrid>
          <div className="md:col-span-2">
            <FieldLabel>Bank *</FieldLabel>
            <AutocompleteField
              value={bankId}
              onChange={setBankId}
              loadOptions={loadBankOptions}
              placeholder="Search bank..."
              emptyText="No banks found"
              defaultOption={bankAutocompleteDefault}
            />
            <FieldError message={errors.bankId} />
          </div>
          <div>
            <FieldLabel>UTR *</FieldLabel>
            <Input placeholder="UTR" value={utr} onChange={(e) => setUtr(e.target.value)} />
            <FieldError message={errors.utr} />
          </div>
          <div>
            <FieldLabel>Amount *</FieldLabel>
            <Input
              type="number"
              min={1}
              step="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <FieldError message={errors.amount} />
          </div>
        </FormGrid>
        <FormActions className="justify-between px-5 py-4">
          <Button
            type="button"
            variant="success"
            startIcon={<IconCheck size={18} />}
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="danger" startIcon={<IconX size={18} />} onClick={reset} disabled={loading}>
            Clear
          </Button>
        </FormActions>
        </FormContainer>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
      <ListingPageContainer
        title="Deposits awaiting exchange"
        description="Entries pending exchange action (same queue as Exchange Depositors)."
        density="compact"
        fullWidth
        secondaryButtonLabel="Reset filters"
        onSecondaryClick={() => clearFilters({ keepQuickSearch: true })}
        exportButtonLabel="Export"
        onExportClick={onExportClick}
        exportDisabled={exporting}
      >
        <PaginatedTableReference
          key={tableKey}
          columns={columns}
          fetcher={fetcher}
          height="min(520px, calc(100vh - 320px))"
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
            status: depositStatusApiParam(filters.status),
            amount: toOptionalFilterValue(filters.amount || ""),
            amount_to: toOptionalFilterValue(filters.amount_to || ""),
            amount_op: toOptionalFilterValue(filters.amount_op || ""),
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
      </div>

      {editDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <div className="card w-full max-w-lg space-y-4 p-5">
            <h3 className="text-lg font-semibold">Edit pending deposit</h3>
            <p className="text-sm text-muted-foreground">
              Bank, UTR, and amount can be corrected while the deposit is pending.
            </p>
            <FormGrid>
              <div className="md:col-span-2">
                <FieldLabel>Bank *</FieldLabel>
            <AutocompleteField
              value={editBankId}
              onChange={setEditBankId}
              loadOptions={loadBankOptions}
              placeholder="Search bank..."
              emptyText="No banks found"
              defaultOption={
                editDeposit && editBankId
                  ? { value: editBankId, label: editDeposit.bankName.trim() || "—" }
                  : null
              }
            />
                <FieldError message={editErrors.bankId} />
              </div>
              <div>
                <FieldLabel>UTR *</FieldLabel>
                <Input placeholder="UTR" value={editUtr} onChange={(e) => setEditUtr(e.target.value)} />
                <FieldError message={editErrors.utr} />
              </div>
              <div>
                <FieldLabel>Amount *</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  step="1"
                  placeholder="0"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
                <FieldError message={editErrors.amount} />
              </div>
            </FormGrid>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={closeEdit} disabled={editLoading}>
                Cancel
              </Button>
              <Button type="button" variant="success" onClick={onEditSubmit} disabled={editLoading}>
                {editLoading ? "Updating…" : "Update"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
