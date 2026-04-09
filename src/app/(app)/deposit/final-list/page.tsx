"use client";
import { useEffect, useState } from "react";
import { financialService } from "@/services/financialService";
import { Button } from "@/components/ui/Button";
import { DepositRow } from "@/types/financial";

export default function DepositFinalListPage() {
  const [rows, setRows] = useState<DepositRow[]>([]);
  const load = () => financialService.listDeposits("final").then((res) => setRows(res?.data ?? []));
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Deposit / Final List</h1>
      <ul className="list-disc pl-6 text-sm">
        {rows.map((row) => (
          <li key={row._id} className="flex gap-2 items-center">
            <span>{row.utr} - {row.amount} - {row.status}</span>
            {row.status === "verified" ? (
              <Button size="sm" onClick={() => financialService.updateDepositStatus(row._id, "finalized").then(load)}>Finalize</Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
