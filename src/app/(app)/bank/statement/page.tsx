"use client";

import { useCallback, useState } from "react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import { AutocompleteField, type AutocompleteOption } from "@/components/common/AutocompleteField";
import { FieldLabel } from "@/components/common/FieldLabel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getBankLedger, listBanksNormalized } from "@/services/bankService";
import { getApiErrorMessage } from "@/lib/apiError";

export default function BankStatementPage() {
  const [bankId, setBankId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [ledger, setLedger] = useState<Awaited<ReturnType<typeof getBankLedger>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBankOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const res = await listBanksNormalized({
        page: 1,
        limit: 40,
        q: query || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      return res.data.map((b) => ({
        value: b.id,
        label: `${b.holderName} - ${b.bankName} (${String(b.accountNumber).slice(-4)})`,
      }));
    } catch {
      return [];
    }
  }, []);

  const loadLedger = async () => {
    if (!bankId.trim()) {
      setError("Select a bank account.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getBankLedger(bankId.trim(), {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setLedger(data);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to load statement"));
      setLedger(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ListingPageContainer
      title="Bank / Statement"
      description="Deposits (credits) and approved expenses (debits) for the selected account."
      fullWidth
    >
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="min-w-[280px] flex-1 space-y-1">
          <FieldLabel>Bank account</FieldLabel>
          <AutocompleteField
            value={bankId}
            onChange={(v) => {
              setBankId(v);
              setLedger(null);
            }}
            loadOptions={loadBankOptions}
            placeholder="Search bank…"
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>From</FieldLabel>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[160px]" />
        </div>
        <div className="space-y-1">
          <FieldLabel>To</FieldLabel>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[160px]" />
        </div>
        <Button type="button" variant="primary" onClick={() => void loadLedger()} disabled={loading}>
          {loading ? "Loading…" : "Apply range"}
        </Button>
      </div>

      {error ? <p className="text-sm text-[var(--danger)] mb-2">{error}</p> : null}

      {ledger ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs text-[var(--text-secondary)]">Opening (period)</p>
              <p className="text-xl font-semibold">{ledger.periodOpeningBalance.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-[var(--text-secondary)]">Current balance</p>
              <p className="text-xl font-semibold">{ledger.bank.currentBalance.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-[var(--text-secondary)]">Account</p>
              <p className="text-sm font-medium">
                {ledger.bank.holderName} · {ledger.bank.bankName}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">{ledger.bank.accountNumber}</p>
            </Card>
          </div>

          <div className="overflow-x-auto rounded-md border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border)]">
                  <th className="text-left p-2">When</th>
                  <th className="text-left p-2">Kind</th>
                  <th className="text-left p-2">Details</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-center p-2">Dir</th>
                  <th className="text-right p-2">Balance after</th>
                </tr>
              </thead>
              <tbody>
                {ledger.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-[var(--text-secondary)]">
                      No movements in this range.
                    </td>
                  </tr>
                ) : (
                  ledger.rows.map((r) => (
                    <tr key={`${r.kind}-${r.refId}`} className="border-b border-[var(--border)]/60">
                      <td className="p-2 whitespace-nowrap">{new Date(r.at).toLocaleString()}</td>
                      <td className="p-2 capitalize">{r.kind}</td>
                      <td className="p-2 max-w-[280px] truncate">{r.label}</td>
                      <td className="p-2 text-right">{r.amount.toLocaleString()}</td>
                      <td className="p-2 text-center">{r.direction}</td>
                      <td className="p-2 text-right">{r.balanceAfter.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">Select a bank to load the ledger.</p>
      )}
    </ListingPageContainer>
  );
}
