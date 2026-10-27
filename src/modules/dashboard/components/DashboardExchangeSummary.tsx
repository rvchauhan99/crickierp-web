"use client";

import React, { useMemo, useState } from "react";
import { IconBuildingStore, IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { type DashboardSummary } from "./DashboardKPIs";
import { useFormatMoney } from "@/hooks/useFormatMoney";

type ExchangeRow = NonNullable<DashboardSummary["exchangesBreakdown"]>[number];
type SubRow = NonNullable<ExchangeRow["subExchanges"]>[number];

interface Props {
  exchangesBreakdown: DashboardSummary["exchangesBreakdown"];
  loading?: boolean;
  /** When true, strip title uses “Full Day”; otherwise “Period”. */
  isToday?: boolean;
}

function formatCount(value: number) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

function rowGrossPL(row: { depositVerified: number; withdrawalApproved: number; netBonus: number; grossPL?: number }) {
  if (typeof row.grossPL === "number" && Number.isFinite(row.grossPL)) return row.grossPL;
  return Number(row.depositVerified ?? 0) - Number(row.withdrawalApproved ?? 0) + Number(row.netBonus ?? 0);
}

function StripCard({
  label,
  amount,
  count,
  tone,
}: {
  label: string;
  amount: string;
  count?: string;
  tone: "in" | "out" | "bonus" | "pl";
}) {
  const toneClass =
    tone === "in"
      ? "bg-emerald-600 text-white"
      : tone === "out"
        ? "bg-rose-600 text-white"
        : tone === "bonus"
          ? "bg-sky-600 text-white"
          : "bg-violet-700 text-white";

  return (
    <div className={cn("relative min-h-[72px] rounded-lg px-3 py-2.5 shadow-sm", toneClass)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums leading-tight sm:text-xl">{amount}</p>
      {count != null ? (
        <p className="absolute bottom-2 right-3 text-xs font-semibold tabular-nums opacity-90">{count}</p>
      ) : null}
    </div>
  );
}

export function DashboardExchangeSummary({
  exchangesBreakdown,
  loading = false,
  isToday = false,
}: Props) {
  const { formatMoney } = useFormatMoney();
  const fmt = (value: number) => formatMoney(value, { includeSign: true });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const rows = exchangesBreakdown ?? [];

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, ex) => ({
        inAmount: acc.inAmount + Number(ex.depositVerified ?? 0),
        inCount: acc.inCount + Number(ex.depositVerifiedCount ?? 0),
        outAmount: acc.outAmount + Number(ex.withdrawalApproved ?? 0),
        outCount: acc.outCount + Number(ex.withdrawalApprovedCount ?? 0),
        bonus: acc.bonus + Number(ex.netBonus ?? 0),
        grossPL: acc.grossPL + rowGrossPL(ex),
      }),
      { inAmount: 0, inCount: 0, outAmount: 0, outCount: 0, bonus: 0, grossPL: 0 },
    );
  }, [rows]);

  if (!rows.length) {
    if (!loading) return null;
    return (
      <div className="mt-8 space-y-4">
        <div className="h-6 w-56 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const stripTitle = isToday ? "Exchange Full Day Summary" : "Exchange Period Summary";

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <IconBuildingStore className="w-5 h-5 text-slate-700" />
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">{stripTitle}</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StripCard
          label="IN"
          amount={fmt(totals.inAmount)}
          count={formatCount(totals.inCount)}
          tone="in"
        />
        <StripCard
          label="OUT"
          amount={fmt(-Math.abs(totals.outAmount))}
          count={formatCount(totals.outCount)}
          tone="out"
        />
        <StripCard label="Bonus" amount={fmt(totals.bonus)} tone="bonus" />
        <StripCard label="Gross Profit & Loss" amount={fmt(totals.grossPL)} tone="pl" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Exchange</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap bg-emerald-50/80">
                  <span className="block">In</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap bg-emerald-50/80">
                  <span className="block">In</span>
                  <span className="block text-[10px] font-normal text-slate-500">#</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap bg-rose-50/80">
                  <span className="block">Out</span>
                  <span className="block text-[10px] font-normal text-slate-500">Amount</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap bg-rose-50/80">
                  <span className="block">Out</span>
                  <span className="block text-[10px] font-normal text-slate-500">#</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap bg-sky-50/80">Bonus</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap bg-violet-50/80">Sub Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ex) => {
                const open = Boolean(expanded[ex.exchangeId]);
                const canExpand = Boolean(ex.hasSubExchanges && (ex.subExchanges?.length ?? 0) > 0);
                const gross = rowGrossPL(ex);
                return (
                  <React.Fragment key={ex.exchangeId}>
                    <tr className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-800">
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1 text-left",
                            canExpand ? "cursor-pointer" : "cursor-default",
                          )}
                          onClick={() => {
                            if (!canExpand) return;
                            setExpanded((prev) => ({ ...prev, [ex.exchangeId]: !prev[ex.exchangeId] }));
                          }}
                          disabled={!canExpand}
                        >
                          {canExpand ? (
                            open ? (
                              <IconChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            ) : (
                              <IconChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )
                          ) : (
                            <span className="w-3.5 shrink-0" />
                          )}
                          <span>{ex.name}</span>
                          {canExpand ? (
                            <span className="text-[10px] font-normal text-slate-500">
                              ({ex.subExchanges?.length ?? 0} sub)
                            </span>
                          ) : null}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-emerald-700">
                        {fmt(ex.depositVerified)}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-slate-600">
                        {formatCount(ex.depositVerifiedCount ?? 0)}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-rose-700">
                        {fmt(-Math.abs(ex.withdrawalApproved))}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-slate-600">
                        {formatCount(ex.withdrawalApprovedCount ?? 0)}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-sky-800">
                        {fmt(ex.netBonus)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right whitespace-nowrap tabular-nums font-semibold",
                          gross >= 0 ? "text-emerald-700" : "text-rose-700",
                        )}
                      >
                        {fmt(gross)}
                      </td>
                    </tr>
                    {canExpand && open
                      ? (ex.subExchanges as SubRow[]).map((sub) => {
                          const subGross = rowGrossPL(sub);
                          return (
                            <tr
                              key={`${ex.exchangeId}-${sub.exchangeId}`}
                              className="border-t border-slate-50 bg-slate-50/70"
                            >
                              <td className="px-3 py-2 pl-9 whitespace-nowrap text-slate-700">
                                {sub.name}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums text-emerald-700">
                                {fmt(sub.depositVerified)}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums text-slate-600">
                                {formatCount(sub.depositVerifiedCount ?? 0)}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums text-rose-700">
                                {fmt(-Math.abs(sub.withdrawalApproved))}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums text-slate-600">
                                {formatCount(sub.withdrawalApprovedCount ?? 0)}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums text-sky-800">
                                {fmt(sub.netBonus)}
                              </td>
                              <td
                                className={cn(
                                  "px-3 py-2 text-right whitespace-nowrap tabular-nums font-medium",
                                  subGross >= 0 ? "text-emerald-700" : "text-rose-700",
                                )}
                              >
                                {fmt(subGross)}
                              </td>
                            </tr>
                          );
                        })
                      : null}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot className="bg-emerald-50/60 border-t-2 border-slate-200">
              <tr>
                <td className="px-3 py-2.5 whitespace-nowrap font-bold text-slate-900">Sub Total</td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold tabular-nums text-emerald-800">
                  {fmt(totals.inAmount)}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold tabular-nums text-slate-800">
                  {formatCount(totals.inCount)}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold tabular-nums text-rose-800">
                  {fmt(-Math.abs(totals.outAmount))}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold tabular-nums text-slate-800">
                  {formatCount(totals.outCount)}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold tabular-nums text-sky-900">
                  {fmt(totals.bonus)}
                </td>
                <td
                  className={cn(
                    "px-3 py-2.5 text-right whitespace-nowrap font-bold tabular-nums",
                    totals.grossPL >= 0 ? "text-emerald-800" : "text-rose-800",
                  )}
                >
                  {fmt(totals.grossPL)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
