"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconHistory, IconPencil } from "@tabler/icons-react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import { FormContainer, FormActions } from "@/components/common/FormContainer";
import { FormGrid } from "@/components/common/FormGrid";
import { FieldLabel } from "@/components/common/FieldLabel";
import { FieldError } from "@/components/common/FieldError";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { DetailsSidebar } from "@/components/common/DetailsSidebar";
import { AutocompleteField, type AutocompleteOption } from "@/components/common/AutocompleteField";
import {
  OperatedMoneyFields,
  defaultOperatedMoneyValue,
  toMoneyFxPayload,
  type OperatedMoneyValue,
} from "@/components/common/OperatedMoneyFields";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import {
  amendBankTransfer,
  createBankTransfer,
  listBankTransfersNormalized,
  type BankTransferAmendmentEntry,
  type BankTransferRow,
} from "@/services/bankService";
import { listBankLookupOptions } from "@/services/lookupService";
import { listReasonOptions } from "@/services/reasonService";
import { REASON_TYPES } from "@/lib/constants/reasonTypes";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuth } from "@/context/AuthContext";
import { useOperatorEntryForm } from "@/hooks/useOperatorEntryForm";
import { canEditBusinessEntryDateTime } from "@/lib/roles";
import {
  formatDateTimeForUser,
  resolveUserTimeZone,
  todayYmdInUserTz,
} from "@/lib/userTimezone";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { formatScaledMoney } from "@/lib/formatMoney";

function entryDateToInputValue(entryDate: string): string {
  const raw = String(entryDate || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return todayYmdInUserTz();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveUserTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function userLabel(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const o = value as Record<string, unknown>;
  const full = o.fullName != null ? String(o.fullName).trim() : "";
  if (full) return full;
  const username = o.username != null ? String(o.username).trim() : "";
  return username;
}

function snapshotMoneyLabel(
  amount: number | undefined,
  currency: string | null | undefined,
): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return formatScaledMoney(amount, currency || "USD");
}

/**
 * Bank → Bank internal transfer only (no person accounts).
 */
export function BankTransferClient() {
  const listingState = useListingQueryStateReference({
    defaultLimit: 20,
    filterKeys: [],
  });
  const { page, limit, sortBy, sortOrder, setPage, setLimit, setSort } = listingState;
  const { platformCurrency } = usePlatformSettings();
  const { platformCurrency: fmtCurrency } = useFormatMoney();
  const { user } = useAuth();
  const canEditEntryDate = canEditBusinessEntryDateTime(user?.role);
  const { formRef: entryRef, afterSuccessfulSave } = useOperatorEntryForm();

  const [entryDate, setEntryDate] = useState(() => todayYmdInUserTz());
  const [money, setMoney] = useState(() => defaultOperatedMoneyValue(platformCurrency));
  const [fromBankId, setFromBankId] = useState("");
  const [toBankId, setToBankId] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [selected, setSelected] = useState<BankTransferRow | null>(null);
  const [amendOpen, setAmendOpen] = useState(false);
  const [amendLoading, setAmendLoading] = useState(false);
  const [amendEntryDate, setAmendEntryDate] = useState(() => todayYmdInUserTz());
  const [amendMoney, setAmendMoney] = useState<OperatedMoneyValue>(() =>
    defaultOperatedMoneyValue(platformCurrency),
  );
  const [amendFromBankId, setAmendFromBankId] = useState("");
  const [amendFromBankDefault, setAmendFromBankDefault] = useState<AutocompleteOption | null>(null);
  const [amendToBankId, setAmendToBankId] = useState("");
  const [amendToBankDefault, setAmendToBankDefault] = useState<AutocompleteOption | null>(null);
  const [amendReferenceNo, setAmendReferenceNo] = useState("");
  const [amendRemark, setAmendRemark] = useState("");
  const [amendReasonId, setAmendReasonId] = useState("");
  const [amendReasonDefault, setAmendReasonDefault] = useState<AutocompleteOption | null>(null);
  const [amendExtraRemark, setAmendExtraRemark] = useState("");
  const [amendErrors, setAmendErrors] = useState<{
    fromBankId?: string;
    toBankId?: string;
    amount?: string;
    reason?: string;
  }>({});

  useEffect(() => {
    if (!platformCurrency) return;
    setMoney((prev) =>
      prev.operatedCurrency ? prev : { ...prev, operatedCurrency: platformCurrency },
    );
  }, [platformCurrency]);

  const loadBankOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    const rows = await listBankLookupOptions({ q: query || undefined, limit: 30 });
    return rows.map((b) => ({
      value: b.id,
      label: b.label,
    }));
  }, []);

  const loadAmendReasonOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    const rows = await listReasonOptions(REASON_TYPES.BANK_TRANSFER_AMEND);
    const qn = query.trim().toLowerCase();
    return rows
      .filter((r) => (qn ? r.reason.toLowerCase().includes(qn) : true))
      .map((r) => ({ value: r.id, label: r.reason }));
  }, []);

  const fetcher = useCallback(async (params: Record<string, unknown>) => listBankTransfersNormalized(params), []);

  const resetForm = useCallback(() => {
    setEntryDate(todayYmdInUserTz());
    setMoney(defaultOperatedMoneyValue(platformCurrency));
    setFromBankId("");
    setToBankId("");
    setReferenceNo("");
    setRemark("");
  }, [platformCurrency]);

  const openAmendDialog = useCallback(
    (row: BankTransferRow) => {
      setSelected(row);
      setAmendEntryDate(entryDateToInputValue(row.entryDate));
      const opCur = row.operatedCurrency || platformCurrency || "";
      const opAmt = row.operatedAmount != null ? row.operatedAmount : row.amount;
      setAmendMoney({
        amount: opAmt != null ? String(opAmt) : "",
        operatedCurrency: opCur,
        exchangeRate: row.exchangeRate != null ? String(row.exchangeRate) : "1",
      });
      setAmendFromBankId(row.fromBankId);
      setAmendFromBankDefault(
        row.fromBankId ? { value: row.fromBankId, label: row.fromBankName || row.fromBankId } : null,
      );
      setAmendToBankId(row.toBankId);
      setAmendToBankDefault(
        row.toBankId ? { value: row.toBankId, label: row.toBankName || row.toBankId } : null,
      );
      setAmendReferenceNo(row.referenceNo || "");
      setAmendRemark(row.remark || "");
      setAmendReasonId("");
      setAmendReasonDefault(null);
      setAmendExtraRemark("");
      setAmendErrors({});
      setAmendOpen(true);
    },
    [platformCurrency],
  );

  const submitAmend = useCallback(async () => {
    if (!selected || !platformCurrency) return;
    const next: typeof amendErrors = {};
    if (!amendFromBankId.trim()) next.fromBankId = "From bank is required.";
    if (!amendToBankId.trim()) next.toBankId = "To bank is required.";
    if (amendFromBankId.trim() && amendToBankId.trim() && amendFromBankId.trim() === amendToBankId.trim()) {
      next.toBankId = "From bank and To bank must be different.";
    }
    const operatedAmt = Number(amendMoney.amount);
    if (!amendMoney.amount.trim() || Number.isNaN(operatedAmt) || operatedAmt <= 0) {
      next.amount = "Valid amount required.";
    } else if ((amendMoney.operatedCurrency || platformCurrency) !== platformCurrency) {
      const rate = Number(amendMoney.exchangeRate);
      if (!amendMoney.exchangeRate.trim() || !Number.isFinite(rate) || rate <= 0) {
        next.amount = "Enter a valid exchange rate.";
      }
    }
    if (!amendReasonId.trim()) next.reason = "Reason selection is required.";
    if (Object.keys(next).length) {
      setAmendErrors(next);
      return;
    }
    const fx = toMoneyFxPayload(amendMoney, platformCurrency, "decimal");
    setAmendLoading(true);
    try {
      await amendBankTransfer(selected.id, {
        fromBankId: amendFromBankId.trim(),
        toBankId: amendToBankId.trim(),
        amount: fx.amount,
        operatedCurrency: fx.operatedCurrency,
        operatedAmount: fx.operatedAmount,
        exchangeRate: fx.exchangeRate,
        entryDate: amendEntryDate,
        referenceNo: amendReferenceNo.trim() || undefined,
        remark: amendRemark.trim() || undefined,
        reasonId: amendReasonId.trim(),
        amendRemark: amendExtraRemark.trim() || undefined,
      });
      toast.success("Bank transfer amended.");
      setAmendOpen(false);
      setSelected(null);
      setTableKey((k) => k + 1);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to amend bank transfer"));
    } finally {
      setAmendLoading(false);
    }
  }, [
    selected,
    platformCurrency,
    amendFromBankId,
    amendToBankId,
    amendMoney,
    amendReasonId,
    amendEntryDate,
    amendReferenceNo,
    amendRemark,
    amendExtraRemark,
  ]);

  const onSubmit = async () => {
    if (!platformCurrency) {
      toast.error("Set platform currency in Profile first");
      return;
    }
    const operatedAmt = Number(money.amount);
    if (!entryDate || !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) return toast.error("Valid entry date required.");
    if (!fromBankId.trim() || !toBankId.trim()) return toast.error("Select both From and To banks.");
    if (fromBankId.trim() === toBankId.trim()) return toast.error("From bank and To bank must be different.");
    if (!money.amount.trim() || Number.isNaN(operatedAmt) || operatedAmt <= 0) {
      return toast.error("Valid amount required.");
    }
    if ((money.operatedCurrency || platformCurrency) !== platformCurrency) {
      const rate = Number(money.exchangeRate);
      if (!money.exchangeRate.trim() || !Number.isFinite(rate) || rate <= 0) {
        return toast.error("Enter a valid exchange rate.");
      }
    }
    const fx = toMoneyFxPayload(money, platformCurrency, "decimal");
    setSaving(true);
    try {
      await createBankTransfer({
        fromBankId: fromBankId.trim(),
        toBankId: toBankId.trim(),
        amount: fx.amount,
        operatedCurrency: fx.operatedCurrency,
        operatedAmount: fx.operatedAmount,
        exchangeRate: fx.exchangeRate,
        entryDate,
        referenceNo: referenceNo.trim() || undefined,
        remark: remark.trim() || undefined,
      });
      toast.success("Bank transfer posted.");
      resetForm();
      setTableKey((k) => k + 1);
      afterSuccessfulSave();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to post bank transfer"));
    } finally {
      setSaving(false);
    }
  };

  const historyRows = useMemo(() => {
    const list = selected?.amendmentHistory ?? [];
    return [...list].sort((a, b) => {
      const ta = new Date(a.at).getTime();
      const tb = new Date(b.at).getTime();
      return tb - ta;
    });
  }, [selected?.amendmentHistory]);

  const columns = useMemo<PaginatedTableReferenceColumn[]>(
    () => [
      {
        field: "entryDate",
        label: "Date",
        ...tableColumnPresets.dateCol,
        sortable: true,
        render: (r: BankTransferRow) => formatDateTimeForUser(r.entryDate),
      },
      { field: "fromBankName", label: "From Bank" },
      { field: "toBankName", label: "To Bank" },
      {
        field: "amount",
        label: "Amount",
        sortable: true,
        render: (r: BankTransferRow) => formatScaledMoney(Number(r.amount ?? 0), fmtCurrency),
      },
      { field: "referenceNo", label: "Reference", render: (r: BankTransferRow) => r.referenceNo || "—" },
      { field: "remark", label: "Remark", render: (r: BankTransferRow) => r.remark || "—" },
      {
        field: "amendmentCount",
        label: "Amend.",
        render: (r: BankTransferRow) =>
          r.amendmentCount != null && r.amendmentCount > 0 ? String(r.amendmentCount) : "—",
        minWidth: 72,
      },
      {
        field: "actions",
        label: "Actions",
        minWidth: 88,
        render: (r: BankTransferRow) => (
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2"
            startIcon={<IconPencil size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              openAmendDialog(r);
            }}
            aria-label="Amend transfer"
          >
            Amend
          </Button>
        ),
      },
    ],
    [fmtCurrency, openAmendDialog],
  );

  const renderHistoryChange = (h: BankTransferAmendmentEntry) => {
    const parts: string[] = [];
    if (h.old.amount !== h.new.amount) {
      parts.push(
        `Amount ${snapshotMoneyLabel(h.old.amount, fmtCurrency)} → ${snapshotMoneyLabel(h.new.amount, fmtCurrency)}`,
      );
    }
    if (h.old.fromBankId !== h.new.fromBankId || h.old.toBankId !== h.new.toBankId) {
      parts.push(
        `Banks ${h.old.fromBankId ?? "—"}→${h.old.toBankId ?? "—"} → ${h.new.fromBankId ?? "—"}→${h.new.toBankId ?? "—"}`,
      );
    }
    if (h.old.entryDate !== h.new.entryDate) {
      parts.push(
        `Date ${h.old.entryDate ? formatDateTimeForUser(h.old.entryDate) : "—"} → ${
          h.new.entryDate ? formatDateTimeForUser(h.new.entryDate) : "—"
        }`,
      );
    }
    if ((h.old.referenceNo || "") !== (h.new.referenceNo || "")) {
      parts.push(`Ref ${h.old.referenceNo || "—"} → ${h.new.referenceNo || "—"}`);
    }
    if ((h.old.remark || "") !== (h.new.remark || "")) {
      parts.push(`Remark updated`);
    }
    return parts.length ? parts.join(" · ") : "Metadata refreshed";
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 pb-4">
      {/* FormContainer defaults to flex-1; without shrink-0 the listing table steals height and the entry form collapses to zero height. */}
      <div className="w-full shrink-0">
        <FormContainer
          entryRef={entryRef}
          className="!flex-none"
          contentOverflow="visible"
          title="Bank Transfer"
          description="Move funds from one bank account to another. Person accounts are not available here."
        >
        <FormGrid className="md:grid-cols-4">
          <div className="space-y-1.5">
            <FieldLabel>Date *</FieldLabel>
            <Input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              disabled={!canEditEntryDate}
              tabIndex={canEditEntryDate ? undefined : -1}
            />
          </div>
          <OperatedMoneyFields
            value={money}
            onChange={setMoney}
            amountLabel="Amount *"
            roundMode="decimal"
            minAmount={0.01}
            idPrefix="bank-transfer"
          />
          <div className="space-y-1.5">
            <FieldLabel>Reference No</FieldLabel>
            <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>From Bank *</FieldLabel>
            <AutocompleteField
              value={fromBankId}
              onChange={setFromBankId}
              loadOptions={loadBankOptions}
              placeholder="Search bank..."
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>To Bank *</FieldLabel>
            <AutocompleteField
              value={toBankId}
              onChange={setToBankId}
              loadOptions={loadBankOptions}
              placeholder="Search bank..."
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <FieldLabel>Remark</FieldLabel>
            <Input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Optional remark" />
          </div>
        </FormGrid>
        <FormActions>
          <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
            Reset
          </Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={saving}>
            {saving ? "Posting..." : "Post Transfer"}
          </Button>
        </FormActions>
        </FormContainer>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ListingPageContainer
        title="Recent bank transfers"
        description="Internal bank-to-bank movements only. Click a row for amendment activity."
        fullWidth
      >
        <PaginatedTableReference
          key={tableKey}
          columns={columns}
          fetcher={fetcher}
          filterParams={{}}
          showSearch={false}
          showPagination={false}
          height="420px"
          onTotalChange={setTotalCount}
          page={page}
          limit={limit}
          sortBy={sortBy || "createdAt"}
          sortOrder={sortOrder || "desc"}
          onPageChange={(zeroBased) => setPage(zeroBased + 1)}
          onRowsPerPageChange={setLimit}
          onSortChange={(field, order) => setSort(field, order)}
          compactDensity
          getRowKey={(row) => (row as BankTransferRow).id}
          selectedRowKey={selected?.id ?? null}
          onRowClick={(row) => setSelected(row as BankTransferRow)}
        />
        <PaginationControlsReference
          page={page - 1}
          rowsPerPage={limit}
          totalCount={totalCount}
          onPageChange={(zeroBased) => setPage(zeroBased + 1)}
          onRowsPerPageChange={setLimit}
        />
        </ListingPageContainer>
      </div>

      <DetailsSidebar
        open={Boolean(selected) && !amendOpen}
        title="Transfer details"
        subtitle={
          selected
            ? `${selected.fromBankName} → ${selected.toBankName}`
            : undefined
        }
        onClose={() => setSelected(null)}
        width="min(480px, 100vw)"
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-3">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Date</dt>
                  <dd className="text-right font-medium">{formatDateTimeForUser(selected.entryDate)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Amount</dt>
                  <dd className="text-right font-medium">
                    {formatScaledMoney(Number(selected.amount ?? 0), fmtCurrency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Reference</dt>
                  <dd className="max-w-[60%] text-right font-medium">{selected.referenceNo || "—"}</dd>
                </div>
                {selected.lastAmendedAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500">Last amended</dt>
                    <dd className="text-right text-xs">
                      {formatDateTimeForUser(selected.lastAmendedAt)}
                      {userLabel(selected.lastAmendedBy)
                        ? ` · ${userLabel(selected.lastAmendedBy)}`
                        : ""}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              startIcon={<IconPencil className="size-4" />}
              onClick={() => openAmendDialog(selected)}
            >
              Amend transfer
            </Button>

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
                        <th className="py-1 pr-2 font-medium">When / Who</th>
                        <th className="py-1 font-medium">Reason / Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.map((h, i) => (
                        <tr key={`${h.at}-${i}`} className="border-b border-gray-100 align-top">
                          <td className="py-2 pr-2 whitespace-nowrap text-gray-600">
                            <div>{formatDateTimeForUser(h.at)}</div>
                            <div className="text-[10px] text-gray-500">{userLabel(h.by) || "—"}</div>
                          </td>
                          <td className="py-2 text-gray-800">
                            <span className="line-clamp-3">{h.reason}</span>
                            <div className="mt-1 text-[10px] text-gray-500">{renderHistoryChange(h)}</div>
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

      <Dialog open={amendOpen} title="Amend bank transfer" onClose={() => !amendLoading && setAmendOpen(false)}>
        <p className="mb-3 text-sm text-gray-600">
          Changes to banks or amount update bank balances. All amendments are recorded in history and audit logs.
        </p>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
          <FormGrid>
            <div>
              <FieldLabel>Date *</FieldLabel>
              <Input
                type="date"
                className="h-9"
                value={amendEntryDate}
                onChange={(e) => setAmendEntryDate(e.target.value)}
                disabled={!canEditEntryDate}
                tabIndex={canEditEntryDate ? undefined : -1}
              />
            </div>
            <OperatedMoneyFields
              value={amendMoney}
              onChange={setAmendMoney}
              amountLabel="Amount *"
              roundMode="decimal"
              minAmount={0.01}
              idPrefix="bank-transfer-amend"
              compact
            />
            <FieldError message={amendErrors.amount} />
            <div>
              <FieldLabel>From Bank *</FieldLabel>
              <AutocompleteField
                value={amendFromBankId}
                onChange={setAmendFromBankId}
                loadOptions={loadBankOptions}
                placeholder="Search bank..."
                defaultOption={amendFromBankDefault}
              />
              <FieldError message={amendErrors.fromBankId} />
            </div>
            <div>
              <FieldLabel>To Bank *</FieldLabel>
              <AutocompleteField
                value={amendToBankId}
                onChange={setAmendToBankId}
                loadOptions={loadBankOptions}
                placeholder="Search bank..."
                defaultOption={amendToBankDefault}
              />
              <FieldError message={amendErrors.toBankId} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Reference No</FieldLabel>
              <Input
                className="h-9"
                value={amendReferenceNo}
                onChange={(e) => setAmendReferenceNo(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Remark</FieldLabel>
              <Input
                className="h-9"
                value={amendRemark}
                onChange={(e) => setAmendRemark(e.target.value)}
                placeholder="Optional remark"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Reason (required)</FieldLabel>
              <AutocompleteField
                value={amendReasonId}
                onChange={setAmendReasonId}
                loadOptions={loadAmendReasonOptions}
                placeholder="Select amendment reason…"
                defaultOption={amendReasonDefault}
              />
              <FieldError message={amendErrors.reason} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Amend note (optional)</FieldLabel>
              <Input
                className="h-9"
                value={amendExtraRemark}
                onChange={(e) => setAmendExtraRemark(e.target.value)}
                placeholder="Additional context…"
              />
            </div>
          </FormGrid>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setAmendOpen(false)} disabled={amendLoading}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={() => void submitAmend()} disabled={amendLoading}>
            {amendLoading ? "Saving…" : "Save amendment"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
