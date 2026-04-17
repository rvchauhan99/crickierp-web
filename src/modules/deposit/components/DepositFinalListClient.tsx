"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconHistory, IconPencil } from "@tabler/icons-react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { DetailsSidebar } from "@/components/common/DetailsSidebar";
import { AutocompleteField, type AutocompleteOption } from "@/components/common/AutocompleteField";
import { FormGrid } from "@/components/common/FormGrid";
import { FieldLabel } from "@/components/common/FieldLabel";
import { FieldError } from "@/components/common/FieldError";
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
import {
  amendDeposit,
  exportDeposits,
  listDepositsNormalized,
  normalizeDeposit,
} from "@/services/depositService";
import { listBanksNormalized } from "@/services/bankService";
import { listPlayersNormalized } from "@/services/playerService";
import { listReasonOptions } from "@/services/reasonService";
import { REASON_TYPES } from "@/lib/constants/reasonTypes";
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

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function DepositFinalListClient() {
  const { user } = useAuth();
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
  const [tableKey, setTableKey] = useState(0);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRow | null>(null);
  const [amendOpen, setAmendOpen] = useState(false);
  const [amendBankId, setAmendBankId] = useState("");
  const [amendBankDefault, setAmendBankDefault] = useState<AutocompleteOption | null>(null);
  const [amendUtr, setAmendUtr] = useState("");
  const [amendAmount, setAmendAmount] = useState("");
  const [amendPlayerId, setAmendPlayerId] = useState("");
  const [amendPlayerDefault, setAmendPlayerDefault] = useState<AutocompleteOption | null>(null);
  const [amendBonus, setAmendBonus] = useState("");
  const [amendReason, setAmendReason] = useState("");
  const [amendReasonId, setAmendReasonId] = useState("");
  const [amendReasonDefault, setAmendReasonDefault] = useState<AutocompleteOption | null>(null);
  const [amendLoading, setAmendLoading] = useState(false);
  const [amendErrors, setAmendErrors] = useState<{
    bankId?: string;
    utr?: string;
    amount?: string;
    playerId?: string;
    bonus?: string;
    reason?: string;
  }>({});

  const canAmend = useMemo(() => {
    if (!user) return false;
    if (user.role === "superadmin") return true;
    return (user.permissions ?? []).includes(NAV_PERMISSIONS.DEPOSIT_FINAL_VIEW);
  }, [user]);

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
      hasAmendment: toOptionalFilterValue(filters.hasAmendment || ""),
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
      hasAmendment: toOptionalFilterValue(filters.hasAmendment || ""),
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

  const loadPlayerOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const { data } = await listPlayersNormalized({
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
        q: query || undefined,
      });
      return data.map((p) => ({
        value: p._id,
        label: `${p.playerId}${p.phone ? ` · ${p.phone}` : ""}`,
      }));
    } catch {
      return [];
    }
  }, []);

  const loadAmendReasonOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    const rows = await listReasonOptions(REASON_TYPES.DEPOSIT_FINAL_AMEND);
    const qn = query.trim().toLowerCase();
    return rows
      .filter((r) => (qn ? r.reason.toLowerCase().includes(qn) : true))
      .map((r) => ({ value: r.id, label: r.reason }));
  }, []);

  const openAmendDialog = useCallback((row: DepositRow) => {
    if (!canAmend || row.status !== "verified") return;
    const pid = row.playerMongoId?.trim() || "";
    setAmendBankId(row.bankId?.trim() || "");
    setAmendBankDefault(
      row.bankId && row.bankName
        ? { value: row.bankId, label: row.bankName }
        : null,
    );
    setAmendUtr(row.utr);
    setAmendAmount(String(row.amount));
    setAmendPlayerId(pid);
    setAmendPlayerDefault(
      pid && row.playerIdLabel
        ? { value: pid, label: row.playerIdLabel }
        : pid
          ? { value: pid, label: pid }
          : null,
    );
    setAmendBonus(row.bonusAmount != null ? String(row.bonusAmount) : "0");
    setAmendReasonId("");
    setAmendReasonDefault(null);
    setAmendReason("");
    setAmendErrors({});
    setAmendOpen(true);
  }, [canAmend]);

  const submitAmend = useCallback(async () => {
    if (!selectedDeposit) return;
    const next: typeof amendErrors = {};
    if (!amendBankId.trim()) next.bankId = "Bank is required.";
    if (!amendUtr.trim()) next.utr = "UTR is required.";
    const amt = Number(amendAmount);
    if (!Number.isFinite(amt) || amt < 1) next.amount = "Enter a valid amount (min 1).";
    if (!amendPlayerId.trim()) next.playerId = "Player is required.";
    const bonusNum = Number(amendBonus);
    if (!Number.isFinite(bonusNum) || bonusNum < 0) next.bonus = "Bonus must be a number ≥ 0.";
    if (!amendReasonId.trim()) next.reason = "Reason selection is required.";
    if (Object.keys(next).length) {
      setAmendErrors(next);
      return;
    }
    setAmendLoading(true);
    try {
      const raw = await amendDeposit(selectedDeposit.id, {
        bankId: amendBankId.trim(),
        utr: amendUtr.trim(),
        amount: amt,
        playerId: amendPlayerId.trim(),
        bonusAmount: bonusNum,
        reasonId: amendReasonId.trim(),
        remark: amendReason.trim() || undefined,
      });
      toast.success("Deposit amended.");
      setAmendOpen(false);
      setTableKey((k) => k + 1);
      if (raw && typeof raw === "object") {
        const updated = normalizeDeposit(raw as Record<string, unknown>);
        setSelectedDeposit(updated);
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not amend deposit."));
    } finally {
      setAmendLoading(false);
    }
  }, [
    selectedDeposit,
    amendBankId,
    amendUtr,
    amendAmount,
    amendPlayerId,
    amendBonus,
    amendReasonId,
    amendReason,
  ]);

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
        field: "amendmentCount",
        label: "Amend.",
        render: (row: DepositRow) =>
          row.amendmentCount != null && row.amendmentCount > 0 ? String(row.amendmentCount) : "—",
        minWidth: 72,
        sortable: false,
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

  const historyRows = useMemo(() => {
    const list = selectedDeposit?.amendmentHistory ?? [];
    return [...list].sort((a, b) => {
      const ta = new Date(a.at).getTime();
      const tb = new Date(b.at).getTime();
      return tb - ta;
    });
  }, [selectedDeposit?.amendmentHistory]);

  return (
    <>
      <ListingPageContainer
        title="Deposit / Final list"
        description="All deposits including rejections. Click a row for details and amendments (verified deposits). Use advanced filters for UTR, bank, status, dates, and more."
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
              getRowKey={(row) => (row as DepositRow).id}
              selectedRowKey={selectedDeposit?.id ?? null}
              onRowClick={(row) => setSelectedDeposit(row as DepositRow)}
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

      <DetailsSidebar
        open={Boolean(selectedDeposit)}
        title="Deposit details"
        subtitle={selectedDeposit ? `UTR ${selectedDeposit.utr}` : undefined}
        onClose={() => setSelectedDeposit(null)}
        width="min(480px, 100vw)"
      >
        {selectedDeposit && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Summary</p>
                <TableStatusBadge status={selectedDeposit.status} />
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Bank</dt>
                  <dd className="max-w-[60%] text-right font-medium">{selectedDeposit.bankName}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Amount / bonus / total</dt>
                  <dd className="text-right font-medium">
                    {selectedDeposit.amount.toLocaleString()} /{" "}
                    {selectedDeposit.bonusAmount != null ? selectedDeposit.bonusAmount.toLocaleString() : "—"} /{" "}
                    {selectedDeposit.totalAmount != null ? selectedDeposit.totalAmount.toLocaleString() : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Player</dt>
                  <dd className="text-right font-medium">{selectedDeposit.playerIdLabel || "—"}</dd>
                </div>
                {selectedDeposit.lastAmendedAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500">Last amended</dt>
                    <dd className="text-right text-xs">
                      {formatDateTime(selectedDeposit.lastAmendedAt)}
                      {selectedDeposit.lastAmendedByName ? ` · ${selectedDeposit.lastAmendedByName}` : ""}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {canAmend && selectedDeposit.status === "verified" && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                startIcon={<IconPencil className="size-4" />}
                onClick={() => openAmendDialog(selectedDeposit)}
              >
                Amend deposit
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
                            {formatDateTime(h.at)}
                          </td>
                          <td className="py-2 text-gray-800">
                            <span className="line-clamp-3">{h.reason}</span>
                            <div className="mt-1 text-[10px] text-gray-500">
                              Amt {h.old.amount?.toLocaleString?.() ?? h.old.amount} →{" "}
                              {h.new.amount?.toLocaleString?.() ?? h.new.amount} · Total{" "}
                              {h.old.totalAmount?.toLocaleString?.() ?? h.old.totalAmount} →{" "}
                              {h.new.totalAmount?.toLocaleString?.() ?? h.new.totalAmount}
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

      <Dialog
        open={amendOpen}
        title="Amend verified deposit"
        onClose={() => !amendLoading && setAmendOpen(false)}
      >
        <p className="mb-3 text-sm text-gray-600">
          Changes update bank and exchange balances and are recorded in the amendment history and audit log.
        </p>
        <FormGrid>
          <div className="sm:col-span-2">
            <FieldLabel>Bank account</FieldLabel>
            <AutocompleteField
              value={amendBankId}
              onChange={(v) => setAmendBankId(v)}
              loadOptions={loadBankOptions}
              placeholder="Search bank…"
              defaultOption={amendBankDefault}
            />
            <FieldError message={amendErrors.bankId} />
          </div>
          <div>
            <FieldLabel>UTR</FieldLabel>
            <Input
              className="h-9"
              value={amendUtr}
              onChange={(e) => setAmendUtr(e.target.value)}
              autoComplete="off"
            />
            <FieldError message={amendErrors.utr} />
          </div>
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
          <div className="sm:col-span-2">
            <FieldLabel>Player</FieldLabel>
            <AutocompleteField
              value={amendPlayerId}
              onChange={(v) => setAmendPlayerId(v)}
              loadOptions={loadPlayerOptions}
              placeholder="Search player…"
              defaultOption={amendPlayerDefault}
            />
            <FieldError message={amendErrors.playerId} />
          </div>
          <div>
            <FieldLabel>Bonus amount</FieldLabel>
            <Input
              className="h-9"
              type="text"
              inputMode="decimal"
              value={amendBonus}
              onChange={(e) => setAmendBonus(e.target.value)}
            />
            <FieldError message={amendErrors.bonus} />
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
    </>
  );
}
