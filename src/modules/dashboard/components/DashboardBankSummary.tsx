"use client";

import { IconBuildingBank } from "@tabler/icons-react";
import { type DashboardSummary } from "./DashboardKPIs";

interface Props {
  banksBreakdown: DashboardSummary["banksBreakdown"];
  loading?: boolean;
}

function formatAmount(value: number) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

function formatCount(value: number) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

export function DashboardBankSummary({ banksBreakdown, loading = false }: Props) {
  if (!banksBreakdown || banksBreakdown.length === 0) {
    if (!loading) return null;
    return (
      <div className="mt-8 space-y-3">
        <div className="h-6 w-52 bg-slate-200 rounded animate-pulse" />
        <div className="h-52 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <IconBuildingBank className="w-5 h-5 text-slate-700" />
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">Bank Wise Summary</h2>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Bank Details</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Opening Balance</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Entries</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Deposit</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Withdrawal</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Expenses</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Transfer Out</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Transfer In</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {banksBreakdown.map((bank) => (
                <tr key={bank.bankId} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-800">{bank.name}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-slate-700">
                    {formatAmount(bank.openingBalance)}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-slate-700">
                    {formatCount(bank.entries)}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-emerald-700">
                    {formatAmount(bank.deposit)}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-rose-700">
                    {formatAmount(bank.withdrawal)}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-amber-700">
                    {formatAmount(bank.expenses)}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-rose-700">
                    {formatAmount(bank.transferOut)}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-emerald-700">
                    {formatAmount(bank.transferIn)}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold text-slate-900">
                    {formatAmount(bank.closingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
