"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IconCheck,
  IconX,
  IconDownload,
  IconRefresh,
  IconCreditCard,
  IconUser,
  IconClock,
  IconCurrencyRupee,
  IconFileText,
} from "@tabler/icons-react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { AutocompleteField, type AutocompleteOption } from "@/components/common/AutocompleteField";
import { FieldLabel } from "@/components/common/FieldLabel";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { DetailsSidebar } from "@/components/common/DetailsSidebar";
import { ConfirmSensitiveActionDialog } from "@/components/common/ConfirmSensitiveActionDialog";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import {
  exchangeActionApprove,
  exchangeActionReject,
  exportDeposits,
  listDepositsNormalized,
} from "@/services/depositService";
import { listPlayersNormalized } from "@/services/playerService";
import type { DepositRow } from "@/types/deposit";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { userService } from "@/services/userService";
import { getApiErrorMessage } from "@/lib/apiError";

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
  "createdBy",
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

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
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

// ─── Deposit detail card (inside action sidebar) ───────────────────────────

type DepositDetailItem = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
};

function DepositDetailCard({ deposit }: { deposit: DepositRow }) {
  const items: DepositDetailItem[] = [
    {
      icon: <IconCreditCard className="size-4 shrink-0 text-[var(--brand-primary)]" />,
      label: "Bank holder",
      value: deposit.bankName || "—",
    },
    {
      icon: <IconFileText className="size-4 shrink-0 text-[var(--brand-primary)]" />,
      label: "UTR",
      value: deposit.utr || "—",
      mono: true,
    },
    {
      icon: <IconCurrencyRupee className="size-4 shrink-0 text-[var(--brand-primary)]" />,
      label: "Amount",
      value: deposit.amount.toLocaleString(),
    },
    {
      icon: <IconClock className="size-4 shrink-0 text-[var(--brand-primary)]" />,
      label: "Due time",
      value: formatRelative(deposit.createdAt),
    },
    {
      icon: <IconClock className="size-4 shrink-0 text-gray-400" />,
      label: "Created at",
      value: formatDate(deposit.createdAt),
    },
  ];

  return (
    <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Deposit info
        </p>
        <TableStatusBadge status={deposit.status} />
      </div>
      <dl className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2.5">
            <span className="mt-0.5">{item.icon}</span>
            <div className="min-w-0 flex-1">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                {item.label}
              </dt>
              <dd
                className={`mt-0.5 truncate text-sm font-medium text-gray-800 ${
                  item.mono ? "font-mono" : ""
                }`}
              >
                {item.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
      {deposit.status !== "pending" && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 border border-amber-200">
          This deposit is not pending — approve and reject are disabled.
        </p>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function DepositExchangeClient() {
  const listingState = useListingQueryStateReference({
    defaultLimit: 20,
    filterKeys: COLUMN_FILTER_KEYS,
  });
  const { page, limit, sortBy, sortOrder, filters, setPage, setLimit, setFilter, setSort, clearFilters } =
    listingState;

  const [totalCount, setTotalCount] = useState(0);
  const [tableKey, setTableKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRow | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [bonus, setBonus] = useState("0");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

  const loadPlayerOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const res = await listPlayersNormalized({
        page: 1,
        limit: 25,
        q: query || undefined,
        sortBy: "playerId",
        sortOrder: "asc",
      });
      return res.data
        .map((p) => ({
          value: String(p._id || p.id || "").trim(),
          label: `${p.playerId} · ${p.phone}`,
        }))
        .filter((o): o is AutocompleteOption => o.value.length > 0);
    } catch {
      return [];
    }
  }, []);

  const loadCreatedByOptions = useCallback(
    async (query: string): Promise<AutocompleteOption[]> => {
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
          .filter((row): row is AutocompleteOption => row !== null);
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
    return listDepositsNormalized("exchange", params);
  }, []);

  const clearActionForm = useCallback(() => {
    setSelectedDeposit(null);
    setPlayerId("");
    setBonus("0");
  }, []);

  const handleResetFilters = useCallback(() => {
    clearFilters({ keepQuickSearch: true });
    clearActionForm();
  }, [clearFilters, clearActionForm]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportDeposits("exchange", {
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
        createdBy: toOptionalFilterValue(filters.createdBy || ""),
        createdAt_from: toOptionalFilterValue(filters.createdAt_from || ""),
        createdAt_to: toOptionalFilterValue(filters.createdAt_to || ""),
        createdAt_op: toOptionalFilterValue(filters.createdAt_op || ""),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deposits-exchange-${new Date().toISOString().split("T")[0]}.xlsx`;
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

  const onApprove = useCallback(async () => {
    if (!selectedDeposit) {
      toast.error("Select a row in the table first.");
      return;
    }
    if (selectedDeposit.status !== "pending") {
      toast.error("Only pending deposits can be approved.");
      return;
    }
    if (!playerId.trim()) {
      toast.error("Select a player.");
      return;
    }
    const bonusNum = Number(bonus);
    if (Number.isNaN(bonusNum) || bonusNum < 0) {
      toast.error("Bonus must be a non-negative number.");
      return;
    }
    setActionLoading(selectedDeposit.id);
    try {
      await exchangeActionApprove(selectedDeposit.id, playerId.trim(), bonusNum);
      toast.success("Deposit approved and bank updated.");
      setTableKey((k) => k + 1);
      clearActionForm();
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Approve failed."));
    } finally {
      setActionLoading(null);
    }
  }, [selectedDeposit, playerId, bonus, clearActionForm]);

  const confirmReject = useCallback(async () => {
    if (!selectedDeposit) return;
    const remark = rejectRemark.trim();
    if (!remark) {
      toast.error("Remark is required.");
      return;
    }
    setActionLoading(selectedDeposit.id);
    try {
      await exchangeActionReject(selectedDeposit.id, remark);
      toast.success("Deposit rejected.");
      setRejectOpen(false);
      setRejectRemark("");
      setTableKey((k) => k + 1);
      clearActionForm();
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Reject failed."));
    } finally {
      setActionLoading(null);
    }
  }, [selectedDeposit, rejectRemark, clearActionForm]);

  const handleRowClick = useCallback((row: unknown) => {
    const r = row as DepositRow;
    setSelectedDeposit(r);
    setPlayerId("");
    setBonus("0");
  }, []);

  const closeSidebar = useCallback(() => {
    clearActionForm();
  }, [clearActionForm]);

  const selectedId = selectedDeposit?.id ?? null;
  const loadingSelected = selectedDeposit ? actionLoading === selectedDeposit.id : false;
  const canActOnSelection =
    selectedDeposit && selectedDeposit.status === "pending" && !loadingSelected;

  const columns = useMemo<PaginatedTableReferenceColumn[]>(
    () => [
      {
        field: "bankName",
        label: "Bank holder",
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
        render: (row: DepositRow) => (
          <span className="font-mono text-xs">{row.utr}</span>
        ),
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
        render: (row: DepositRow) => (
          <span className="font-medium tabular-nums">
            ₹{row.amount.toLocaleString()}
          </span>
        ),
        sortable: true,
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
        ],
        ...tableColumnPresets.statusCol,
        render: (row: DepositRow) => <TableStatusBadge status={row.status} />,
      },
      {
        field: "due",
        label: "Due time",
        sortable: false,
        minWidth: 110,
        render: (row: DepositRow) => (
          <span className="text-xs text-gray-500">{formatRelative(row.createdAt)}</span>
        ),
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
        render: (row: DepositRow) =>
          row.createdAt ? new Date(row.createdAt).toLocaleString() : "—",
      },
      {
        field: "actions",
        label: "Action",
        sortable: false,
        minWidth: 96,
        render: (row: DepositRow) => {
          if (row.status !== "pending") {
            return <span className="text-xs text-gray-400">—</span>;
          }
          if (selectedId && row.id === selectedId) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                <IconCheck className="size-3 shrink-0" aria-hidden />
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
    [cachedUsers, loadCreatedByOptions, selectedId],
  );

  return (
    <>
      <ListingPageContainer
        title="Deposit / Exchange depositor"
        description="Pending banker deposits awaiting exchange action. Select a row to approve or reject."
        density="compact"
        fullWidth
        secondaryButtonLabel="Reset filters"
        onSecondaryClick={handleResetFilters}
        exportButtonLabel={exporting ? "Exporting…" : "Export"}
        onExportClick={handleExport}
        exportDisabled={exporting}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Prompt banner when no row is selected */}
          {!selectedDeposit && (
            <div className="mb-3 flex shrink-0 items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
              <IconUser className="size-4 shrink-0" />
              <span>
                <strong>Tip:</strong> Click any <strong>pending</strong> row to open the approve /
                reject panel.
              </span>
            </div>
          )}

          {/* Table */}
          <PaginatedTableReference
            key={tableKey}
            columns={columns}
            fetcher={fetcher}
            height="calc(100vh - 280px)"
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
            onRowClick={handleRowClick}
            getRowKey={(row) => String((row as DepositRow).id)}
            selectedRowKey={selectedId}
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

      {/* ─── Action sidebar ─────────────────────────────────────────────── */}
      <DetailsSidebar
        open={!!selectedDeposit}
        title="Exchange Action"
        subtitle={
          selectedDeposit
            ? `UTR: ${selectedDeposit.utr ?? "—"}`
            : undefined
        }
        onClose={closeSidebar}
        width="400px"
      >
        {selectedDeposit && (
          <div className="flex flex-col gap-4">
            {/* Deposit info card */}
            <DepositDetailCard deposit={selectedDeposit} />

            {/* Player + bonus fields */}
            <div className="space-y-3">
              <div>
                <FieldLabel>
                  <span className="flex items-center gap-1.5">
                    <IconUser className="size-3.5" />
                    Player *
                  </span>
                </FieldLabel>
                <AutocompleteField
                  value={playerId}
                  onChange={setPlayerId}
                  loadOptions={loadPlayerOptions}
                  placeholder="Search player…"
                  disabled={!canActOnSelection}
                />
                {!playerId && canActOnSelection && (
                  <p className="mt-1 text-xs text-amber-600">Player is required to approve.</p>
                )}
              </div>

              <div>
                <FieldLabel>
                  <span className="flex items-center gap-1.5">
                    <IconCurrencyRupee className="size-3.5" />
                    Bonus
                  </span>
                </FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  disabled={!canActOnSelection}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-1 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="success"
                leftIcon={<IconCheck size={16} />}
                disabled={!canActOnSelection || !playerId.trim()}
                onClick={() => void onApprove()}
                className="w-full justify-center"
              >
                {loadingSelected ? "Approving…" : "Approve"}
              </Button>
              <Button
                type="button"
                variant="danger"
                leftIcon={<IconX size={16} />}
                disabled={!canActOnSelection}
                onClick={() => {
                  if (!selectedDeposit || selectedDeposit.status !== "pending") return;
                  setRejectOpen(true);
                  setRejectRemark("");
                }}
                className="w-full justify-center"
              >
                Reject
              </Button>
              <Button
                type="button"
                variant="secondary"
                leftIcon={<IconRefresh size={16} />}
                onClick={closeSidebar}
                className="w-full justify-center"
              >
                Clear selection
              </Button>
            </div>
          </div>
        )}
      </DetailsSidebar>

      {/* ─── Reject confirmation dialog ──────────────────────────────────── */}
      <ConfirmSensitiveActionDialog
        title="Reject deposit"
        reason={rejectRemark}
        open={rejectOpen}
        onReasonChange={setRejectRemark}
        onCancel={() => {
          setRejectOpen(false);
          setRejectRemark("");
        }}
        onConfirm={() => void confirmReject()}
      />
    </>
  );
}
