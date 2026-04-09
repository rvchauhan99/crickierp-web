"use client";
import { useEffect, useState } from "react";
import { financialService } from "@/services/financialService";
import { BankRow } from "@/types/financial";

export default function BankListPage() {
  const [rows, setRows] = useState<BankRow[]>([]);
  useEffect(() => {
    financialService.listBanks().then((res) => setRows(res?.data ?? []));
  }, []);
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Bank / List</h1>
      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">Holder</th>
              <th className="p-2 text-left">Bank</th>
              <th className="p-2 text-left">Account</th>
              <th className="p-2 text-left">IFSC</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id} className="border-t">
                <td className="p-2">{row.holderName}</td>
                <td className="p-2">{row.bankName}</td>
                <td className="p-2">{row.accountNumber}</td>
                <td className="p-2">{row.ifsc}</td>
                <td className="p-2">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
