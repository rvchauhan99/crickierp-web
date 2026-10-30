"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import { FormContainer, FormActions } from "@/components/common/FormContainer";
import { FormGrid } from "@/components/common/FormGrid";
import { FieldLabel } from "@/components/common/FieldLabel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AutocompleteField, type AutocompleteOption } from "@/components/common/AutocompleteField";
import {
  OperatedMoneyFields,
  defaultOperatedMoneyValue,
  toMoneyFxPayload,
} from "@/components/common/OperatedMoneyFields";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import PaginatedTableReference, {
  type PaginatedTableReferenceColumn,
} from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { useListingQueryStateReference } from "@/hooks/useListingQueryStateReference";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { createBankTransfer, listBankTransfersNormalized, type BankTransferRow } from "@/services/bankService";
import { listBankLookupOptions } from "@/services/lookupService";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuth } from "@/context/AuthContext";
import { useOperatorEntryForm } from "@/hooks/useOperatorEntryForm";
import { canEditBusinessEntryDateTime } from "@/lib/roles";
import { todayYmdInUserTz } from "@/lib/userTimezone";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { formatScaledMoney } from "@/lib/formatMoney";

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

  const fetcher = useCallback(async (params: Record<string, unknown>) => listBankTransfersNormalized(params), []);

  const resetForm = useCallback(() => {
    setEntryDate(todayYmdInUserTz());
    setMoney(defaultOperatedMoneyValue(platformCurrency));
    setFromBankId("");
    setToBankId("");
    setReferenceNo("");
    setRemark("");
  }, [platformCurrency]);

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

  const columns = useMemo<PaginatedTableReferenceColumn[]>(
    () => [
      { field: "entryDate", label: "Date", ...tableColumnPresets.dateCol, sortable: true },
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
    ],
    [fmtCurrency],
  );

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
        description="Internal bank-to-bank movements only."
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
    </div>
  );
}
