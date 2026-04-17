 "use client";

import { useCallback, useMemo, useState } from "react";
import { IconHistory, IconPencil, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { DetailsSidebar } from "@/components/common/DetailsSidebar";
import { FormGrid } from "@/components/common/FormGrid";
import { FieldLabel } from "@/components/common/FieldLabel";
import { FieldError } from "@/components/common/FieldError";
import { AutocompleteField, type AutocompleteOption } from "@/components/common/AutocompleteField";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { useExport } from "@/hooks/useExport";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { useAuth } from "@/context/AuthContext";
import { NAV_PERMISSIONS } from "@/lib/constants/navPermissions";
import { getApiErrorMessage } from "@/lib/apiError";
import { listBanksNormalized } from "@/services/bankService";
import { listReasonOptions } from "@/services/reasonService";
import { REASON_TYPES } from "@/lib/constants/reasonTypes";
import {
  amendWithdrawal,
  deleteWithdrawal,
  exportWithdrawals,
  listWithdrawalsNormalized,
  normalizeWithdrawal,
} from "@/services/withdrawalService";
import type { WithdrawalRow } from "@/types/withdrawal";
import { withdrawalStatusApiParam } from "@/modules/withdrawal/withdrawalListingStatusFilter";
import { WITHDRAWAL_FINAL_FILTER_KEYS } from "@/modules/withdrawal/withdrawalFinalListConstants";
import { WithdrawalFinalListFilterPanel } from "@/modules/withdrawal/components/WithdrawalFinalListFilterPanel";

function toOptionalFilterValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function getCurrentDateTimeLocal(): string {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function toDateTimeLocalInput(iso?: string): string {
  if (!iso) return getCurrentDateTimeLocal();
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return getCurrentDateTimeLocal();
  const tzOffsetMs = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

export function WithdrawalFinalListClient() {
  const { user } = useAuth();
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
  const [tableKey, setTableKey] = useState(0);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRow | null>(null);
  const [amendOpen, setAmendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [amendAmount, setAmendAmount] = useState("");
  const [amendReverseBonus, setAmendReverseBonus] = useState("");
  const [amendRequestedAt, setAmendRequestedAt] = useState(getCurrentDateTimeLocal());
  const [amendPayoutBankId, setAmendPayoutBankId] = useState("");
  const [amendPayoutBankDefault, setAmendPayoutBankDefault] = useState<AutocompleteOption | null>(null);
  const [amendUtr, setAmendUtr] = useState("");
  const [amendReasonId, setAmendReasonId] = useState("");
  const [amendReasonDefault, setAmendReasonDefault] = useState<AutocompleteOption | null>(null);
  const [amendReason, setAmendReason] = useState("");
  const [amendLoading, setAmendLoading] = useState(false);
  const [amendErrors, setAmendErrors] = useState<{
    amount?: string;
    reverseBonus?: string;
    payoutBankId?: string;
    utr?: string;
    reason?: string;
  }>({});

  const canAmend = useMemo(() => {
    if (!user) return false;
    if (user.role === "superadmin") return true;
    return (user.permissions ?? []).includes(NAV_PERMISSIONS.WITHDRAWAL_FINAL_VIEW);
  }, [user]);
  const canDelete = user?.role === "superadmin";

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
      hasAmendment: toOptionalFilterValue(filters.hasAmendment || ""),
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
      hasAmendment: toOptionalFilterValue(filters.hasAmendment || ""),
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

  const loadPayoutBankOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
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

  const loadAmendReasonOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    const rows = await listReasonOptions(REASON_TYPES.WITHDRAWAL_FINAL_AMEND);
    const qn = query.trim().toLowerCase();
    return rows
      .filter((r) => (qn ? r.reason.toLowerCase().includes(qn) : true))
      .map((r) => ({ value: r.id, label: r.reason }));
  }, []);

  const openAmendDialog = useCallback((row: WithdrawalRow) => {
    if (!canAmend || row.status !== "approved") return;
    setAmendAmount(String(row.amount));
    setAmendReverseBonus(String(row.reverseBonus ?? 0));
    setAmendRequestedAt(toDateTimeLocalInput(row.requestedAt));
    setAmendPayoutBankId(row.payoutBankId?.trim() || "");
    setAmendPayoutBankDefault(
      row.payoutBankId && row.payoutBankName
        ? { value: row.payoutBankId, label: row.payoutBankName }
        : null,
    );
    setAmendUtr(row.utr ?? "");
    setAmendReasonId("");
    setAmendReasonDefault(null);
    setAmendReason("");
    setAmendErrors({});
    setAmendOpen(true);
  }, [canAmend]);

  const openDeleteDialog = useCallback((row: WithdrawalRow) => {
    if (!canDelete) return;
    setSelectedWithdrawal(row);
    setDeleteOpen(true);
  }, [canDelete]);

  const submitAmend = useCallback(async () => {
    if (!selectedWithdrawal) return;
    const next: typeof amendErrors = {};
    const amountNum = Number(amendAmount);
    const reverseBonusNum = Number(amendReverseBonus);
    if (!Number.isFinite(amountNum) || amountNum < 1) next.amount = "Enter a valid amount (min 1).";
    if (!Number.isFinite(reverseBonusNum) || reverseBonusNum < 0) {
      next.reverseBonus = "Reverse bonus must be a number >= 0.";
    }
    if (!amendPayoutBankId.trim()) next.payoutBankId = "Payout bank is required.";
    if (!amendUtr.trim()) next.utr = "UTR is required.";
    if (!amendReasonId.trim()) next.reason = "Reason selection is required.";
    if (Object.keys(next).length) {
      setAmendErrors(next);
      return;
    }
    setAmendLoading(true);
    try {
      const raw = await amendWithdrawal(selectedWithdrawal.id, {
        amount: amountNum,
        reverseBonus: reverseBonusNum,
        payoutBankId: amendPayoutBankId.trim(),
        utr: amendUtr.trim(),
        requestedAt: amendRequestedAt || undefined,
        reasonId: amendReasonId.trim(),
        remark: amendReason.trim() || undefined,
      });
      toast.success("Withdrawal amended.");
      setAmendOpen(false);
      setTableKey((k) => k + 1);
      if (raw && typeof raw === "object") {
        setSelectedWithdrawal(normalizeWithdrawal(raw as Record<string, unknown>));
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not amend withdrawal."));
    } finally {
      setAmendLoading(false);
    }
  }, [
    selectedWithdrawal,
    amendAmount,
    amendReverseBonus,
    amendRequestedAt,
    amendPayoutBankId,
    amendUtr,
    amendReasonId,
    amendReason,
  ]);

  const submitDelete = useCallback(async () => {
    if (!selectedWithdrawal) return;
    setDeleteLoading(true);
    try {
      await deleteWithdrawal(selectedWithdrawal.id);
      toast.success("Withdrawal deleted.");
      setDeleteOpen(false);
      setSelectedWithdrawal(null);
      setTableKey((k) => k + 1);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not delete withdrawal."));
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedWithdrawal]);

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
        field: "amendmentCount",
        label: "Amend.",
        render: (row: WithdrawalRow) =>
          row.amendmentCount != null && row.amendmentCount > 0 ? String(row.amendmentCount) : "—",
        minWidth: 72,
        sortable: false,
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
        label: "Transaction at",
        sortable: true,
        ...tableColumnPresets.dateCol,
        render: (row: WithdrawalRow) =>
          row.requestedAt || row.createdAt ? new Date(row.requestedAt ?? row.createdAt!).toLocaleString() : "—",
      },
    ],
    [],
  );

  const historyRows = useMemo(() => {
    const list = selectedWithdrawal?.amendmentHistory ?? [];
    return [...list].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [selectedWithdrawal?.amendmentHistory]);

  return (
    <>
      <ListingPageContainer
        title="Withdrawal / Final list"
        description="All withdrawals including rejections. Click a row for details and amendment activity."
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
              key={tableKey}
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
              getRowKey={(row) => (row as WithdrawalRow).id}
              selectedRowKey={selectedWithdrawal?.id ?? null}
              onRowClick={(row) => setSelectedWithdrawal(row as WithdrawalRow)}
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

      <DetailsSidebar
        open={Boolean(selectedWithdrawal)}
        title="Withdrawal details"
        subtitle={selectedWithdrawal ? `UTR ${selectedWithdrawal.utr || "—"}` : undefined}
        onClose={() => setSelectedWithdrawal(null)}
        width="min(480px, 100vw)"
      >
        {selectedWithdrawal && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Summary</p>
                <TableStatusBadge status={selectedWithdrawal.status} />
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Player</dt>
                  <dd className="text-right font-medium">{selectedWithdrawal.playerName || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Payout bank</dt>
                  <dd className="max-w-[60%] text-right font-medium">{selectedWithdrawal.payoutBankName || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Amount / reverse / payable</dt>
                  <dd className="text-right font-medium">
                    {selectedWithdrawal.amount.toLocaleString()} /{" "}
                    {(selectedWithdrawal.reverseBonus ?? 0).toLocaleString()} /{" "}
                    {(selectedWithdrawal.payableAmount ?? 0).toLocaleString()}
                  </dd>
                </div>
                {selectedWithdrawal.lastAmendedAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500">Last amended</dt>
                    <dd className="text-right text-xs">
                      {new Date(selectedWithdrawal.lastAmendedAt).toLocaleString()}
                      {selectedWithdrawal.lastAmendedByName ? ` · ${selectedWithdrawal.lastAmendedByName}` : ""}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {canAmend && selectedWithdrawal.status === "approved" && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                startIcon={<IconPencil className="size-4" />}
                onClick={() => openAmendDialog(selectedWithdrawal)}
              >
                Amend withdrawal
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="danger"
                className="w-full"
                startIcon={<IconTrash className="size-4" />}
                onClick={() => openDeleteDialog(selectedWithdrawal)}
              >
                Delete withdrawal
              </Button>
            )}

            <div className="rounded-lg border border-[var(--border)] bg-white p-3">
              <div className="mb-2 flex items-center gap-2">
                <IconHistory className="size-4 text-[var(--brand-primary)]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Amendment activity
                </p>
              </div>
              {historyRows.length === 0 ? (
                <p className="text-sm text-gray-500">No amendments yet.</p>
              ) : (
                <div className="max-h-64 overflow-auto [scrollbar-width:thin]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="py-1 pr-2 font-medium">When</th>
                        <th className="py-1 font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.map((h, i) => (
                        <tr key={`${h.at}-${i}`} className="border-b border-gray-100 align-top">
                          <td className="py-2 pr-2 whitespace-nowrap text-gray-600">
                            {h.at ? new Date(h.at).toLocaleString() : "—"}
                          </td>
                          <td className="py-2 text-gray-800">
                            <span className="line-clamp-3">{h.reason}</span>
                            <div className="mt-1 text-[10px] text-gray-500">
                              Payable {h.old.payableAmount ?? "—"} → {h.new.payableAmount ?? "—"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DetailsSidebar>

      <Dialog open={amendOpen} title="Amend approved withdrawal" onClose={() => !amendLoading && setAmendOpen(false)}>
        <p className="mb-3 text-sm text-gray-600">
          Changes update settlement balances and are recorded in amendment history and audit logs.
        </p>
        <FormGrid>
          <div>
            <FieldLabel>Amount</FieldLabel>
            <Input
              className="h-9"
              type="text"
              inputMode="decimal"
              value={amendAmount}
              onChange={(e) => setAmendAmount(e.target.value)}
            />
            <FieldError message={amendErrors.amount} />
          </div>
          <div>
            <FieldLabel>Reverse bonus</FieldLabel>
            <Input
              className="h-9"
              type="text"
              inputMode="decimal"
              value={amendReverseBonus}
              onChange={(e) => setAmendReverseBonus(e.target.value)}
            />
            <FieldError message={amendErrors.reverseBonus} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Requested date & time</FieldLabel>
            <Input
              className="h-9"
              type="datetime-local"
              value={amendRequestedAt}
              onChange={(e) => setAmendRequestedAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Payout bank</FieldLabel>
            <AutocompleteField
              value={amendPayoutBankId}
              onChange={(v) => setAmendPayoutBankId(v)}
              loadOptions={loadPayoutBankOptions}
              placeholder="Search bank…"
              defaultOption={amendPayoutBankDefault}
            />
            <FieldError message={amendErrors.payoutBankId} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>UTR</FieldLabel>
            <Input className="h-9" value={amendUtr} onChange={(e) => setAmendUtr(e.target.value)} />
            <FieldError message={amendErrors.utr} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Reason (required)</FieldLabel>
            <AutocompleteField
              value={amendReasonId}
              onChange={(v) => setAmendReasonId(v)}
              loadOptions={loadAmendReasonOptions}
              placeholder="Select amendment reason…"
              defaultOption={amendReasonDefault}
            />
            <FieldError message={amendErrors.reason} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Remark (optional)</FieldLabel>
            <Textarea
              className="min-h-[88px] text-sm"
              value={amendReason}
              onChange={(e) => setAmendReason(e.target.value)}
              placeholder="Add additional context (optional)…"
            />
          </div>
        </FormGrid>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setAmendOpen(false)} disabled={amendLoading}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={() => void submitAmend()} disabled={amendLoading}>
            {amendLoading ? "Saving…" : "Save amendment"}
          </Button>
        </div>
      </Dialog>

      <Dialog open={deleteOpen} title="Delete withdrawal" onClose={() => !deleteLoading && setDeleteOpen(false)}>
        <p className="mb-3 text-sm text-gray-600">
          This will permanently delete the withdrawal and reverse impacted balances based on current status.
        </p>
        <div className="space-y-1 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-gray-700">
          <div><span className="font-medium">UTR:</span> {selectedWithdrawal?.utr || "—"}</div>
          <div><span className="font-medium">Status:</span> {selectedWithdrawal?.status || "—"}</div>
          <div><span className="font-medium">Amount:</span> {selectedWithdrawal?.amount?.toLocaleString?.() ?? "—"}</div>
          <div><span className="font-medium">Player:</span> {selectedWithdrawal?.playerName || "—"}</div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={() => void submitDelete()} disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete permanently"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

