"use client";

import { useEffect, useState } from "react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import { getLiabilityPersonWiseReport, getLiabilitySummaryReport } from "@/services/liabilityService";
import type { LiabilityPersonWiseReportRow, LiabilitySummaryReport } from "@/types/liability";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "sonner";

export function LiabilityReportClient() {
  const [summary, setSummary] = useState<LiabilitySummaryReport | null>(null);
  const [rows, setRows] = useState<LiabilityPersonWiseReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [s, r] = await Promise.all([getLiabilitySummaryReport(), getLiabilityPersonWiseReport()]);
        if (!cancelled) {
          setSummary(s);
          setRows(r);
        }
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, "Failed to load liability report"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ListingPageContainer
      title="Liability Report"
      description="Receivable/payable summary and person-wise balances."
      fullWidth
    >
      {loading ? (
        <div className="rounded-md border border-[var(--border)] p-6 text-sm text-slate-500">Loading report...</div>
      ) : (
        <div className="space-y-4">
          {summary && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-md border border-[var(--border)] bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Total Receivable</p>
                <p className="text-lg font-semibold">{summary.totalReceivable.toLocaleString()}</p>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Total Payable</p>
                <p className="text-lg font-semibold">{summary.totalPayable.toLocaleString()}</p>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Net Position</p>
                <p className="text-lg font-semibold">{summary.netPosition.toLocaleString()}</p>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Total Persons</p>
                <p className="text-lg font-semibold">{summary.totalPersons}</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-md border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-3 py-2">Person</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                  <th className="px-3 py-2">Side</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-center text-slate-500" colSpan={4}>
                      No rows available.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.personId} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.isActive ? "Active" : "Deactive"}</td>
                      <td className="px-3 py-2 text-right">{r.balance.toLocaleString()}</td>
                      <td className="px-3 py-2 capitalize">{r.side}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ListingPageContainer>
  );
}
