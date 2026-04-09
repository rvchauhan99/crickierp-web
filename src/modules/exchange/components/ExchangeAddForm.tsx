"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormContainer } from "@/components/common/FormContainer";
import { FormGrid } from "@/components/common/FormGrid";
import { FormActions } from "@/components/common/FormActions";
import { FieldLabel } from "@/components/common/FieldLabel";
import { FieldError } from "@/components/common/FieldError";
import { ExchangeCreateInput } from "@/types/exchange";
import { createExchange } from "@/services/exchangeService";

type FormState = ExchangeCreateInput;

const initialState: FormState = {
  name: "",
  openingBalance: 0,
  bonus: 0,
  provider: "",
  status: "active",
};

export function ExchangeAddForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; provider?: string }>({});

  async function onSubmit() {
    const nextErrors: { name?: string; provider?: string } = {};
    if (!form.name.trim()) nextErrors.name = "Exchange name is required.";
    if (!form.provider.trim()) nextErrors.provider = "Provider is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setMessage("");
    try {
      await createExchange(form);
      setMessage("Exchange saved successfully.");
      setForm(initialState);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <FormContainer
        title="Add Exchange"
        description="Create a new exchange entry with opening balance and status."
        actions={
          <FormActions>
            <Button onClick={onSubmit} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="secondary" onClick={() => setForm(initialState)} disabled={saving}>
              Cancel
            </Button>
          </FormActions>
        }
      >
        <FormGrid>
          <div>
            <FieldLabel>Exchange Name</FieldLabel>
            <Input
              placeholder="Exchange Name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <FieldError message={errors.name} />
          </div>
          <div>
            <FieldLabel>Opening Balance</FieldLabel>
            <Input
              type="number"
              placeholder="Opening Balance"
              value={form.openingBalance}
              onChange={(event) => setForm((prev) => ({ ...prev, openingBalance: Number(event.target.value) }))}
            />
          </div>
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
            />
            <FieldError message={errors.provider} />
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
      </FormContainer>
      {message ? <p className="text-sm text-brand-accent">{message}</p> : null}
    </div>
  );
}
