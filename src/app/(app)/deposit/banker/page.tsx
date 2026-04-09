"use client";
import { useEffect, useState } from "react";
import { financialService } from "@/services/financialService";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DepositRow } from "@/types/financial";

export default function DepositBankerPage() {
  const [bankName, setBankName] = useState("");
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState(0);
  const [rows, setRows] = useState<DepositRow[]>([]);

  const load = () => financialService.listDeposits("banker").then((res) => setRows(res?.data ?? []));
  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    await financialService.createDeposit({ bankName, utr, amount, stage: "banker" });
    setBankName("");
    setUtr("");
    setAmount(0);
    load();
  };

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Deposit / Banker</h1>
      <div className="grid grid-cols-3 gap-2">
        <Input placeholder="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
        <Input placeholder="UTR" value={utr} onChange={(e) => setUtr(e.target.value)} />
        <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      </div>
      <Button onClick={submit}>Save</Button>
      <ul className="list-disc pl-6 text-sm">
        {rows.map((row) => (
          <li key={row._id}>{row.utr} - {row.amount} - {row.status}</li>
        ))}
      </ul>
    </div>
  );
}
