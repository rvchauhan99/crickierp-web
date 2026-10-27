"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AutocompleteField, type AutocompleteOption } from "@/components/common/AutocompleteField";
import { FormActions, FormContainer } from "@/components/common/FormContainer";
import { FormGrid } from "@/components/common/FormGrid";
import { FieldLabel } from "@/components/common/FieldLabel";
import { FieldError } from "@/components/common/FieldError";
import {
  OperatedMoneyFields,
  defaultOperatedMoneyValue,
  toMoneyFxPayload,
} from "@/components/common/OperatedMoneyFields";
import { usePlatformSettings } from "@/context/PlatformSettingsContext";
import { useOperatorEntryForm } from "@/hooks/useOperatorEntryForm";
import { ExchangeCreateInput } from "@/types/exchange";
import { createExchange } from "@/services/exchangeService";
import { listExchangeLookupOptions } from "@/services/lookupService";

type FormState = ExchangeCreateInput;

const initialState: FormState = {
  name: "",
  openingBalance: 0,
  bonus: 0,
  provider: "",
  status: "active",
  parentExchangeId: null,
};

export function ExchangeAddForm() {
  const { platformCurrency } = usePlatformSettings();
  const { formRef: entryRef, afterSuccessfulSave } = useOperatorEntryForm();
  const [form, setForm] = useState<FormState>(initialState);
  const [parentExchangeId, setParentExchangeId] = useState("");
  const [parentProvider, setParentProvider] = useState("");
  const [parentProviderById, setParentProviderById] = useState<Record<string, string>>({});
  const [openingMoney, setOpeningMoney] = useState(() => defaultOperatedMoneyValue(platformCurrency));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; provider?: string; openingBalance?: string }>({});

  useEffect(() => {
    if (!platformCurrency) return;
    setOpeningMoney((prev) =>
      prev.operatedCurrency ? prev : { ...prev, operatedCurrency: platformCurrency },
    );
  }, [platformCurrency]);

  const loadParentOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const rows = await listExchangeLookupOptions({ q: query || undefined, limit: 25 });
      const topLevel = rows.filter((ex) => !ex.isSubExchange);
      setParentProviderById((prev) => {
        const next = { ...prev };
        for (const ex of topLevel) next[ex.id] = ex.provider;
        return next;
      });
      return topLevel.map((ex) => ({
        value: ex.id,
        label: `${ex.name} (${ex.provider})`,
      }));
    } catch {
      return [];
    }
  }, []);

  async function onSubmit() {
    if (!platformCurrency) {
      toast.error("Set platform currency in Profile first");
      return;
    }
    const isSub = Boolean(parentExchangeId);
    const nextErrors: { name?: string; provider?: string; openingBalance?: string } = {};
    if (!form.name.trim()) nextErrors.name = "Exchange name is required.";
    if (!isSub && !form.provider?.trim()) nextErrors.provider = "Provider is required.";
    const operatedAmt = openingMoney.amount.trim() === "" ? 0 : Number(openingMoney.amount);
    if (Number.isNaN(operatedAmt) || operatedAmt < 0) {
      nextErrors.openingBalance = "Opening balance must be at least 0.";
    } else if ((openingMoney.operatedCurrency || platformCurrency) !== platformCurrency) {
      const rate = Number(openingMoney.exchangeRate);
      if (!openingMoney.exchangeRate.trim() || !Number.isFinite(rate) || rate <= 0) {
        nextErrors.openingBalance = "Enter a valid exchange rate.";
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const fx = toMoneyFxPayload(
      { ...openingMoney, amount: openingMoney.amount.trim() === "" ? "0" : openingMoney.amount },
      platformCurrency,
      "decimal",
    );

    setSaving(true);
    setMessage("");
    try {
      await createExchange({
        ...form,
        provider: isSub ? parentProvider || form.provider : form.provider,
        parentExchangeId: isSub ? parentExchangeId : null,
        openingBalance: fx.amount,
        openingOperatedCurrency: fx.operatedCurrency,
        openingOperatedAmount: fx.operatedAmount,
        openingExchangeRate: fx.exchangeRate,
      });
      setMessage(isSub ? "Sub exchange saved successfully." : "Exchange saved successfully.");
      setForm(initialState);
      setParentExchangeId("");
      setParentProvider("");
      setOpeningMoney(defaultOperatedMoneyValue(platformCurrency));
      afterSuccessfulSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <FormContainer
        entryRef={entryRef}
        title="Add Exchange"
        description="Create a top-level exchange, or optionally a sub exchange under an existing parent."
      >
        <FormGrid>
          <div>
            <FieldLabel>Parent Exchange (optional)</FieldLabel>
            <AutocompleteField
              value={parentExchangeId}
              onChange={(value) => {
                setParentExchangeId(value);
                const provider = parentProviderById[value] ?? "";
                setParentProvider(provider);
                if (provider) {
                  setForm((prev) => ({ ...prev, provider }));
                }
              }}
              loadOptions={loadParentOptions}
              placeholder="Leave empty for top-level exchange..."
            />
          </div>
          <div>
            <FieldLabel>{parentExchangeId ? "Sub Exchange Name" : "Exchange Name"}</FieldLabel>
            <Input
              placeholder={parentExchangeId ? "Sub Exchange Name" : "Exchange Name"}
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <FieldError message={errors.name} />
          </div>
          <OperatedMoneyFields
            value={openingMoney}
            onChange={setOpeningMoney}
            amountLabel="Opening Balance"
            roundMode="decimal"
            minAmount={0}
            idPrefix="exchange-opening"
          />
          {errors.openingBalance ? (
            <div className="col-span-full">
              <FieldError message={errors.openingBalance} />
            </div>
          ) : null}
          <div>
            <FieldLabel>Bonus</FieldLabel>
            <Input
              type="number"
              placeholder="Bonus"
              value={form.bonus}
              onChange={(event) => setForm((prev) => ({ ...prev, bonus: Number(event.target.value) }))}
            />
          </div>
          <div>
            <FieldLabel>Exchange Provider</FieldLabel>
            <Input
              placeholder="Exchange Provider"
              value={form.provider}
              onChange={(event) => setForm((prev) => ({ ...prev, provider: event.target.value }))}
              disabled={Boolean(parentExchangeId)}
            />
            <FieldError message={errors.provider} />
            {parentExchangeId ? (
              <p className="mt-1 text-xs text-slate-500">Provider is inherited from the parent exchange.</p>
            ) : null}
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <Select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value as FormState["status"] }))
              }
            >
              <option value="active">Active</option>
              <option value="deactive">Deactive</option>
            </Select>
          </div>
        </FormGrid>
        <FormActions>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setForm(initialState);
              setParentExchangeId("");
              setParentProvider("");
              setOpeningMoney(defaultOperatedMoneyValue(platformCurrency));
              setErrors({});
            }}
            disabled={saving}
          >
            Cancel
          </Button>
        </FormActions>
      </FormContainer>
      {message ? <p className="text-sm text-brand-accent">{message}</p> : null}
    </div>
  );
}
