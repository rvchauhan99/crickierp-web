"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { IconBuildingBank, IconGripVertical } from "@tabler/icons-react";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import {
  applyBankSummaryRowOrder,
  clearBankSummaryRowOrder,
  loadBankSummaryRowOrder,
  saveBankSummaryRowOrder,
} from "@/lib/bankSummaryRowOrder";
import { type DashboardSummary } from "./DashboardKPIs";
import { cn } from "@/lib/cn";

export type BankBreakdownRow = NonNullable<DashboardSummary["banksBreakdown"]>[number];

interface Props {
  banksBreakdown: DashboardSummary["banksBreakdown"];
  loading?: boolean;
  /** When set, bank name and metric cells link into Statement with filters. */
  getStatementHref?: (bankId: string, entryType?: string) => string;
  /** Standalone page: show empty state instead of returning null. */
  showEmptyState?: boolean;
  title?: string;
}

function formatCount(value: number) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

function AmountWithTxnCount({
  amount,
  count,
  amountClass,
  formatMoney,
}: {
  amount: number;
  count: number;
  amountClass: string;
  formatMoney: (value: number) => string;
}) {
  return (
    <div className={cn("inline-flex items-baseline justify-end gap-1 whitespace-nowrap tabular-nums", amountClass)}>
      <span>{formatMoney(amount)}</span>
      <span className="font-semibold text-slate-700">({formatCount(count)})</span>
    </div>
  );
}

function CellLink({
  href,
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return <div className={className}>{children}</div>;
  }
  return (
    <Link
      href={href}
      className={cn(
        className,
        "block rounded-md transition-colors hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40",
      )}
    >
      {children}
    </Link>
  );
}

function reorderByIndex<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function DashboardBankSummary({
  banksBreakdown,
  loading = false,
  getStatementHref,
  showEmptyState = false,
  title = "Bank Wise Summary",
}: Props) {
  const { formatMoney } = useFormatMoney();
  const fmt = (value: number) => formatMoney(value, { includeSign: true });

  const [orderedRows, setOrderedRows] = useState<BankBreakdownRow[]>([]);
  const [hasCustomOrder, setHasCustomOrder] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  useEffect(() => {
    const rows = Array.isArray(banksBreakdown) ? banksBreakdown : [];
    if (!rows.length) {
      setOrderedRows([]);
      setHasCustomOrder(false);
      return;
    }
    const saved = loadBankSummaryRowOrder();
    setHasCustomOrder(saved.length > 0);
    setOrderedRows(applyBankSummaryRowOrder(rows, saved));
  }, [banksBreakdown]);

  const handleResetOrder = useCallback(() => {
    clearBankSummaryRowOrder();
    setHasCustomOrder(false);
    setOrderedRows(Array.isArray(banksBreakdown) ? [...banksBreakdown] : []);
  }, [banksBreakdown]);

  const onDragStart = useCallback((bankId: string, e: React.DragEvent) => {
    dragIdRef.current = bankId;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", bankId);
  }, []);

  const onDragOverRow = useCallback((bankId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(bankId);
  }, []);

  const onDropRow = useCallback(
    (targetId: string, e: React.DragEvent) => {
      e.preventDefault();
      const sourceId = dragIdRef.current || e.dataTransfer.getData("text/plain");
      dragIdRef.current = null;
      setDragOverId(null);
      if (!sourceId || sourceId === targetId) return;
      setOrderedRows((prev) => {
        const from = prev.findIndex((r) => r.bankId === sourceId);
        const to = prev.findIndex((r) => r.bankId === targetId);
        if (from < 0 || to < 0) return prev;
        const next = reorderByIndex(prev, from, to);
        saveBankSummaryRowOrder(next.map((r) => r.bankId));
        setHasCustomOrder(true);
        return next;
      });
    },
    [],
  );

  const onDragEnd = useCallback(() => {
    dragIdRef.current = null;
    setDragOverId(null);
  }, []);

  const totals = useMemo(
    () =>
      orderedRows.reduce(
        (acc, bank) => ({
          openingBalance: acc.openingBalance + Number(bank.openingBalance ?? 0),
          deposit: acc.deposit + Number(bank.deposit ?? 0),
          depositCount: acc.depositCount + Number(bank.depositCount ?? 0),
          withdrawal: acc.withdrawal + Number(bank.withdrawal ?? 0),
          withdrawalCount: acc.withdrawalCount + Number(bank.withdrawalCount ?? 0),
          expenses: acc.expenses + Number(bank.expenses ?? 0),
          expenseCount: acc.expenseCount + Number(bank.expenseCount ?? 0),
          transferOut: acc.transferOut + Number(bank.transferOut ?? 0),
          transferOutCount: acc.transferOutCount + Number(bank.transferOutCount ?? 0),
          transferIn: acc.transferIn + Number(bank.transferIn ?? 0),
          transferInCount: acc.transferInCount + Number(bank.transferInCount ?? 0),
          entries: acc.entries + Number(bank.entries ?? 0),
          closingBalance: acc.closingBalance + Number(bank.closingBalance ?? 0),
        }),
        {
          openingBalance: 0,
          deposit: 0,
          depositCount: 0,
          withdrawal: 0,
          withdrawalCount: 0,
          expenses: 0,
          expenseCount: 0,
          transferOut: 0,
          transferOutCount: 0,
          transferIn: 0,
          transferInCount: 0,
          entries: 0,
          closingBalance: 0,
        },
      ),
    [orderedRows],
  );

  if (!banksBreakdown || banksBreakdown.length === 0) {
    if (loading) {
      return (
        <div className="mt-4 space-y-3">
          <div className="h-6 w-52 bg-slate-200 rounded animate-pulse" />
          <div className="h-52 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      );
    }
    if (showEmptyState) {
      return (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          No bank activity for the selected filters.
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <IconBuildingBank className="w-5 h-5 text-slate-700" />
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>
        <span className="text-[11px] text-slate-400">Drag rows to set display order</span>
        {hasCustomOrder ? (
          <button
            type="button"
            onClick={handleResetOrder}
            className="ml-auto text-[11px] font-medium text-slate-500 hover:text-[var(--brand-primary)] underline-offset-2 hover:underline"
          >
            Reset order
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="w-8 px-1 py-2" aria-label="Reorder" />
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap align-bottom">Bank Details</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">Opening Balance</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">
                  <span className="block">Deposit</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount (count)</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">
                  <span className="block">Withdrawal</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount (count)</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">
                  <span className="block">Expenses</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount (count)</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">
                  <span className="block">Transfer Out</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount (count)</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">
                  <span className="block">Transfer In</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount (count)</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">Total txn</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap align-bottom">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {orderedRows.map((bank) => {
                const hrefAll = getStatementHref?.(bank.bankId);
                const hrefDeposit = getStatementHref?.(bank.bankId, "deposit");
                const hrefWithdrawal = getStatementHref?.(bank.bankId, "withdrawal");
                const hrefExpense = getStatementHref?.(bank.bankId, "expense");
                const hrefTransfer = getStatementHref?.(bank.bankId, "transfer");
                const isDropTarget = dragOverId === bank.bankId;
                return (
                  <tr
                    key={bank.bankId}
                    onDragOver={(e) => onDragOverRow(bank.bankId, e)}
                    onDrop={(e) => onDropRow(bank.bankId, e)}
                    onDragEnd={onDragEnd}
                    className={cn(
                      "border-t border-slate-100 hover:bg-slate-50/60",
                      isDropTarget && "bg-[var(--brand-primary)]/5 ring-1 ring-inset ring-[var(--brand-primary)]/30",
                    )}
                  >
                    <td className="px-1 py-2.5 align-middle">
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => onDragStart(bank.bankId, e)}
                        aria-label={`Reorder ${bank.name}`}
                        title="Drag to reorder"
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-grab active:cursor-grabbing"
                      >
                        <IconGripVertical className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-800">
                      <CellLink href={hrefAll} className="px-1 py-0.5 text-[var(--brand-primary)] hover:underline">
                        {bank.name}
                      </CellLink>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-slate-700">
                      <CellLink href={hrefAll} className="px-1 py-0.5">
                        {fmt(bank.openingBalance)}
                      </CellLink>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <CellLink href={hrefDeposit} className="px-1 py-0.5">
                        <AmountWithTxnCount
                          amount={bank.deposit}
                          count={bank.depositCount}
                          amountClass="text-emerald-700"
                          formatMoney={fmt}
                        />
                      </CellLink>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <CellLink href={hrefWithdrawal} className="px-1 py-0.5">
                        <AmountWithTxnCount
                          amount={bank.withdrawal}
                          count={bank.withdrawalCount}
                          amountClass="text-rose-700"
                          formatMoney={fmt}
                        />
                      </CellLink>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <CellLink href={hrefExpense} className="px-1 py-0.5">
                        <AmountWithTxnCount
                          amount={bank.expenses}
                          count={bank.expenseCount}
                          amountClass="text-amber-700"
                          formatMoney={fmt}
                        />
                      </CellLink>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <CellLink href={hrefTransfer} className="px-1 py-0.5">
                        <AmountWithTxnCount
                          amount={bank.transferOut}
                          count={bank.transferOutCount}
                          amountClass="text-rose-700"
                          formatMoney={fmt}
                        />
                      </CellLink>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <CellLink href={hrefTransfer} className="px-1 py-0.5">
                        <AmountWithTxnCount
                          amount={bank.transferIn}
                          count={bank.transferInCount}
                          amountClass="text-emerald-700"
                          formatMoney={fmt}
                        />
                      </CellLink>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap text-slate-700">
                      <CellLink href={hrefAll} className="px-1 py-0.5">
                        {formatCount(bank.entries)}
                      </CellLink>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold text-slate-900">
                      <CellLink href={hrefAll} className="px-1 py-0.5">
                        {fmt(bank.closingBalance)}
                      </CellLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td className="px-1 py-2.5" />
                <td className="px-3 py-2.5 whitespace-nowrap font-bold text-slate-900">TOTAL</td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold text-slate-900">
                  {fmt(totals.openingBalance)}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <AmountWithTxnCount
                    amount={totals.deposit}
                    count={totals.depositCount}
                    amountClass="font-semibold text-emerald-700"
                    formatMoney={fmt}
                  />
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <AmountWithTxnCount
                    amount={totals.withdrawal}
                    count={totals.withdrawalCount}
                    amountClass="font-semibold text-rose-700"
                    formatMoney={fmt}
                  />
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <AmountWithTxnCount
                    amount={totals.expenses}
                    count={totals.expenseCount}
                    amountClass="font-semibold text-amber-700"
                    formatMoney={fmt}
                  />
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <AmountWithTxnCount
                    amount={totals.transferOut}
                    count={totals.transferOutCount}
                    amountClass="font-semibold text-rose-700"
                    formatMoney={fmt}
                  />
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <AmountWithTxnCount
                    amount={totals.transferIn}
                    count={totals.transferInCount}
                    amountClass="font-semibold text-emerald-700"
                    formatMoney={fmt}
                  />
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold text-slate-900">
                  {formatCount(totals.entries)}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap font-bold text-slate-900">
                  {fmt(totals.closingBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
