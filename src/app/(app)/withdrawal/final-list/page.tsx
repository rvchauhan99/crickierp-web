"use client";
import { useEffect, useState } from "react";
import { financialService } from "@/services/financialService";
import { Button } from "@/components/ui/Button";
import { WithdrawalRow } from "@/types/financial";

export default function WithdrawalFinalListPage() {
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const load = () => financialService.listWithdrawals("final").then((res) => setRows(res?.data ?? []));
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Withdrawal / Final List</h1>
      <ul className="list-disc pl-6 text-sm">
        {rows.map((row) => (
          <li key={row._id} className="flex gap-2 items-center">
            <span>{row.playerName} - {row.amount} - {row.status}</span>
            {row.status === "approved" ? (
              <Button size="sm" onClick={() => financialService.updateWithdrawalStatus(row._id, "finalized").then(load)}>Finalize</Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
