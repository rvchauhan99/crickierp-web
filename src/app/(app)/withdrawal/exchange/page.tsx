"use client";
import { useEffect, useState } from "react";
import { financialService } from "@/services/financialService";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { WithdrawalRow } from "@/types/financial";

export default function WithdrawalExchangePage() {
  const [playerName, setPlayerName] = useState("");
  const [bankName, setBankName] = useState("");
  const [amount, setAmount] = useState(0);
  const [rows, setRows] = useState<WithdrawalRow[]>([]);

  const load = () => financialService.listWithdrawals("exchange").then((res) => setRows(res?.data ?? []));
  useEffect(() => {
    load();
  }, []);
  const submit = async () => {
    await financialService.createWithdrawal({ playerName, bankName, amount, stage: "exchange" });
    load();
  };
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Withdrawal / Exchange</h1>
      <div className="grid grid-cols-3 gap-2">
        <Input placeholder="Player Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
        <Input placeholder="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
        <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      </div>
      <Button onClick={submit}>Save</Button>
      <ul className="list-disc pl-6 text-sm">
        {rows.map((row) => <li key={row._id}>{row.playerName} - {row.amount} - {row.status}</li>)}
      </ul>
    </div>
  );
}
