"use client";

import React from "react";
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconGift,
  IconTrendingUp,
  IconTrendingDown,
  IconReceipt,
  IconUsers,
  IconDatabase,
  IconClock,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";

export type DashboardSummary = {
  deposit: {
    totalAmount: number;
    totalCount: number;
    pendingCount: number;
    pendingAmount: number;
    verifiedAmount: number;
    verifiedCount: number;
    rejectedCount: number;
    bonusTotal: number;
  };
  withdrawal: {
    totalAmount: number;
    totalCount: number;
    pendingCount: number;
    pendingAmount: number;
    approvedAmount: number;
    approvedCount: number;
    rejectedCount: number;
    reverseBonusTotal: number;
  };
  expense: {
    totalAmount: number;
    totalCount: number;
    pendingCount: number;
    approvedAmount: number;
  };
  pnl: {
    gross: number;
    net: number;
  };
  exchanges: {
    total: number;
    active: number;
  };
  users: {
    total: number;
  };
  exchangesBreakdown?: {
    exchangeId: string;
    name: string;
    depositTotal: number;
    depositVerified: number;
    withdrawalTotal: number;
    withdrawalApproved: number;
    bonusGiven: number;
    bonusRecovered: number;
    netPL: number;
    netBonus: number;
  }[];
};

interface Props {
  summary: DashboardSummary | null;
  loading?: boolean;
}

function formatAmount(value: number) {
  const abs = Math.abs(value);
  let formatted: string;
  if (abs >= 10_00_000) formatted = `₹${(abs / 10_00_000).toFixed(2)}L`;
  else if (abs >= 1000) formatted = `₹${(abs / 1000).toFixed(1)}K`;
  else formatted = `₹${abs.toLocaleString("en-IN")}`;
  return value < 0 ? `−${formatted}` : formatted;
}

function formatCount(value: number) {
  return value.toLocaleString("en-IN");
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  badge?: { label: string; color: "amber" | "red" | "green" | "blue" | "slate" };
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
  trend?: { label: string; positive: boolean } | null;
  loading?: boolean;
  footer?: React.ReactNode;
}

function KPICard({
  title,
  value,
  subtitle,
  badge,
  icon,
  iconBg,
  valueColor = "text-slate-900",
  loading,
  footer,
}: KPICardProps) {
  const badgeColors = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    slate: "bg-slate-50 text-slate-500 border-slate-200",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:border-slate-300 group",
        loading && "animate-pulse",
      )}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{title}</p>
          {badge && !loading && (
            <span
              className={cn(
                "inline-flex items-center mt-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium",
                badgeColors[badge.color],
              )}
            >
              <IconClock className="w-2.5 h-2.5 mr-0.5" />
              {badge.label}
            </span>
          )}
        </div>
        <div className={cn("flex-shrink-0 p-2 rounded-xl transition-transform group-hover:scale-110", iconBg)}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div>
        {loading ? (
          <div className="h-8 w-24 bg-slate-100 rounded-lg" />
        ) : (
          <p className={cn("text-2xl font-bold tracking-tight leading-tight", valueColor)}>{value}</p>
        )}
        {subtitle && !loading && (
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Footer */}
      {footer && !loading && (
        <div className="pt-2 border-t border-slate-50 text-[11px] text-slate-400">{footer}</div>
      )}
    </div>
  );
}

export function DashboardKPIs({ summary, loading = false }: Props) {
  const d = summary?.deposit;
  const w = summary?.withdrawal;
  const e = summary?.expense;
  const pnl = summary?.pnl;
  const ex = summary?.exchanges;
  const us = summary?.users;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Deposits */}
      <KPICard
        loading={loading}
        title="Total Deposits"
        value={formatAmount(d?.totalAmount ?? 0)}
        subtitle={`${formatCount(d?.totalCount ?? 0)} non-rejected entries`}
        icon={<IconArrowUpRight className="w-5 h-5 text-emerald-600" />}
        iconBg="bg-emerald-50"
        badge={
          (d?.pendingCount ?? 0) > 0
            ? { label: `${d?.pendingCount} Pending`, color: "amber" }
            : undefined
        }
        footer={
          <div className="flex items-center justify-between">
            <span>Verified: <strong className="text-slate-600">{formatAmount(d?.verifiedAmount ?? 0)}</strong></span>
            <span>Rejected: <strong className="text-red-400">{d?.rejectedCount ?? 0}</strong></span>
          </div>
        }
      />

      {/* 2. Total Withdrawals */}
      <KPICard
        loading={loading}
        title="Total Withdrawals"
        value={formatAmount(w?.totalAmount ?? 0)}
        subtitle={`${formatCount(w?.totalCount ?? 0)} non-rejected entries`}
        icon={<IconArrowDownRight className="w-5 h-5 text-rose-600" />}
        iconBg="bg-rose-50"
        valueColor="text-rose-700"
        badge={
          (w?.pendingCount ?? 0) > 0
            ? { label: `${w?.pendingCount} Pending`, color: "amber" }
            : undefined
        }
        footer={
          <div className="flex items-center justify-between">
            <span>Approved: <strong className="text-slate-600">{formatAmount(w?.approvedAmount ?? 0)}</strong></span>
            <span>Rejected: <strong className="text-red-400">{w?.rejectedCount ?? 0}</strong></span>
          </div>
        }
      />

      {/* 3. Net Bonus */}
      <KPICard
        loading={loading}
        title="Net Bonus (D − W)"
        value={formatAmount((d?.bonusTotal ?? 0) - (w?.reverseBonusTotal ?? 0))}
        subtitle="Deposit bonuses minus reverse bonuses"
        icon={<IconGift className="w-5 h-5 text-amber-500" />}
        iconBg="bg-amber-50"
        valueColor="text-amber-700"
        footer={
          <div className="flex items-center justify-between">
            <span>Given: <strong className="text-emerald-500">{formatAmount(d?.bonusTotal ?? 0)}</strong></span>
            <span>Recovered: <strong className="text-rose-500">{formatAmount(w?.reverseBonusTotal ?? 0)}</strong></span>
          </div>
        }
      />

      {/* 4. Gross P&L */}
      <KPICard
        loading={loading}
        title="Gross P & L"
        value={formatAmount(pnl?.gross ?? 0)}
        subtitle="Verified Deposits − Approved Withdrawals"
        icon={
          (pnl?.gross ?? 0) >= 0
            ? <IconTrendingUp className="w-5 h-5 text-emerald-600" />
            : <IconTrendingDown className="w-5 h-5 text-rose-600" />
        }
        iconBg={(pnl?.gross ?? 0) >= 0 ? "bg-emerald-50" : "bg-rose-50"}
        valueColor={(pnl?.gross ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}
      />

      {/* 5. Total Expenses */}
      <KPICard
        loading={loading}
        title="Total Expenses"
        value={formatAmount(e?.totalAmount ?? 0)}
        subtitle={`${formatCount(e?.totalCount ?? 0)} expenses`}
        icon={<IconReceipt className="w-5 h-5 text-orange-500" />}
        iconBg="bg-orange-50"
        valueColor="text-orange-700"
        badge={
          (e?.pendingCount ?? 0) > 0
            ? { label: `${e?.pendingCount} Pending`, color: "amber" }
            : undefined
        }
        footer={
          <div className="flex items-center justify-between">
            <span>Approved: <strong className="text-slate-600">{formatAmount(e?.approvedAmount ?? 0)}</strong></span>
          </div>
        }
      />

      {/* 6. Net P&L */}
      <KPICard
        loading={loading}
        title="Net P & L"
        value={formatAmount(pnl?.net ?? 0)}
        subtitle="Gross P&L − Approved Expenses"
        icon={
          (pnl?.net ?? 0) >= 0
            ? <IconTrendingUp className="w-5 h-5 text-blue-600" />
            : <IconTrendingDown className="w-5 h-5 text-rose-600" />
        }
        iconBg={(pnl?.net ?? 0) >= 0 ? "bg-blue-50" : "bg-rose-50"}
        valueColor={(pnl?.net ?? 0) >= 0 ? "text-blue-700" : "text-rose-700"}
      />

      {/* 7. Active Exchanges */}
      <KPICard
        loading={loading}
        title="Active Exchanges"
        value={formatCount(ex?.active ?? 0)}
        subtitle={`of ${formatCount(ex?.total ?? 0)} total exchanges`}
        icon={<IconDatabase className="w-5 h-5 text-violet-600" />}
        iconBg="bg-violet-50"
        valueColor="text-violet-700"
        footer={
          (ex?.total ?? 0) > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${Math.round(((ex?.active ?? 0) / (ex?.total ?? 1)) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-violet-600">
                {Math.round(((ex?.active ?? 0) / (ex?.total ?? 1)) * 100)}%
              </span>
            </div>
          )
        }
      />

      {/* 8. Active Users */}
      <KPICard
        loading={loading}
        title="Active Users"
        value={formatCount(us?.total ?? 0)}
        subtitle="Sub-admins & operators"
        icon={<IconUsers className="w-5 h-5 text-sky-600" />}
        iconBg="bg-sky-50"
        valueColor="text-sky-700"
      />
    </div>
  );
}
