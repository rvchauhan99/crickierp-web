"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  IconCheck,
  IconX,
  IconUser,
  IconCreditCard,
  IconFileText,
  IconCurrencyRupee,
  IconClock,
  IconRefresh,
} from "@tabler/icons-react";
import { ConfirmSensitiveActionDialog } from "@/components/common/ConfirmSensitiveActionDialog";
import { AutocompleteField, type AutocompleteOption } from "@/components/common/AutocompleteField";
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
import { DetailsSidebar } from "@/components/common/DetailsSidebar";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { getApiErrorMessage } from "@/lib/apiError";
import { REASON_TYPES } from "@/lib/constants/reasonTypes";
import { formatWholeRupee } from "@/lib/formatWholeRupee";
import {
  listWithdrawalsNormalized,
  patchWithdrawalStatus,
  updateWithdrawalBankerPayout,
  exportWithdrawals,
} from "@/services/withdrawalService";
import { useExport } from "@/hooks/useExport";
import { listBankLookupOptions } from "@/services/lookupService";
import { userService } from "@/services/userService";
import type { WithdrawalRow } from "@/types/withdrawal";
import { useApprovalQueueAutoRefresh } from "@/hooks/useApprovalQueueAutoRefresh";

const COLUMN_FILTER_KEYS = [
  "utr",
  "utr_op",
  "playerName",
  "playerName_op",
  "bankName",
  "bankName_op",
  "amount",
  "amount_to",
  "amount_op",
  "createdBy",
  "approvedBy",
  "createdAt_from",
  "createdAt_to",
  "createdAt_op",
];

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

// ─── Detail card for sidebar ──────────────────────────────────────────────

function WithdrawalDetailCard({ withdrawal }: { withdrawal: WithdrawalRow }) {
  const items = [
    {
      icon: <IconUser className="size-4 shrink-0 text-[var(--brand-primary)]" />,
      label: "Player",
      value: withdrawal.playerName || "—",
    },
    {
      icon: <IconCreditCard className="size-4 shrink-0 text-[var(--brand-primary)]" />,
      label: "Acc No (Dest)",
      value: withdrawal.accountNumber || "—",
    },
    {
      icon: <IconFileText className="size-4 shrink-0 text-[var(--brand-primary)]" />,
      label: "Bank (Dest)",
      value: withdrawal.bankName || "—",
    },
    {
      icon: <IconCurrencyRupee className="size-4 shrink-0 text-[var(--brand-primary)]" />,
      label: "Payable amount",
      value: withdrawal.payableAmount != null ? formatWholeRupee(withdrawal.payableAmount) : "—",
    },
    {
      icon: <IconClock className="size-4 shrink-0 text-gray-400" />,
      label: "Requested at",
      value: withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleString() : "—",
    },
  ];

  return (
    <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Withdrawal Info</p>
        <TableStatusBadge status={withdrawal.status} />
      </div>
      <dl className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2.5">
            <span className="mt-0.5">{item.icon}</span>
            <div className="min-w-0 flex-1">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{item.label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800 truncate">{item.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function WithdrawalBankerClient() {
  const listingState = useListingQueryStateReference({
    defaultLimit: 20,
    filterKeys: COLUMN_FILTER_KEYS,
  });
  const { page, limit, sortBy, sortOrder, filters, setPage, setLimit, setFilter, setSort, clearFilters } =
    listingState;

  const withdrawalTableColumnFilterValues = useMemo(() => ({ ...filters }), [filters]);

  const withdrawalTableFilterParams = useMemo(
    () => ({
      utr: toOptionalFilterValue(filters.utr || ""),
      utr_op: toOptionalFilterValue(filters.utr_op || ""),
      playerName: toOptionalFilterValue(filters.playerName || ""),
      playerName_op: toOptionalFilterValue(filters.playerName_op || ""),
      bankName: toOptionalFilterValue(filters.bankName || ""),
      bankName_op: toOptionalFilterValue(filters.bankName_op || ""),
      status: toOptionalFilterValue(filters.status || ""),
      amount: toOptionalFilterValue(filters.amount || ""),
      amount_to: toOptionalFilterValue(filters.amount_to || ""),
      amount_op: toOptionalFilterValue(filters.amount_op || ""),
      createdBy: toOptionalFilterValue(filters.createdBy || ""),
      approvedBy: toOptionalFilterValue(filters.approvedBy || ""),
      createdAt_from: toOptionalFilterValue(filters.createdAt_from || ""),
      createdAt_to: toOptionalFilterValue(filters.createdAt_to || ""),
      createdAt_op: toOptionalFilterValue(filters.createdAt_op || ""),
    }),
    [filters],
  );

  const handleWithdrawalColumnFilterChange = useCallback(
    (key: string, value: string) => {
      setFilter(key, value);
    },
    [setFilter],
  );

  const { exporting, handleExport } = useExport((params) => exportWithdrawals(params), {
    fileName: `withdrawals-banker-${new Date().toISOString().split("T")[0]}.xlsx`,
  });

  const onExportClick = useCallback(() => {
    handleExport({
      view: "banker",
      page: 1,
      limit: 10000,
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
      utr: toOptionalFilterValue(filters.utr || ""),
      utr_op: toOptionalFilterValue(filters.utr_op || ""),
      playerName: toOptionalFilterValue(filters.playerName || ""),
      playerName_op: toOptionalFilterValue(filters.playerName_op || ""),
      bankName: toOptionalFilterValue(filters.bankName || ""),
      bankName_op: toOptionalFilterValue(filters.bankName_op || ""),
      status: toOptionalFilterValue(filters.status || ""),
      amount: toOptionalFilterValue(filters.amount || ""),
      amount_to: toOptionalFilterValue(filters.amount_to || ""),
      amount_op: toOptionalFilterValue(filters.amount_op || ""),
      createdBy: toOptionalFilterValue(filters.createdBy || ""),
      approvedBy: toOptionalFilterValue(filters.approvedBy || ""),
      createdAt_from: toOptionalFilterValue(filters.createdAt_from || ""),
      createdAt_to: toOptionalFilterValue(filters.createdAt_to || ""),
      createdAt_op: toOptionalFilterValue(filters.createdAt_op || ""),
    });
  }, [handleExport, filters, sortBy, sortOrder]);

  const [totalCount, setTotalCount] = useState(0);
  const [tableKey, setTableKey] = useState(0);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRow | null>(null);

  useApprovalQueueAutoRefresh({
    module: "withdrawal",
    view: "banker",
    onRefresh: () => setTableKey((k) => k + 1),
  });

  const [bankId, setBankId] = useState("");
  const [bankAutocompleteDefault, setBankAutocompleteDefault] = useState<AutocompleteOption | null>(null);
  const bankIdRef = useRef("");
  const hasConsumedInitialListMetaRef = useRef(false);

  useEffect(() => {
    bankIdRef.current = bankId;
  }, [bankId]);

  const withdrawalBankerFetcher = useCallback(async (params: Record<string, unknown>) => {
    const res = await listWithdrawalsNormalized("banker", params);
    if (!hasConsumedInitialListMetaRef.current) {
      hasConsumedInitialListMetaRef.current = true;
      const hint = res.meta.lastBankerPayout;
      if (hint?.bankId && bankIdRef.current === "") {
        setBankId(hint.bankId);
        setBankAutocompleteDefault({ value: hint.bankId, label: hint.bankName });
      }
    }
    return res;
  }, []);

  const [utr, setUtr] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReasonId, setRejectReasonId] = useState("");
  const [rejectRemark, setRejectRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [errors, setErrors] = useState<{ bankId?: string; utr?: string }>({});

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

  const loadBankOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const rows = await listBankLookupOptions({ q: query || undefined, limit: 25 });
      return rows.map((b) => ({
        value: b.id,
        label: b.label,
      }));
    } catch {
      return [];
    }
  }, []);

  const closeSidebar = useCallback(() => {
    setSelectedWithdrawal(null);
    setUtr("");
    setRejectOpen(false);
    setRejectReasonId("");
    setRejectRemark("");
    setErrors({});
  }, []);

  const onPayoutSubmit = async () => {
    if (!selectedWithdrawal) return;
    const next: typeof errors = {};
    if (!bankId.trim()) next.bankId = "Payout bank is required.";
    if (!utr.trim()) next.utr = "UTR reference is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setActionLoading(true);
    try {
      await updateWithdrawalBankerPayout(selectedWithdrawal.id, {
        bankId: bankId.trim(),
        utr: utr.trim(),
      });
      toast.success("Payout recorded successfully.");
      closeSidebar();
      setTableKey((k) => k + 1);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to record payout"));
    } finally {
      setActionLoading(false);
    }
  };

  const onRejectSubmit = async () => {
    if (!selectedWithdrawal) return;
    if (!rejectReasonId.trim()) {
      toast.error("Select a rejection reason.");
      return;
    }
    setActionLoading(true);
    try {
      await patchWithdrawalStatus(selectedWithdrawal.id, {
        status: "rejected",
        reasonId: rejectReasonId.trim(),
        remark: rejectRemark.trim() || undefined,
      });
      toast.success("Withdrawal rejected.");
      setRejectOpen(false);
      setRejectReasonId("");
      setRejectRemark("");
      closeSidebar();
      setTableKey((k) => k + 1);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to reject withdrawal"));
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useMemo<PaginatedTableReferenceColumn[]>(
    () => [
      {
        field: "playerName",
        label: "Player",
        render: (row: WithdrawalRow) => row.playerName,
        ...tableColumnPresets.nameCol,
        sortable: true,
        filterType: "text" as const,
        filterKey: "playerName",
        operatorKey: "playerName_op",
      },
      {
        field: "account",
        label: "Destination Account",
        minWidth: 200,
        sortable: false,
        filterType: "text" as const,
        filterKey: "bankName",
        operatorKey: "bankName_op",
        filterPlaceholder: "Search bank...",
        render: (row: WithdrawalRow) => (
          <div className="text-sm">
            <div className="font-mono text-xs">{row.accountNumber || "—"}</div>
            <div className="text-xs text-gray-500">{row.bankName}</div>
          </div>
        ),
      },
      {
        field: "payableAmount",
        label: "Payable",
        render: (row: WithdrawalRow) => (row.payableAmount != null ? `₹${formatWholeRupee(row.payableAmount)}` : "—"),
        sortable: true,
        minWidth: 100,
        filterType: "number" as const,
        filterKey: "amount",
        filterKeyTo: "amount_to",
        operatorKey: "amount_op",
      },
      {
        field: "status",
        label: "Status",
        ...tableColumnPresets.statusCol,
        render: (row: WithdrawalRow) => <TableStatusBadge status={row.status} />,
        sortable: true,
        filterType: "select" as const,
        filterKey: "status",
        filterOptions: [
          { value: "requested", label: "Requested" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
          { value: "finalized", label: "Finalized" },
        ],
      },
      {
        field: "createdBy",
        label: "Created By",
        render: (row: WithdrawalRow) => row.createdByName || "—",
        minWidth: 150,
        sortable: false,
        filterType: "autocomplete" as const,
        filterKey: "createdBy",
        filterLoadOptions: loadUserOptions,
      },
      {
        field: "approvedBy",
        label: "Approved By",
        render: (row: WithdrawalRow) => row.approvedByName || "—",
        minWidth: 150,
        sortable: false,
        filterType: "autocomplete" as const,
        filterKey: "approvedBy",
        filterLoadOptions: loadUserOptions,
      },
      {
        field: "due",
        label: "Due time",
        sortable: false,
        minWidth: 110,
        render: (row: WithdrawalRow) => (
          <span className="text-xs text-gray-500">{formatRelative(row.requestedAt ?? row.createdAt)}</span>
        ),
      },
      {
        field: "createdAt",
        label: "Requested At",
        sortable: true,
        filterType: "date" as const,
        filterKey: "createdAt_from",
        filterKeyTo: "createdAt_to",
        operatorKey: "createdAt_op",
        ...tableColumnPresets.dateCol,
        render: (row: WithdrawalRow) =>
          row.requestedAt || row.createdAt ? new Date(row.requestedAt ?? row.createdAt!).toLocaleString() : "—",
      },
      {
        field: "actions",
        label: "Actions",
        sortable: false,
        minWidth: 96,
        render: (row: WithdrawalRow) => {
          if (row.status !== "requested") return <span className="text-xs text-gray-400">—</span>;
          if (selectedWithdrawal?.id === row.id) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                <IconCheck size={12} className="shrink-0" />
                Selected
              </span>
            );
          }
          return (
            <span className="text-xs text-[var(--brand-primary)] underline-offset-2 hover:underline cursor-pointer">
              Click row
            </span>
          );
        },
      },
    ],
    [selectedWithdrawal, loadUserOptions],
  );

  return (
    <>
      <ListingPageContainer
        title="Withdrawal / Banker"
        description="Pending exchange withdrawals awaiting payout bank and UTR. Click a row to open the sidebar for payout action."
        density="compact"
        fullWidth
        secondaryButtonLabel="Reset filters"
        onSecondaryClick={() => clearFilters({ keepQuickSearch: true })}
        exportButtonLabel="Export"
        onExportClick={onExportClick}
        exportDisabled={exporting}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {!selectedWithdrawal && (
            <div className="mb-3 flex shrink-0 items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
              <IconUser className="size-4 shrink-0" />
              <span>
                <strong>Tip:</strong> Click any <strong>requested</strong> row to open the sidebar.
              </span>
            </div>
          )}

          <PaginatedTableReference
            key={tableKey}
            columns={columns}
            fetcher={withdrawalBankerFetcher}
            height="calc(100vh - 280px)"
            showSearch={false}
            showPagination={false}
            onTotalChange={setTotalCount}
            columnFilterValues={withdrawalTableColumnFilterValues}
            onColumnFilterChange={handleWithdrawalColumnFilterChange}
            filterParams={withdrawalTableFilterParams}
            page={page}
            limit={limit}
            sortBy={sortBy || "createdAt"}
            sortOrder={sortOrder || "desc"}
            onPageChange={(zeroBased) => setPage(zeroBased + 1)}
            onRowsPerPageChange={setLimit}
            onSortChange={(field, order) => setSort(field, order)}
            onRowClick={(row) => setSelectedWithdrawal(row as WithdrawalRow)}
            selectedRowKey={selectedWithdrawal?.id ?? null}
            getRowKey={(row) => String((row as WithdrawalRow).id)}
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
        </div>
      </ListingPageContainer>

      <DetailsSidebar
        open={!!selectedWithdrawal}
        title="Withdrawal Banker"
        subtitle={selectedWithdrawal ? `Player: ${selectedWithdrawal.playerName}` : undefined}
        onClose={closeSidebar}
        width="400px"
      >
        {selectedWithdrawal && (
          <div className="flex flex-col gap-6">
            <WithdrawalDetailCard withdrawal={selectedWithdrawal} />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Company payout bank *</FieldLabel>
                <AutocompleteField
                  value={bankId}
                  onChange={setBankId}
                  loadOptions={loadBankOptions}
                  placeholder="Select bank..."
                  emptyText="No banks found"
                  defaultOption={bankAutocompleteDefault}
                  disabled={selectedWithdrawal.status !== "requested" || actionLoading}
                />
                <FieldError message={errors.bankId} />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>UTR Reference *</FieldLabel>
                <Input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="Enter UTR reference"
                  disabled={selectedWithdrawal.status !== "requested" || actionLoading}
                />
                <FieldError message={errors.utr} />
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                <Button
                  variant="success"
                  startIcon={<IconCheck size={18} />}
                  onClick={() => void onPayoutSubmit()}
                  disabled={selectedWithdrawal.status !== "requested" || actionLoading}
                  className="w-full justify-center"
                >
                  {actionLoading ? "Processing…" : "Record Payout"}
                </Button>
                <Button
                  variant="danger"
                  startIcon={<IconX size={18} />}
                  onClick={() => {
                    setRejectOpen(true);
                    setRejectReasonId("");
                    setRejectRemark("");
                  }}
                  disabled={selectedWithdrawal.status !== "requested" || actionLoading}
                  className="w-full justify-center"
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  startIcon={<IconRefresh size={18} />}
                  onClick={closeSidebar}
                  className="w-full justify-center"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}
      </DetailsSidebar>

      <ConfirmSensitiveActionDialog
        title="Reject withdrawal"
        open={rejectOpen}
        reasonType={REASON_TYPES.WITHDRAWAL_BANKER_REJECT}
        selectedReasonId={rejectReasonId}
        onReasonIdChange={setRejectReasonId}
        remark={rejectRemark}
        onRemarkChange={setRejectRemark}
        onCancel={() => {
          setRejectOpen(false);
          setRejectReasonId("");
          setRejectRemark("");
        }}
        onConfirm={() => void onRejectSubmit()}
      />
    </>
  );
}
