"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import {
  IconWallet,
  IconCashBanknote,
  IconGift,
  IconTrendingUp,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";

interface KPIProps {
  summary?: {
    totalExchanges: number;
    activeExchanges: number;
    totalUsers: number;
    auditEvents: number;
  } | null;
  loading?: boolean;
}
export function DashboardKPIs({ summary, loading = false }: KPIProps) {
  const cardClass = cn(
    "rounded-xl shadow-sm border-slate-200 bg-white transition-all",
    loading ? "animate-pulse" : ""
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Deposit */}
      <Card className={cardClass}>
        <div className="flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500">Deposit</span>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <IconWallet className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className={cn(
                "text-2xl font-bold text-slate-900",
                loading && "opacity-80"
              )}
            >
              {loading ? "…" : String(summary?.totalExchanges ?? 0)}
            </span>
          </div>
        </div>
      </Card>

      {/* Withdrawal */}
      <Card className={cardClass}>
        <div className="flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500">
              Withdrawal
            </span>
            <div className="p-2 bg-rose-50 rounded-lg">
              <IconCashBanknote className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className={cn(
                "text-2xl font-bold text-slate-900",
                loading && "opacity-80"
              )}
            >
              {loading ? "…" : String(summary?.activeExchanges ?? 0)}
            </span>
          </div>
        </div>
      </Card>

      {/* Total Bonus */}
      <Card className={cardClass}>
        <div className="flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500">
              Total Bonus
            </span>
            <div className="p-2 bg-amber-50 rounded-lg">
              <IconGift className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className={cn(
                "text-2xl font-bold text-slate-900",
                loading && "opacity-80"
              )}
            >
              {loading ? "…" : String(summary?.totalUsers ?? 0)}
            </span>
          </div>
        </div>
      </Card>

      {/* Gross P/L */}
      <Card className={cardClass}>
        <div className="flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500">Gross P/L</span>
            <div className="p-2 bg-blue-50 rounded-lg">
              <IconTrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className={cn(
                "text-2xl font-bold text-slate-900",
                loading && "opacity-80"
              )}
            >
              {loading ? "…" : String(summary?.auditEvents ?? 0)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
