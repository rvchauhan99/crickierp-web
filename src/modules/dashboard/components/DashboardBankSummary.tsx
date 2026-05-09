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

function AmountWithTxnCount({
  amount,
  count,
  amountClass,
}: {
  amount: number;
  count: number;
  amountClass: string;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5 leading-tight">
      <span className={amountClass}>{formatAmount(amount)}</span>
      <span className="text-[10px] font-medium tabular-nums text-slate-500">{formatCount(count)} txn</span>
    </div>
  );
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
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap align-bottom">Bank Details</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">Opening Balance</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">
                  <span className="block">Deposit</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount / # txn</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">
                  <span className="block">Withdrawal</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount / # txn</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">
                  <span className="block">Expenses</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount / # txn</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">
                  <span className="block">Transfer Out</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount / # txn</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">
                  <span className="block">Transfer In</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount / # txn</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">Total txn</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {banksBreakdown.map((bank) => (
                <tr key={bank.bankId} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-800">{bank.name}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-slate-700">
                    {formatAmount(bank.openingBalance)}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <AmountWithTxnCount
                      amount={bank.deposit}
                      count={bank.depositCount}
                      amountClass="text-emerald-700"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <AmountWithTxnCount
                      amount={bank.withdrawal}
                      count={bank.withdrawalCount}
                      amountClass="text-rose-700"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <AmountWithTxnCount
                      amount={bank.expenses}
                      count={bank.expenseCount}
                      amountClass="text-amber-700"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <AmountWithTxnCount
                      amount={bank.transferOut}
                      count={bank.transferOutCount}
                      amountClass="text-rose-700"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <AmountWithTxnCount
                      amount={bank.transferIn}
                      count={bank.transferInCount}
                      amountClass="text-emerald-700"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap text-slate-700">
                    {formatCount(bank.entries)}
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
