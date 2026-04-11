"use client";
import { useEffect, useState } from "react";
import { financialService } from "@/services/financialService";
import type { BankRow } from "@/types/bank";

export default function BankStatementPage() {
  const [rows, setRows] = useState<BankRow[]>([]);
  useEffect(() => {
    financialService.listBanks().then((res) => setRows((res?.data ?? []) as BankRow[]));
  }, []);
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Bank / Statement</h1>
      <p className="text-sm text-slate-600">Operational statement view (latest bank rows).</p>
      <ul className="list-disc pl-6 text-sm">
        {rows.map((row) => (
          <li key={row._id}>{row.bankName} - {row.accountNumber} - {row.openingBalance}</li>
        ))}
      </ul>
    </div>
  );
}
