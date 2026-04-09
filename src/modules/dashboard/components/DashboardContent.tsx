"use client";

import React, { useEffect, useState } from "react";
import { IconCalendar, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { DashboardKPIs } from "./DashboardKPIs";
import { DashboardCharts } from "./DashboardCharts";
import { cn } from "@/lib/cn";
import { reportService } from "@/services/reportService";

const DATE_PRESETS = [
  {
    label: "Today",
    fn: () => {
      const d = new Date().toISOString().split("T")[0];
      return { date_from: d, date_to: d };
    },
  },
  {
    label: "This Week",
    fn: () => {
      const n = new Date(),
        dy = n.getDay(),
        m = new Date(n);
      m.setDate(n.getDate() - (dy === 0 ? 6 : dy - 1));
      const e = new Date(m);
      e.setDate(m.getDate() + 6);
      return {
        date_from: m.toISOString().split("T")[0],
        date_to: e.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "This Month",
    fn: () => {
      const n = new Date();
      return {
        date_from: new Date(n.getFullYear(), n.getMonth(), 1)
          .toISOString()
          .split("T")[0],
        date_to: new Date(n.getFullYear(), n.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0],
      };
    },
  },
  {
    label: "Last 30 Days",
    fn: () => {
      const d = new Date(),
        p = new Date();
      p.setDate(p.getDate() - 30);
      return {
        date_from: p.toISOString().split("T")[0],
        date_to: d.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "Last 6M",
    fn: () => {
      const n = new Date(),
        p = new Date(n);
      p.setMonth(n.getMonth() - 6);
      return {
        date_from: p.toISOString().split("T")[0],
        date_to: n.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "This Year",
    fn: () => {
      const n = new Date();
      return {
        date_from: new Date(n.getFullYear(), 0, 1)
          .toISOString()
          .split("T")[0],
        date_to: new Date(n.getFullYear(), 11, 31)
          .toISOString()
          .split("T")[0],
      };
    },
  },
];

const DEFAULT_DATE_PRESET_LABEL = "Today";

function getInitialFilters() {
  const preset = DATE_PRESETS.find((p) => p.label === DEFAULT_DATE_PRESET_LABEL);
  const dates = preset ? preset.fn() : { date_from: "", date_to: "" };
  return {
    ...dates,
    status: "active",
  };
}

export function DashboardContent() {
  const [filters, setFilters] = useState(getInitialFilters());
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    totalExchanges: number;
    activeExchanges: number;
    totalUsers: number;
    auditEvents: number;
  } | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(
    DEFAULT_DATE_PRESET_LABEL
  );

  useEffect(() => {
    reportService
      .dashboardSummary({
        fromDate: filters.date_from,
        toDate: filters.date_to,
      })
      .then((res) => setSummary(res?.data ?? null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [filters.date_from, filters.date_to]);

  const handleApplyFilters = (next: Partial<typeof filters>) => {
    setLoading(true);
    setFilters((prev) => ({ ...prev, ...next }));
    if (next.date_from || next.date_to) {
      setActivePreset(null);
    }
  };

  const handleClearFilters = () => {
    setLoading(true);
    setFilters(getInitialFilters());
    setActivePreset(DEFAULT_DATE_PRESET_LABEL);
  };

  const handlePreset = (preset: typeof DATE_PRESETS[0]) => {
    setLoading(true);
    const dates = preset.fn();
    setFilters((prev) => ({ ...prev, ...dates }));
    setActivePreset(preset.label);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col gap-3 py-2">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[var(--border)] pb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
              Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Full-day summary and key operational metrics.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Status:
              </span>
              {[
                { label: "Pending", value: "pending" },
                { label: "Active", value: "active" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
                { label: "All", value: "all" },
              ].map((s) => {
                const isSelected = filters.status === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => handleApplyFilters({ status: s.value })}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all",
                      isSelected
                        ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-[var(--brand-primary)]/50 hover:text-[var(--brand-primary)]"
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Date Presets */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <span className="flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider text-slate-400 ml-1">
                <IconCalendar className="w-3 h-3" /> Quick:
              </span>
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors",
                    activePreset === p.label
                      ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="h-7 text-xs px-2 gap-1"
            >
              <IconRefresh className="w-3 h-3" /> Reset
            </Button>
          </div>
        </div>
      </div>

      <DashboardKPIs summary={summary} loading={loading} />

      <DashboardCharts filters={filters} />
    </div>
  );
}
