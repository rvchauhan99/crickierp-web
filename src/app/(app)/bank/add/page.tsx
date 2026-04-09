"use client";
import { useState } from "react";
import { financialService } from "@/services/financialService";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage } from "@/lib/apiError";
import { BankPayload } from "@/services/financialService";

export default function BankAddPage() {
  const [form, setForm] = useState<BankPayload>({
    holderName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    openingBalance: 0,
    status: "active",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setMessage("");
    try {
      await financialService.createBank(form);
      setMessage("Bank account created.");
    } catch (error: unknown) {
      setMessage(getApiErrorMessage(error, "Failed to create bank account"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Bank / Add</h1>
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Holder Name" value={form.holderName} onChange={(e) => setForm((p) => ({ ...p, holderName: e.target.value }))} />
        <Input placeholder="Bank Name" value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} />
        <Input placeholder="Account Number" value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} />
        <Input placeholder="IFSC" value={form.ifsc} onChange={(e) => setForm((p) => ({ ...p, ifsc: e.target.value }))} />
        <Input type="number" placeholder="Opening Balance" value={form.openingBalance} onChange={(e) => setForm((p) => ({ ...p, openingBalance: Number(e.target.value) }))} />
      </div>
      <Button onClick={onSubmit} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
