"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IconCheck,
  IconX,
  IconUser,
  IconCurrencyRupee,
  IconClock,
  IconRefresh,
  IconBuildingBank,
} from "@tabler/icons-react";
import { ConfirmSensitiveActionDialog } from "@/components/common/ConfirmSensitiveActionDialog";
import { AutocompleteField, type AutocompleteOption } from "@/components/common/AutocompleteField";
import { FieldLabel } from "@/components/common/FieldLabel";
import { FieldError } from "@/components/common/FieldError";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { DetailsSidebar } from "@/components/common/DetailsSidebar";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { getApiErrorMessage } from "@/lib/apiError";
import { REASON_TYPES } from "@/lib/constants/reasonTypes";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import {
  createBulkBankerApproveJob,
  getBulkBankerApproveJob,
  listWithdrawalsNormalized,
  patchWithdrawalStatus,
  streamBulkBankerApproveJobEvents,
  updateWithdrawalBankerPayout,
  exportWithdrawals,
} from "@/services/withdrawalService";
import { useExport } from "@/hooks/useExport";
import { listBankLookupOptions } from "@/services/lookupService";
import { listLiabilityPersonsNormalized } from "@/services/liabilityService";
import { userService } from "@/services/userService";
import type { WithdrawalBankerPayoutInput, WithdrawalBulkApproveJobSummary, WithdrawalRow } from "@/types/withdrawal";
import { formatDateTimeForUser } from "@/lib/userTimezone";
import { useApprovalQueueAutoRefresh } from "@/hooks/useApprovalQueueAutoRefresh";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { isImportReadyWithdrawal } from "@/modules/withdrawal/withdrawalImportReady";
import { buildWithdrawalBankerExcelListColumns } from "@/modules/withdrawal/withdrawalBankerExcelListColumns";
import {
  seedBankerRowDraft,
  type BankerRowDraft,
} from "@/modules/withdrawal/withdrawalBankerRowDraft";
import {
  withdrawalStatusApiParam,
  withdrawalStatusColumnSelectValue,
} from "@/modules/withdrawal/withdrawalListingStatusFilter";
import { WithdrawalBeneficiaryBankBlock } from "./WithdrawalBeneficiaryBankBlock";
import { WithdrawalBankerRowActions } from "./WithdrawalBankerRowActions";
import { WithdrawalBankerUtrUploadDialog } from "./WithdrawalBankerUtrUploadDialog";
import { Select } from "@/components/ui/Select";

const COLUMN_FILTER_KEYS = [
  "utr",
  "utr_op",
  "playerName",
  "playerName_op",
  "status",
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

// ─── Detail card for sidebar ──────────────────────────────────────────────

function WithdrawalDetailCard({ withdrawal }: { withdrawal: WithdrawalRow }) {
  const { formatWholeMoney } = useFormatMoney();
  const items = [
    {
      icon: <IconUser className="size-4 shrink-0 text-[var(--brand-primary)]" />,
      label: "Player",
      value: withdrawal.playerName || "—",
    },
    {
      icon: <IconCurrencyRupee className="size-4 shrink-0 text-[var(--brand-primary)]" />,
      label: "Payable amount",
      value: withdrawal.payableAmount != null ? formatWholeMoney(withdrawal.payableAmount) : "—",
    },
    {
      icon: <IconClock className="size-4 shrink-0 text-gray-400" />,
      label: "Requested at",
      value: formatDateTimeForUser(withdrawal.requestedAt ?? withdrawal.createdAt),
    },
    {
      icon: <IconBuildingBank className="size-4 shrink-0 text-[var(--brand-primary)]" />,
      label: "Company payout source",
      value:
        withdrawal.payoutSettlementType === "person"
          ? withdrawal.payoutLiabilityPersonName?.trim()
            ? `LP: ${withdrawal.payoutLiabilityPersonName.trim()}`
            : "—"
          : withdrawal.payoutBankName?.trim() || "(pending)",
    },
  ];

  return (
    <div className="space-y-3">
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
      <WithdrawalBeneficiaryBankBlock row={withdrawal} title="Dest. beneficiary bank" />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function WithdrawalBankerClient() {
  const { formatWholeMoney } = useFormatMoney();
  const listingState = useListingQueryStateReference({
    defaultLimit: 20,
    filterKeys: COLUMN_FILTER_KEYS,
  });
  const { page, limit, sortBy, sortOrder, filters, setPage, setLimit, setFilter, setSort, clearFilters } =
    listingState;

  const withdrawalTableColumnFilterValues = useMemo(
    () => ({
      ...filters,
      status: withdrawalStatusColumnSelectValue(filters.status),
    }),
    [filters],
  );

  const withdrawalTableFilterParams = useMemo(
    () => ({
      utr: toOptionalFilterValue(filters.utr || ""),
      utr_op: toOptionalFilterValue(filters.utr_op || ""),
      playerName: toOptionalFilterValue(filters.playerName || ""),
      playerName_op: toOptionalFilterValue(filters.playerName_op || ""),
      status: withdrawalStatusApiParam(filters.status),
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
      if (key === "status" && value === "") {
        setFilter("status", "all");
        return;
      }
      setFilter(key, value);
    },
    [setFilter],
  );

  const { exporting, handleExport } = useExport((params) => exportWithdrawals(params), {
    fileName: `withdrawals-banker-${new Date().toISOString().split("T")[0]}.xlsx`,
  });

  const [exportStatus, setExportStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [utrUploadOpen, setUtrUploadOpen] = useState(false);

  const onExportClick = useCallback(() => {
    const statusForApi =
      exportStatus === "pending" ? "requested" : exportStatus === "all" ? "all" : exportStatus;
    handleExport({
      view: "banker",
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "desc",
      utr: toOptionalFilterValue(filters.utr || ""),
      utr_op: toOptionalFilterValue(filters.utr_op || ""),
      playerName: toOptionalFilterValue(filters.playerName || ""),
      playerName_op: toOptionalFilterValue(filters.playerName_op || ""),
      status: statusForApi,
      amount: toOptionalFilterValue(filters.amount || ""),
      amount_to: toOptionalFilterValue(filters.amount_to || ""),
      amount_op: toOptionalFilterValue(filters.amount_op || ""),
      createdBy: toOptionalFilterValue(filters.createdBy || ""),
      approvedBy: toOptionalFilterValue(filters.approvedBy || ""),
      createdAt_from: toOptionalFilterValue(filters.createdAt_from || ""),
      createdAt_to: toOptionalFilterValue(filters.createdAt_to || ""),
      createdAt_op: toOptionalFilterValue(filters.createdAt_op || ""),
    });
  }, [handleExport, filters, sortBy, sortOrder, exportStatus]);

  const [totalCount, setTotalCount] = useState(0);
  const [tableKey, setTableKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRow | null>(null);
  const [visibleRows, setVisibleRows] = useState<WithdrawalRow[]>([]);
  const [bulkSelection, setBulkSelection] = useState<Record<string, WithdrawalRow>>({});
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkProgressOpen, setBulkProgressOpen] = useState(false);
  const [bulkJobId, setBulkJobId] = useState<string | null>(null);
  const [bulkJobSelectionIds, setBulkJobSelectionIds] = useState<string[]>([]);
  const [bulkProgress, setBulkProgress] = useState<WithdrawalBulkApproveJobSummary | null>(null);

  useApprovalQueueAutoRefresh({
    module: "withdrawal",
    view: "banker",
    onRefresh: () => setTableKey((k) => k + 1),
  });

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setTableKey((k) => k + 1);
    }, 10_000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const { liabilityModuleEnabled } = usePlatformSettings();
  const [payoutSettlementType, setPayoutSettlementType] = useState<"bank" | "person">("bank");
  const [bankId, setBankId] = useState("");
  const [bankAutocompleteDefault, setBankAutocompleteDefault] = useState<AutocompleteOption | null>(null);
  const [liabilityPersonId, setLiabilityPersonId] = useState("");
  const [payoutPersonAutocompleteDefault, setPayoutPersonAutocompleteDefault] = useState<AutocompleteOption | null>(null);
  const [rowDrafts, setRowDrafts] = useState<Record<string, BankerRowDraft>>({});

  useEffect(() => {
    if (!liabilityModuleEnabled) setPayoutSettlementType("bank");
  }, [liabilityModuleEnabled]);

  const withdrawalBankerFetcher = useCallback(async (params: Record<string, unknown>) => {
    return listWithdrawalsNormalized("banker", params);
  }, []);

  const [utr, setUtr] = useState("");
  const [narration, setNarration] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReasonId, setRejectReasonId] = useState("");
  const [rejectRemark, setRejectRemark] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ bankId?: string; liabilityPersonId?: string; utr?: string }>({});

  const getRowDraft = useCallback(
    (row: WithdrawalRow): BankerRowDraft => {
      const existing = rowDrafts[row.id];
      if (existing) return existing;
      return seedBankerRowDraft(row);
    },
    [rowDrafts],
  );

  const patchRowDraft = useCallback((rowId: string, row: WithdrawalRow, patch: Partial<BankerRowDraft>) => {
    setRowDrafts((prev) => {
      const base = prev[rowId] ?? seedBankerRowDraft(row);
      return { ...prev, [rowId]: { ...base, ...patch } };
    });
  }, []);

  const loadUserOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const response = await userService.list({
        q: query || undefined,
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

  const loadLiabilityPersonOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const res = await listLiabilityPersonsNormalized({
        limit: 25,
        q: query || undefined,
        sortBy: "name",
        sortOrder: "asc",
        isActive: "true",
      });
      return res.data.map((p) => ({ value: p.id, label: p.name }));
    } catch {
      return [];
    }
  }, []);

  const closeSidebar = useCallback(() => {
    setSelectedWithdrawal(null);
    setPayoutSettlementType("bank");
    setBankId("");
    setBankAutocompleteDefault(null);
    setLiabilityPersonId("");
    setPayoutPersonAutocompleteDefault(null);
    setUtr("");
    setNarration("");
    setErrors({});
  }, []);

  const applyDraftToSidebar = useCallback((draft: BankerRowDraft) => {
    setUtr(draft.utr);
    setNarration(draft.narration);
    setPayoutSettlementType(draft.payoutSettlementType);
    if (draft.payoutSettlementType === "person") {
      setBankId("");
      setBankAutocompleteDefault(null);
      setLiabilityPersonId(draft.liabilityPersonId);
      setPayoutPersonAutocompleteDefault(
        draft.liabilityPersonId
          ? { value: draft.liabilityPersonId, label: draft.liabilityPersonLabel || draft.liabilityPersonId }
          : null,
      );
    } else {
      setBankId(draft.bankId);
      setBankAutocompleteDefault(
        draft.bankId ? { value: draft.bankId, label: draft.bankLabel || draft.bankId } : null,
      );
      setLiabilityPersonId("");
      setPayoutPersonAutocompleteDefault(null);
    }
    setErrors({});
  }, []);

  const openDetails = useCallback(
    (row: WithdrawalRow) => {
      const draft = getRowDraft(row);
      setRowDrafts((prev) => (prev[row.id] ? prev : { ...prev, [row.id]: draft }));
      setSelectedWithdrawal(row);
      applyDraftToSidebar(draft);
    },
    [getRowDraft, applyDraftToSidebar],
  );

  const handleVisibleRowsChange = useCallback((rows: unknown[]) => {
    setVisibleRows(rows as WithdrawalRow[]);
  }, []);

  const importReadyOnPage = useMemo(
    () => visibleRows.filter(isImportReadyWithdrawal),
    [visibleRows],
  );

  const bulkSelectedIds = useMemo(() => Object.keys(bulkSelection), [bulkSelection]);
  const bulkSelectedRows = useMemo(() => Object.values(bulkSelection), [bulkSelection]);

  const bulkSummary = useMemo(() => {
    const payableTotal = bulkSelectedRows.reduce((sum, row) => sum + Number(row.payableAmount ?? row.amount ?? 0), 0);
    return {
      count: bulkSelectedRows.length,
      payableTotal,
      utrs: bulkSelectedRows.map((row) => row.utr).filter(Boolean) as string[],
    };
  }, [bulkSelectedRows]);

  const normalizedStatusFilter = (filters.status ?? "").trim().toLowerCase();
  const showBulkToolbar =
    normalizedStatusFilter === "" || normalizedStatusFilter === "requested" || normalizedStatusFilter === "all";

  const toggleBulkSelection = useCallback((row: WithdrawalRow, checked: boolean) => {
    setBulkSelection((prev) => {
      const next = { ...prev };
      if (checked) next[row.id] = row;
      else delete next[row.id];
      return next;
    });
  }, []);

  const toggleSelectAllImportReadyOnPage = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setBulkSelection((prev) => {
          const next = { ...prev };
          for (const row of importReadyOnPage) delete next[row.id];
          return next;
        });
        return;
      }
      setBulkSelection((prev) => {
        const next = { ...prev };
        for (const row of importReadyOnPage) next[row.id] = row;
        return next;
      });
    },
    [importReadyOnPage],
  );

  const allImportReadyOnPageSelected =
    importReadyOnPage.length > 0 && importReadyOnPage.every((row) => Boolean(bulkSelection[row.id]));
  const bulkProgressPercent = useMemo(() => {
    const total = Number(bulkProgress?.progress.totalRows ?? 0);
    const processed = Number(bulkProgress?.progress.processedRows ?? 0);
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((processed / total) * 100)));
  }, [bulkProgress]);

  const confirmBulkApprove = useCallback(async () => {
    if (bulkSelectedIds.length === 0) return;
    setBulkApproving(true);
    try {
      const created = await createBulkBankerApproveJob(bulkSelectedIds);
      setBulkJobId(created.jobId);
      setBulkJobSelectionIds(bulkSelectedIds);
      setBulkProgressOpen(true);
      setBulkProgress((prev) => ({
        id: created.jobId,
        status: "queued",
        createdBy: prev?.createdBy ?? "",
        createdAt: prev?.createdAt ?? new Date().toISOString(),
        progress: { totalRows: bulkSelectedIds.length, processedRows: 0, successRows: 0, failedRows: 0 },
        errorSample: [],
      }));
      setBulkConfirmOpen(false);
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Bulk approve failed."));
    } finally {
      setBulkApproving(false);
    }
  }, [bulkSelectedIds]);

  useEffect(() => {
    if (!bulkJobId) return;
    let mounted = true;
    let stopStream: (() => void) | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const applyProgress = (job: WithdrawalBulkApproveJobSummary) => {
      if (!mounted) return;
      setBulkProgress(job);
      if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
        if (stopStream) {
          stopStream();
          stopStream = null;
        }
        setBulkSelection({});
        setTableKey((k) => k + 1);
        if (selectedWithdrawal && bulkJobSelectionIds.includes(selectedWithdrawal.id)) {
          closeSidebar();
        }
        if (job.status === "completed") {
          toast.success(
            `Approved ${job.progress.successRows} withdrawal${job.progress.successRows === 1 ? "" : "s"}${
              job.progress.failedRows > 0 ? `; ${job.progress.failedRows} failed` : ""
            }.`,
          );
        } else {
          toast.error(job.failureReason || "Bulk approval job failed.");
        }
      }
    };

    const pollOnce = async () => {
      try {
        const snapshot = await getBulkBankerApproveJob(bulkJobId);
        applyProgress(snapshot);
      } catch {
        // Keep trying while stream/poll continues.
      }
    };

    void pollOnce();
    pollTimer = setInterval(() => {
      void pollOnce();
    }, 2000);

    void streamBulkBankerApproveJobEvents(bulkJobId, (eventPayload) => {
      setBulkProgress((prev) => ({
        ...(prev ?? {
          id: bulkJobId,
          createdBy: "",
          createdAt: new Date().toISOString(),
          errorSample: [],
        }),
        ...eventPayload,
      }));
      if (eventPayload.status === "completed" || eventPayload.status === "failed" || eventPayload.status === "cancelled") {
        void pollOnce();
      }
    })
      .then((stop) => {
        stopStream = stop;
      })
      .catch(() => {
        // Poll fallback is already active.
      });

    return () => {
      mounted = false;
      if (pollTimer) clearInterval(pollTimer);
      if (stopStream) stopStream();
    };
  }, [bulkJobId, bulkJobSelectionIds, closeSidebar, selectedWithdrawal]);

  const getRowClassName = useCallback((row: unknown) => {
    return isImportReadyWithdrawal(row as WithdrawalRow) ? "bg-green-50/90" : undefined;
  }, []);

  const approveFromDraft = useCallback(
    async (row: WithdrawalRow, draft: BankerRowDraft, opts?: { fromSidebar?: boolean }) => {
      const next: typeof errors = {};
      if (draft.payoutSettlementType === "bank" && !draft.bankId.trim()) {
        next.bankId = "Payout bank is required.";
      }
      if (draft.payoutSettlementType === "person" && !draft.liabilityPersonId.trim()) {
        next.liabilityPersonId = "Liability person is required.";
      }
      if (!draft.utr.trim()) next.utr = "UTR reference is required.";

      if (Object.keys(next).length > 0) {
        if (opts?.fromSidebar) setErrors(next);
        else {
          const msg = next.utr || next.bankId || next.liabilityPersonId || "Missing payout fields.";
          toast.error(msg);
        }
        return;
      }

      const body: WithdrawalBankerPayoutInput =
        draft.payoutSettlementType === "bank"
          ? {
              payoutSettlementType: "bank",
              bankId: draft.bankId.trim(),
              utr: draft.utr.trim(),
              narration: draft.narration.trim(),
            }
          : {
              payoutSettlementType: "person",
              liabilityPersonId: draft.liabilityPersonId.trim(),
              utr: draft.utr.trim(),
              narration: draft.narration.trim(),
            };

      setActionLoadingId(row.id);
      try {
        await updateWithdrawalBankerPayout(row.id, body);
        toast.success("Payout recorded successfully.");
        setRowDrafts((prev) => {
          const nextDrafts = { ...prev };
          delete nextDrafts[row.id];
          return nextDrafts;
        });
        if (selectedWithdrawal?.id === row.id) closeSidebar();
        setTableKey((k) => k + 1);
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, "Failed to record payout"));
      } finally {
        setActionLoadingId(null);
      }
    },
    [closeSidebar, selectedWithdrawal?.id],
  );

  const onPayoutSubmit = async () => {
    if (!selectedWithdrawal) return;
    const draft: BankerRowDraft = {
      utr,
      narration,
      payoutSettlementType,
      bankId,
      bankLabel: bankAutocompleteDefault?.label,
      liabilityPersonId,
      liabilityPersonLabel: payoutPersonAutocompleteDefault?.label,
    };
    setRowDrafts((prev) => ({ ...prev, [selectedWithdrawal.id]: draft }));
    await approveFromDraft(selectedWithdrawal, draft, { fromSidebar: true });
  };

  const openRejectForRow = useCallback((rowId: string) => {
    setRejectTargetId(rowId);
    setRejectOpen(true);
    setRejectReasonId("");
    setRejectRemark("");
  }, []);

  const onRejectSubmit = async () => {
    const targetId = rejectTargetId || selectedWithdrawal?.id;
    if (!targetId) return;
    if (!rejectReasonId.trim()) {
      toast.error("Select a rejection reason.");
      return;
    }
    setActionLoadingId(targetId);
    try {
      await patchWithdrawalStatus(targetId, {
        status: "rejected",
        reasonId: rejectReasonId.trim(),
        remark: rejectRemark.trim() || undefined,
      });
      toast.success("Withdrawal rejected.");
      setRejectOpen(false);
      setRejectTargetId(null);
      setRejectReasonId("");
      setRejectRemark("");
      setRowDrafts((prev) => {
        const nextDrafts = { ...prev };
        delete nextDrafts[targetId];
        return nextDrafts;
      });
      if (selectedWithdrawal?.id === targetId) closeSidebar();
      setTableKey((k) => k + 1);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to reject withdrawal"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns = useMemo<PaginatedTableReferenceColumn[]>(() => {
    const base = buildWithdrawalBankerExcelListColumns({
      liabilityModuleEnabled,
      formatWholeMoney,
      withBankerFilters: true,
      loadUserOptions,
    }).map((col) => {
      if (col.field === "narration") {
        return {
          ...col,
          minWidth: 160,
          render: (row: WithdrawalRow) => {
            if (row.status !== "requested") {
              return <span className="text-xs">{row.narration?.trim() || "—"}</span>;
            }
            const draft = getRowDraft(row);
            return (
              <div data-no-row-click onClick={(e) => e.stopPropagation()} className="min-w-[140px]">
                <Input
                  className="h-8 text-xs"
                  value={draft.narration}
                  placeholder="Narration"
                  maxLength={500}
                  onChange={(e) => patchRowDraft(row.id, row, { narration: e.target.value })}
                  disabled={actionLoadingId === row.id}
                />
              </div>
            );
          },
        };
      }
      if (col.field === "utr") {
        return {
          ...col,
          minWidth: 160,
          render: (row: WithdrawalRow) => {
            if (row.status !== "requested") {
              return <span className="font-mono text-xs">{row.utr?.trim() || "—"}</span>;
            }
            const draft = getRowDraft(row);
            return (
              <div data-no-row-click onClick={(e) => e.stopPropagation()} className="min-w-[140px]">
                <Input
                  className="h-8 font-mono text-xs"
                  value={draft.utr}
                  placeholder="UTR"
                  onChange={(e) => patchRowDraft(row.id, row, { utr: e.target.value })}
                  disabled={actionLoadingId === row.id}
                />
              </div>
            );
          },
        };
      }
      if (col.field === "payoutBankAccountNumber") {
        return {
          ...col,
          minWidth: liabilityModuleEnabled ? 220 : 180,
          render: (row: WithdrawalRow) => {
            if (row.status !== "requested") {
              return (
                <span className="font-mono text-xs">{row.payoutBankAccountNumber?.trim() || "—"}</span>
              );
            }
            const draft = getRowDraft(row);
            return (
              <div
                data-no-row-click
                onClick={(e) => e.stopPropagation()}
                className="flex min-w-[160px] flex-col gap-1"
              >
                {liabilityModuleEnabled ? (
                  <select
                    className="h-7 rounded-md border border-[var(--border)] bg-white px-2 text-xs"
                    value={draft.payoutSettlementType}
                    disabled={actionLoadingId === row.id}
                    onChange={(e) => {
                      const mode = e.target.value === "person" ? "person" : "bank";
                      patchRowDraft(row.id, row, {
                        payoutSettlementType: mode,
                        ...(mode === "bank"
                          ? {
                              bankId: draft.bankId || "",
                              bankLabel: draft.bankLabel,
                            }
                          : {}),
                      });
                    }}
                  >
                    <option value="bank">Bank</option>
                    <option value="person">Liability person</option>
                  </select>
                ) : null}
                {draft.payoutSettlementType === "person" && liabilityModuleEnabled ? (
                  <AutocompleteField
                    value={draft.liabilityPersonId}
                    onChange={(id) =>
                      patchRowDraft(row.id, row, {
                        liabilityPersonId: id,
                        liabilityPersonLabel: undefined,
                      })
                    }
                    loadOptions={loadLiabilityPersonOptions}
                    placeholder="Liable person..."
                    emptyText="No persons"
                    defaultOption={
                      draft.liabilityPersonId
                        ? {
                            value: draft.liabilityPersonId,
                            label: draft.liabilityPersonLabel || draft.liabilityPersonId,
                          }
                        : null
                    }
                    disabled={actionLoadingId === row.id}
                  />
                ) : (
                  <AutocompleteField
                    value={draft.bankId}
                    onChange={(id) =>
                      patchRowDraft(row.id, row, {
                        bankId: id,
                        bankLabel: undefined,
                      })
                    }
                    loadOptions={loadBankOptions}
                    placeholder="Search bank (last 4 / name / account)..."
                    emptyText="No banks"
                    defaultOption={
                      draft.bankId
                        ? { value: draft.bankId, label: draft.bankLabel || draft.bankId }
                        : null
                    }
                    disabled={actionLoadingId === row.id}
                  />
                )}
              </div>
            );
          },
        };
      }
      if (col.field === "payoutSettlementType" || col.field === "payoutLiabilityPersonName") {
        return {
          ...col,
          render: (row: WithdrawalRow) => {
            if (row.status === "requested") {
              const draft = getRowDraft(row);
              if (col.field === "payoutSettlementType") {
                return draft.payoutSettlementType === "person" ? "Liability person" : "Bank";
              }
              return draft.liabilityPersonLabel?.trim() || draft.liabilityPersonId || "—";
            }
            if (col.field === "payoutSettlementType") {
              return row.payoutSettlementType === "person" ? "Liability person" : "Bank";
            }
            return row.payoutLiabilityPersonName?.trim() || "—";
          },
        };
      }
      return col;
    });

    return [
      {
        field: "_bulkSelect",
        label: "",
        sortable: false,
        minWidth: 44,
        render: (row: WithdrawalRow) => {
          if (!isImportReadyWithdrawal(row)) return null;
          return (
            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={Boolean(bulkSelection[row.id])}
                onChange={(e) => toggleBulkSelection(row, e.target.checked)}
                aria-label={`Select payout UTR ${row.utr}`}
              />
            </div>
          );
        },
      },
      ...base,
      {
        field: "actions",
        label: "Actions",
        sortable: false,
        isActionColumn: true,
        minWidth: 260,
        width: 280,
        maxWidth: 340,
        render: (row: WithdrawalRow) => (
          <WithdrawalBankerRowActions
            row={row}
            loading={actionLoadingId === row.id}
            onApprove={() => void approveFromDraft(row, getRowDraft(row))}
            onReject={() => openRejectForRow(row.id)}
            onDetails={() => openDetails(row)}
          />
        ),
      },
    ];
  }, [
    liabilityModuleEnabled,
    formatWholeMoney,
    loadUserOptions,
    loadBankOptions,
    loadLiabilityPersonOptions,
    getRowDraft,
    patchRowDraft,
    actionLoadingId,
    bulkSelection,
    toggleBulkSelection,
    approveFromDraft,
    openRejectForRow,
    openDetails,
  ]);

  return (
    <>
      <ListingPageContainer
        title="Withdrawal / Banker"
        description="Enter UTR and payout bank on each requested row, then Approve or Reject. Use Details for full beneficiary info."
        density="compact"
        fullWidth
        secondaryButtonLabel="Reset filters"
        onSecondaryClick={() => clearFilters({ keepQuickSearch: true })}
        exportButtonLabel="Export"
        onExportClick={onExportClick}
        exportDisabled={exporting}
        importButtonLabel="Upload UTRs"
        onImportClick={() => setUtrUploadOpen(true)}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Auto-refresh toggle + export status */}
          <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoRefresh ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${autoRefresh ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
            </button>
            <span className="text-xs font-medium text-gray-600">
              Auto Refresh {autoRefresh ? <span className="text-green-600">(every 10s)</span> : "(off)"}
            </span>
            <div className="flex items-center gap-2">
              <FieldLabel className="mb-0 text-xs text-gray-600">Export status</FieldLabel>
              <Select
                value={exportStatus}
                onChange={(e) =>
                  setExportStatus(e.target.value as "pending" | "approved" | "rejected" | "all")
                }
                className="h-8 w-[140px] text-xs"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </Select>
            </div>
          </div>

          {showBulkToolbar && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  label="Current page selection"
                  checked={allImportReadyOnPageSelected}
                  onChange={(e) => toggleSelectAllImportReadyOnPage(e.target.checked)}
                  disabled={importReadyOnPage.length === 0}
                />
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  disabled={importReadyOnPage.length === 0}
                  onClick={() => toggleSelectAllImportReadyOnPage(true)}
                >
                  Select all green rows on this page ({importReadyOnPage.length})
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-600">
                  {importReadyOnPage.length} import-ready on page · {bulkSelectedIds.length} selected
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="success"
                  disabled={bulkSelectedIds.length === 0 || bulkApproving}
                  onClick={() => setBulkConfirmOpen(true)}
                >
                  Approve selected ({bulkSelectedIds.length})
                </Button>
              </div>
            </div>
          )}

          <PaginatedTableReference
            reloadToken={tableKey}
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
            onRowsChange={handleVisibleRowsChange}
            getRowClassName={getRowClassName}
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
        focusKey={selectedWithdrawal?.id ?? null}
      >
        {selectedWithdrawal && (
          <div className="flex flex-col gap-6">
            <WithdrawalDetailCard withdrawal={selectedWithdrawal} />

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                {liabilityModuleEnabled ? (
                  <div className="flex-1 space-y-1">
                    <FieldLabel className="mb-1 text-xs text-muted-foreground">Payout settlement *</FieldLabel>
                    <select
                      className="w-full h-9 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-sm"
                      value={payoutSettlementType}
                      onChange={(e) => {
                        const v = e.target.value === "person" ? "person" : "bank";
                        setPayoutSettlementType(v);
                        patchRowDraft(selectedWithdrawal.id, selectedWithdrawal, {
                          payoutSettlementType: v,
                        });
                        setErrors((prev) => {
                          const n = { ...prev };
                          delete n.bankId;
                          delete n.liabilityPersonId;
                          return n;
                        });
                      }}
                      disabled={
                        selectedWithdrawal.status !== "requested" ||
                        actionLoadingId === selectedWithdrawal.id
                      }
                    >
                      <option value="bank">Bank</option>
                      <option value="person">Liability person</option>
                    </select>
                  </div>
                ) : null}
                <div className="flex-1 space-y-1">
                  <FieldLabel className="mb-1 text-xs text-muted-foreground">UTR Reference *</FieldLabel>
                  <Input
                    className="h-9 text-sm"
                    value={utr}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUtr(value);
                      patchRowDraft(selectedWithdrawal.id, selectedWithdrawal, { utr: value });
                    }}
                    placeholder="Enter UTR"
                    disabled={
                      selectedWithdrawal.status !== "requested" ||
                      actionLoadingId === selectedWithdrawal.id
                    }
                  />
                  <FieldError message={errors.utr} />
                </div>
              </div>

              <div className="space-y-1">
                <FieldLabel className="mb-1 text-xs text-muted-foreground">Narration</FieldLabel>
                <Input
                  className="h-9 text-sm"
                  value={narration}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNarration(value);
                    patchRowDraft(selectedWithdrawal.id, selectedWithdrawal, { narration: value });
                  }}
                  placeholder="Optional note"
                  maxLength={500}
                  disabled={
                    selectedWithdrawal.status !== "requested" ||
                    actionLoadingId === selectedWithdrawal.id
                  }
                />
              </div>

              {payoutSettlementType === "bank" || !liabilityModuleEnabled ? (
                <div className="space-y-1">
                  <FieldLabel className="mb-1 text-xs text-muted-foreground">Company payout bank *</FieldLabel>
                  <AutocompleteField
                    value={bankId}
                    onChange={(id) => {
                      setBankId(id);
                      patchRowDraft(selectedWithdrawal.id, selectedWithdrawal, {
                        bankId: id,
                        bankLabel: undefined,
                        payoutSettlementType: "bank",
                      });
                    }}
                    loadOptions={loadBankOptions}
                    placeholder="Search bank (last 4 / name / account)..."
                    emptyText="No banks found"
                    defaultOption={bankAutocompleteDefault}
                    disabled={
                      selectedWithdrawal.status !== "requested" ||
                      actionLoadingId === selectedWithdrawal.id
                    }
                  />
                  <FieldError message={errors.bankId} />
                </div>
              ) : (
                <div className="space-y-1">
                  <FieldLabel className="mb-1 text-xs text-muted-foreground">Liability person paying out *</FieldLabel>
                  <AutocompleteField
                    value={liabilityPersonId}
                    onChange={(id) => {
                      setLiabilityPersonId(id);
                      patchRowDraft(selectedWithdrawal.id, selectedWithdrawal, {
                        liabilityPersonId: id,
                        liabilityPersonLabel: undefined,
                        payoutSettlementType: "person",
                      });
                    }}
                    loadOptions={loadLiabilityPersonOptions}
                    placeholder="Search liability person..."
                    emptyText="No persons found"
                    defaultOption={payoutPersonAutocompleteDefault}
                    disabled={
                      selectedWithdrawal.status !== "requested" ||
                      actionLoadingId === selectedWithdrawal.id
                    }
                  />
                  <FieldError message={errors.liabilityPersonId} />
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                <Button
                  variant="success"
                  startIcon={<IconCheck size={18} />}
                  onClick={() => void onPayoutSubmit()}
                  disabled={
                    selectedWithdrawal.status !== "requested" ||
                    actionLoadingId === selectedWithdrawal.id
                  }
                  className="w-full justify-center"
                >
                  {actionLoadingId === selectedWithdrawal.id ? "Processing…" : "Record Payout"}
                </Button>
                <Button
                  variant="danger"
                  startIcon={<IconX size={18} />}
                  onClick={() => openRejectForRow(selectedWithdrawal.id)}
                  disabled={
                    selectedWithdrawal.status !== "requested" ||
                    actionLoadingId === selectedWithdrawal.id
                  }
                  skipTab
                  className="w-full justify-center"
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  startIcon={<IconRefresh size={18} />}
                  onClick={closeSidebar}
                  skipTab
                  className="w-full justify-center"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DetailsSidebar>

      {bulkConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <div className="card w-full max-w-lg space-y-4 p-4">
            <h3 className="text-lg font-semibold">Approve import-ready withdrawals</h3>
            <p className="text-sm text-gray-600">
              You are about to record payout for <strong>{bulkSummary.count}</strong> requested withdrawal
              {bulkSummary.count === 1 ? "" : "s"} using payout UTR and bank/person stored from import.
            </p>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">Payable total</dt>
              <dd className="text-right font-semibold tabular-nums">{formatWholeMoney(bulkSummary.payableTotal)}</dd>
            </dl>
            {bulkSummary.utrs.length > 0 && (
              <div className="rounded-md border border-[var(--border)] bg-slate-50 px-3 py-2 text-xs text-gray-700">
                <p className="mb-1 font-medium">Payout UTRs</p>
                <p className="font-mono break-all">
                  {bulkSummary.utrs.slice(0, 5).join(", ")}
                  {bulkSummary.utrs.length > 5 ? ` … and ${bulkSummary.utrs.length - 5} more` : ""}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                disabled={bulkApproving}
                onClick={() => setBulkConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="success"
                loading={bulkApproving}
                onClick={() => void confirmBulkApprove()}
              >
                Confirm and approve all
              </Button>
            </div>
          </div>
        </div>
      )}

      {bulkProgressOpen && bulkProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <div className="card w-full max-w-lg space-y-4 p-4">
            <h3 className="text-lg font-semibold">Bulk settlement progress</h3>
            <div className="space-y-2">
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${bulkProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {bulkProgress.progress.processedRows}/{bulkProgress.progress.totalRows} processed
                </span>
                <span>{bulkProgressPercent}%</span>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">Success</dt>
              <dd className="text-right font-semibold tabular-nums text-emerald-700">
                {bulkProgress.progress.successRows}
              </dd>
              <dt className="text-gray-500">Failed</dt>
              <dd className="text-right font-semibold tabular-nums text-red-600">
                {bulkProgress.progress.failedRows}
              </dd>
              <dt className="text-gray-500">Status</dt>
              <dd className="text-right font-medium capitalize">{bulkProgress.status}</dd>
            </dl>
            {bulkProgress.errorSample.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <p className="mb-1 font-medium">Failure sample</p>
                <p className="break-all">
                  {bulkProgress.errorSample
                    .slice(0, 3)
                    .map((item) => item.error)
                    .join("; ")}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setBulkProgressOpen(false)}
                disabled={bulkProgress.status === "processing" || bulkProgress.status === "queued"}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <WithdrawalBankerUtrUploadDialog
        open={utrUploadOpen}
        onClose={() => setUtrUploadOpen(false)}
        onSuccess={() => {
          setTableKey((k) => k + 1);
          setBulkSelection({});
        }}
      />

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
          setRejectTargetId(null);
          setRejectReasonId("");
          setRejectRemark("");
        }}
        onConfirm={() => void onRejectSubmit()}
      />
    </>
  );
}
