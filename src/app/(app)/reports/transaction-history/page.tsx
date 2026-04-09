"use client";
import { useEffect, useState } from "react";
import { reportService } from "@/services/reportService";
import { AuditRow } from "@/types/financial";

export default function TransactionHistoryPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [search, setSearch] = useState("");

  const load = () => {
    reportService
      .transactionHistory({ search, page: 1, pageSize: 50 })
      .then((res) => setRows(res?.data ?? []))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    reportService
      .transactionHistory({ search: "", page: 1, pageSize: 50 })
      .then((res) => setRows(res?.data ?? []))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Reports / Transaction History</h1>
      <div className="flex gap-2">
        <input
          className="h-9 px-3 border rounded-md text-sm"
          placeholder="Search action/entity/requestId"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="h-9 px-3 border rounded-md text-sm" onClick={load}>Search</button>
      </div>
      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">Action</th>
              <th className="p-2 text-left">Entity</th>
              <th className="p-2 text-left">Entity ID</th>
              <th className="p-2 text-left">Request ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id} className="border-t">
                <td className="p-2">{row.action}</td>
                <td className="p-2">{row.entity}</td>
                <td className="p-2">{row.entityId}</td>
                <td className="p-2">{row.requestId || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
