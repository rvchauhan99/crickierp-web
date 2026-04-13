"use client";

import React, { useState, useCallback, useMemo } from "react";
import { IconCalendar, IconFilter, IconChevronDown, IconChevronUp, IconX, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AutocompleteField } from "@/components/common/AutocompleteField";
import { DATE_PRESETS } from "./DashboardFilterBar";
import { cn } from "@/lib/cn";
import { apiClient } from "@/services/apiClient";

export interface DashboardFilters {
  date_from: string;
  date_to: string;
  status: string;
  transaction_type: string;
  player_id: string;
  bank_id: string;
  exchange_id: string;
  amount_from: string;
  amount_to: string;
  search: string;
}

interface DashboardFilterPanelProps {
  filters: DashboardFilters;
  onApply: (filters: DashboardFilters) => void;
  activePreset: string | null;
  onPreset: (preset: (typeof DATE_PRESETS)[0]) => void;
  onReset: () => void;
  loading?: boolean;
}

type PlayerOptionRow = { _id: string; playerName?: string; name?: string; playerId?: string };
type BankOptionRow = { _id: string; bankName?: string; holderName?: string };
type ExchangeOptionRow = { _id: string; exchangeName?: string; name?: string };

export function DashboardFilterPanel({
  filters,
  onApply,
  activePreset,
  onPreset,
  onReset,
  loading,
}: DashboardFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const [localValues, setLocalValues] = useState<DashboardFilters>(filters);

  // Sync when prop filters change (e.g. from preset click or reset)
  React.useEffect(() => {
    setLocalValues(filters);
  }, [filters]);

  const handleChange = useCallback((key: keyof DashboardFilters, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleApply = useCallback(() => {
    // If only one amount is set, we could auto-fill or leave it depending on logic.
    onApply(localValues);
    setOpen(false);
  }, [localValues, onApply]);

  const handleClear = useCallback(() => {
    onReset();
    setOpen(false);
  }, [onReset]);

  // For the active count, we only count additional fields (not the default date_from/to)
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status !== "all") count++;
    if (filters.transaction_type && filters.transaction_type !== "all") count++;
    if (filters.player_id) count++;
    if (filters.bank_id) count++;
    if (filters.exchange_id) count++;
    if (filters.amount_from) count++;
    if (filters.amount_to) count++;
    if (filters.search) count++;
    return count;
  }, [filters]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
      {/* Quick Bar Level */}
      <div className="flex flex-wrap items-center gap-2 p-3 min-h-[52px]">
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors rounded-lg border border-slate-200 focus:outline-none shrink-0"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-tight">
            <IconFilter size={14} /> Advanced Filters
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 px-1 leading-none bg-green-100 text-green-700 border border-green-200 rounded text-[10px]">
                {activeCount}
              </span>
            )}
          </span>
          {open ? (
            <IconChevronUp size={14} className="text-slate-400" />
          ) : (
            <IconChevronDown size={14} className="text-slate-400" />
          )}
        </button>

        {/* Clear filters shortcut */}
        {activeCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 px-2 text-[10px] font-semibold uppercase tracking-tight border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
            onClick={handleClear}
            disabled={loading}
          >
            <IconX size={12} className="mr-0.5" />
            Clear filters
          </Button>
        )}

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Date Preset Chips */}
        <div className="flex items-center gap-1">
          <IconCalendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Quick:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onPreset(p)}
              disabled={loading}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all",
                activePreset === p.label
                  ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:border-[var(--brand-primary)]/50 hover:text-[var(--brand-primary)]",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Refresh / Reset right side */}
        <div className="ml-auto flex items-center gap-2">
           <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={loading}
            className="h-8 text-xs px-2.5 gap-1"
          >
            <IconRefresh className="w-3.5 h-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Expanded Detailed Filters */}
      {open && (
        <div className="border-t border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-slate-50/50 rounded-b-xl">
          {/* Row 1 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Search</label>
            <Input 
              placeholder="Search by transaction / user..." 
              value={localValues.search}
              onChange={(e) => handleChange("search", e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Date From</label>
            <input
              type="date"
              value={localValues.date_from}
              onChange={(e) => handleChange("date_from", e.target.value)}
              disabled={loading}
              className="h-10 w-full px-3 rounded-md border border-[var(--border)] bg-white text-[15px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-colors disabled:opacity-50"
            />
          </div>
          <div>
             <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Date To</label>
            <input
              type="date"
              value={localValues.date_to}
              onChange={(e) => handleChange("date_to", e.target.value)}
              disabled={loading}
               className="h-10 w-full px-3 rounded-md border border-[var(--border)] bg-white text-[15px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-colors disabled:opacity-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Status</label>
            <Select 
              value={localValues.status} 
              onChange={(e) => handleChange("status", e.target.value)}
              disabled={loading}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          {/* Row 2 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Transaction Type</label>
            <Select 
              value={localValues.transaction_type}
              onChange={(e) => handleChange("transaction_type", e.target.value)}
              disabled={loading}
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="expense">Expense</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Player</label>
            <AutocompleteField
              value={localValues.player_id}
              onChange={(val) => handleChange("player_id", val)}
              placeholder="Search player..."
              disabled={loading}
              loadOptions={async (query) => {
                const res = await apiClient.get("/players", { params: { search: query, limit: 20 } });
                const rows: PlayerOptionRow[] = Array.isArray(res.data?.data) ? res.data.data : [];
                return rows.map((p) => ({ value: p._id, label: p.playerName || p.name || p.playerId || p._id }));
              }}
            />
          </div>
          <div>
             <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Bank</label>
             <AutocompleteField
              value={localValues.bank_id}
              onChange={(val) => handleChange("bank_id", val)}
              placeholder="Search bank..."
              disabled={loading}
              loadOptions={async (query) => {
                const res = await apiClient.get("/bank", { params: { search: query, limit: 20 } });
                const rows: BankOptionRow[] = Array.isArray(res.data?.data) ? res.data.data : [];
                return rows.map((b) => ({ value: b._id, label: b.bankName || b.holderName || b._id }));
              }}
            />
          </div>
           <div>
             <label className="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Exchange</label>
             <AutocompleteField
              value={localValues.exchange_id || ""}
              onChange={(val) => handleChange("exchange_id", val)}
              placeholder="Search exchange..."
              disabled={loading}
              loadOptions={async (query) => {
                const res = await apiClient.get("/exchange", { params: { search: query, limit: 20 } });
                const rows: ExchangeOptionRow[] = Array.isArray(res.data?.data) ? res.data.data : [];
                return rows.map((e) => ({ value: e._id, label: e.exchangeName || e.name || e._id }));
              }}
            />
          </div>

          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-200 mt-2">
            <Button variant="outline" size="sm" onClick={handleClear} disabled={loading} className="w-24">Clear</Button>
            <Button size="sm" onClick={handleApply} disabled={loading} className="w-24">Apply</Button>
          </div>
        </div>
      )}
    </div>
  );
}
