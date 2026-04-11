"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { IconCurrencyRupee, IconHash, IconCategory, IconChartPie } from "@tabler/icons-react";

interface ExpenseKpiStripProps {
  summary: {
    grandTotal: number;
    totalCount: number;
    byExpenseType: Array<{
      expenseTypeId: string;
      name: string;
      totalAmount: number;
      count: number;
    }>;
  };
}

export function ExpenseKpiStrip({ summary }: ExpenseKpiStripProps) {
  const topCategory = [...summary.byExpenseType].sort((a, b) => b.totalAmount - a.totalAmount)[0];
  const avgAmount = summary.totalCount > 0 ? summary.grandTotal / summary.totalCount : 0;

  const kpis = [
    {
      label: "Grand Total",
      value: `₹${summary.grandTotal.toLocaleString("en-IN")}`,
      sub: "Total disbursement",
      icon: IconCurrencyRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Entries",
      value: summary.totalCount.toLocaleString(),
      sub: "Processed records",
      icon: IconHash,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Average Expense",
      value: `₹${avgAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      sub: "Per record average",
      icon: IconChartPie,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Top Category",
      value: topCategory?.name || "None",
      sub: topCategory ? `₹${topCategory.totalAmount.toLocaleString("en-IN")}` : "No data",
      icon: IconCategory,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="p-4 border border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden relative">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{kpi.value}</h3>
              <p className="text-[10px] text-slate-500 font-medium mt-1">{kpi.sub}</p>
            </div>
            <div className={`${kpi.bg} ${kpi.color} p-2 rounded-lg`}>
              <kpi.icon size={20} stroke={2.5} />
            </div>
          </div>
          <div className={`absolute -right-2 -bottom-2 ${kpi.color} opacity-[0.03]`}>
            <kpi.icon size={64} stroke={1.5} />
          </div>
        </Card>
      ))}
    </div>
  );
}
