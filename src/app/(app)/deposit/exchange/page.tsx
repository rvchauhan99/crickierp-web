"use client";
import { useEffect, useState } from "react";
import { financialService } from "@/services/financialService";
import { Button } from "@/components/ui/Button";
import { DepositRow } from "@/types/financial";

export default function DepositExchangePage() {
  const [rows, setRows] = useState<DepositRow[]>([]);
  const load = () => financialService.listDeposits("exchange").then((res) => setRows(res?.data ?? []));
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Deposit / Exchange</h1>
      <ul className="list-disc pl-6 text-sm">
        {rows.map((row) => (
          <li key={row._id} className="flex gap-2 items-center">
            <span>{row.utr} - {row.amount} - {row.status}</span>
            {row.status === "pending" ? (
              <Button size="sm" onClick={() => financialService.updateDepositStatus(row._id, "verified").then(load)}>Verify</Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
