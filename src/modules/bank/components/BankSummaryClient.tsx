"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconBuildingBank, IconRefresh } from "@tabler/icons-react";
import { DashboardFilterPanel, type DashboardFilters } from "@/modules/dashboard/components/DashboardFilterPanel";
import { DATE_PRESETS, DEFAULT_PRESET } from "@/modules/dashboard/components/DashboardFilterBar";
import { DashboardBankSummary } from "@/modules/dashboard/components/DashboardBankSummary";
import { getBankSummary, type BankSummaryRow } from "@/services/bankService";
import { getApiErrorMessage } from "@/lib/apiError";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { formatYyyyMmDdInTimeZone, resolveUserTimeZone } from "@/lib/userTimezone";

const AUTO_REFRESH_INTERVALS = [5, 10, 15, 30, 60] as const;
type AutoRefreshIntervalSec = (typeof AUTO_REFRESH_INTERVALS)[number];

function getInitialFilters(): DashboardFilters {
  const preset = DATE_PRESETS.find((p) => p.label === DEFAULT_PRESET);
  const dates = preset ? preset.fn() : { date_from: "", date_to: "" };
  return {
    date_from: dates.date_from || "",
    date_to: dates.date_to || "",
    status: "all",
    bank_status: "active",
    transaction_type: "all",
    player_id: "",
    bank_id: "",
    exchange_id: "",
    sub_exchange_id: "",
    amount_from: "",
    amount_to: "",
    search: "",
  };
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function isToday(dateStr: string): boolean {
  const tz = resolveUserTimeZone();
  const today = formatYyyyMmDdInTimeZone(new Date(), tz);
  return dateStr === today;
}

function buildStatementHref(
  bankId: string,
  fromDate: string,
  toDate: string,
  entryType?: string,
): string {
  const params = new URLSearchParams();
  params.set("bankId", bankId);
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (entryType && entryType !== "all") params.set("entryType", entryType);
  return `/bank/statement?${params.toString()}`;
}

function isAbortError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { name?: string; code?: string };
  return err.name === "AbortError" || err.name === "CanceledError" || err.code === "ERR_CANCELED";
}

export function BankSummaryClient() {
  const [filters, setFilters] = useState(getInitialFilters);
  const [activePreset, setActivePreset] = useState<string | null>(DEFAULT_PRESET);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<BankSummaryRow[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<AutoRefreshIntervalSec>(10);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  const todayBoth = isToday(filters.date_from) && isToday(filters.date_to);

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (silent && inFlightRef.current) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    inFlightRef.current = true;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await getBankSummary({
        fromDate: filters.date_from || undefined,
        toDate: filters.date_to || undefined,
        exchangeId: filters.exchange_id || undefined,
        status: filters.status,
        bankStatus: (filters.bank_status as "active" | "deactive" | "all") || "active",
        transactionType: filters.transaction_type,
        playerId: filters.player_id || undefined,
        bankId: filters.bank_id || undefined,
        amountFrom: filters.amount_from || undefined,
        amountTo: filters.amount_to || undefined,
        search: filters.search || undefined,
      });
      setRows(data.banksBreakdown);
      setError(null);
    } catch (e: unknown) {
      if (isAbortError(e)) return;
      setError(getApiErrorMessage(e, "Failed to load bank summary"));
      if (!silent) setRows([]);
    } finally {
      inFlightRef.current = false;
      if (!silent) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchData();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void fetchData({ silent: true });
    }, refreshIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshIntervalSec, fetchData]);

  const handlePreset = (preset: (typeof DATE_PRESETS)[0]) => {
    const dates = preset.fn();
    setFilters((prev) => ({
      ...prev,
      date_from: dates.date_from,
      date_to: dates.date_to,
    }));
    setActivePreset(preset.label);
  };

  const handleApplyFilters = (next: DashboardFilters) => {
    setFilters(next);
    const match = DATE_PRESETS.find((p) => {
      const d = p.fn();
      return d.date_from === next.date_from && d.date_to === next.date_to;
    });
    setActivePreset(match?.label ?? null);
  };

  const handleReset = () => {
    setFilters(getInitialFilters());
    setActivePreset(DEFAULT_PRESET);
  };

  const getStatementHref = useCallback(
    (bankId: string, entryType?: string) =>
      buildStatementHref(bankId, filters.date_from, filters.date_to, entryType),
    [filters.date_from, filters.date_to],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <IconBuildingBank className="h-5 w-5 text-slate-700" />
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Bank Summary</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Bank-wise opening, movements, and closing for{" "}
            {todayBoth ? (
              <span className="font-medium text-slate-700">Today</span>
            ) : (
              <span className="font-medium text-slate-700">
                {formatDisplayDate(filters.date_from)}
                {filters.date_from !== filters.date_to
                  ? ` – ${formatDisplayDate(filters.date_to)}`
                  : ""}
              </span>
            )}
            . Click a bank or metric to open the statement with these filters.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoRefresh((v) => !v)}
              aria-pressed={autoRefresh}
              aria-label="Toggle auto refresh"
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoRefresh ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${autoRefresh ? "translate-x-[18px]" : "translate-x-[3px]"}`}
              />
            </button>
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Auto Refresh{" "}
              {autoRefresh ? (
                <span className="text-green-600">(every {refreshIntervalSec}s)</span>
              ) : (
                "(off)"
              )}
            </span>
            <Select
              aria-label="Auto refresh interval seconds"
              value={String(refreshIntervalSec)}
              disabled={!autoRefresh}
              onChange={(e) => {
                const next = Number(e.target.value);
                if ((AUTO_REFRESH_INTERVALS as readonly number[]).includes(next)) {
                  setRefreshIntervalSec(next as AutoRefreshIntervalSec);
                }
              }}
              className="h-8 w-[4.5rem] px-2 text-xs"
            >
              {AUTO_REFRESH_INTERVALS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}s
                </option>
              ))}
            </Select>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => void fetchData()}
            startIcon={<IconRefresh className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      <DashboardFilterPanel
        filters={filters}
        onApply={handleApplyFilters}
        activePreset={activePreset}
        onPreset={handlePreset}
        onReset={handleReset}
        loading={loading}
      />

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DashboardBankSummary
        banksBreakdown={rows}
        loading={loading}
        showEmptyState
        getStatementHref={getStatementHref}
        title="Bank Wise Summary"
      />
    </div>
  );
}
