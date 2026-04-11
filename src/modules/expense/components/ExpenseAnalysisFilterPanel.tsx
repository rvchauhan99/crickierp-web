"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconFilter,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { AutocompleteField } from "@/components/common/AutocompleteField";

import { listBanksNormalized } from "@/services/bankService";
import { listExpenseTypes } from "@/services/expenseService";
import { userService } from "@/services/userService";
import {
  EXPENSE_FINAL_FILTER_KEYS,
  emptyExpenseFinalFilters,
  type ExpenseFinalFilterKey,
} from "@/modules/expense/expenseFinalListConstants";
import {
  buildAmountApiParams,
  buildCreatedAtApiParams,
  buildExpenseDateApiParams,
  displayNumericRangePair,
} from "@/modules/expense/expenseFinalListFilterMapping";

// We'll simulate DateField if it's just an input type=date
const DateField = ({ name, value, onChange, label }: any) => (
  <div className="space-y-1">
    {label && <Label className="text-[10px] text-slate-500 uppercase tracking-tight">{label}</Label>}
    <Input
      type="date"
      name={name}
      value={value}
      onChange={onChange}
      className="h-8 text-xs border-slate-200"
    />
  </div>
);

const STATUS_OPTIONS = [
  { label: "Pending audit", value: "pending_audit" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const CHIP_LABELS: Partial<Record<ExpenseFinalFilterKey | "q", string>> = {
  q: "Search",
  expenseTypeId: "Category",
  bankId: "Bank",
  status: "Status",
  amount: "Amount",
  createdBy: "Initiator",
  approvedBy: "Approver",
  createdAt_from: "Audit Date",
  expenseDate_from: "Expense Date",
};

const SKIP_CHIP_KEYS = new Set<ExpenseFinalFilterKey>([
  "amount_to",
  "amount_op",
  "createdAt_to",
  "createdAt_op",
  "expenseDate_to",
  "expenseDate_op",
]);

interface Props {
  q: string;
  filters: Record<string, string>;
  setQ: (value: string, debounce?: boolean) => void;
  setFilters: (next: Record<string, string>, resetPage?: boolean, debounce?: boolean) => void;
  onClear: () => void;
}

export function ExpenseAnalysisFilterPanel({ q, filters, setQ, setFilters, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(() => ({ ...emptyExpenseFinalFilters(), ...filters }));
  const [quickSearch, setQuickSearch] = useState(q);
  const debounceQRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const am = displayNumericRangePair(filters.amount, filters.amount_to, filters.amount_op);
    setLocal({
      ...emptyExpenseFinalFilters(),
      ...filters,
      amount: am.from,
      amount_to: am.to,
    });
  }, [filters]);

  useEffect(() => {
    setQuickSearch(q);
  }, [q]);

  const handleChange = useCallback((key: ExpenseFinalFilterKey, value: string) => {
    setLocal((prev) => ({ ...prev, [key]: value ?? "" }));
  }, []);

  const handleApply = useCallback(() => {
    const next = {
      ...emptyExpenseFinalFilters(),
      expenseTypeId: local.expenseTypeId,
      bankId: local.bankId,
      status: local.status,
      ...buildAmountApiParams(local.amount, local.amount_to),
      createdBy: local.createdBy,
      approvedBy: local.approvedBy,
      ...buildCreatedAtApiParams(local.createdAt_from, local.createdAt_to),
      ...buildExpenseDateApiParams(local.expenseDate_from, local.expenseDate_to),
      q: quickSearch,
    };
    setFilters(next, true, false);
    setOpen(false);
  }, [local, quickSearch, setFilters]);

  // Options loaders
  const loadUserOptions = useCallback(async (query: string) => {
    const res = await userService.list({ q: query || undefined, page: 1, limit: 20 });
    return (res.data as any[]).map(u => ({ value: u._id || u.id, label: u.fullName || u.username }));
  }, []);

  const loadBankOptions = useCallback(async (query: string) => {
    const res = await listBanksNormalized({ q: query || undefined, page: 1, limit: 20 });
    return res.data.map(b => ({ value: b.id, label: `${b.bankName} (${String(b.accountNumber).slice(-4)})` }));
  }, []);

  const loadTypeOptions = useCallback(async (query: string) => {
    const rows = await listExpenseTypes();
    const qq = query.trim().toLowerCase();
    return rows
      .filter(r => !qq || r.name.toLowerCase().includes(qq))
      .map(r => ({ value: r._id, label: r.name }));
  }, []);

  const activeCount = useMemo(() => {
    let n = quickSearch.trim() ? 1 : 0;
    Object.entries(local).forEach(([key, val]) => {
      if (SKIP_CHIP_KEYS.has(key as any)) return;
      if (val?.trim()) n++;
    });
    return n;
  }, [local, quickSearch]);

  const appliedChips = useMemo(() => {
    const labels: string[] = [];
    if (quickSearch.trim()) labels.push("Search");
    Object.entries(local).forEach(([key, val]) => {
      if (SKIP_CHIP_KEYS.has(key as any)) return;
      if (val?.trim()) labels.push(CHIP_LABELS[key as keyof typeof CHIP_LABELS] || key);
    });
    return labels;
  }, [local, quickSearch]);

  return (
    <Card className="rounded-xl shadow-sm border-slate-200 bg-white overflow-visible">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 px-3 py-2 h-auto sm:h-12">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors rounded-lg border border-slate-200 focus:outline-none shrink-0"
        >
          <span className="flex items-center gap-2 text-[10px] font-bold text-slate-700 uppercase tracking-tight">
            <IconFilter size={14} /> Advanced Filters
            {activeCount > 0 && (
              <Badge variant="success" className="text-[10px] h-4 px-1 leading-none">
                {activeCount}
              </Badge>
            )}
          </span>
          {open ? <IconChevronUp size={14} className="text-slate-400" /> : <IconChevronDown size={14} className="text-slate-400" />}
        </button>

        {(activeCount > 0 || quickSearch) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setLocal(emptyExpenseFinalFilters()); setQuickSearch(""); onClear(); }}
            className="h-8 shrink-0 px-2 text-[10px] font-bold uppercase tracking-tight border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all"
          >
            <IconX size={12} className="mr-1" /> Clear
          </Button>
        )}

        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {appliedChips.map((label, i) => (
            <span key={`${label}-${i}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap uppercase tracking-tighter">
              {label}
            </span>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <Input
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setQ(quickSearch)}
            placeholder="Quick search..."
            className="h-9 pl-9 text-xs border-slate-200 rounded-lg focus:ring-brand-primary"
          />
        </div>
      </div>

      {/* Expandable Advanced Grid */}
      {open && (
        <div className="border-t border-slate-100 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <Label className="text-[10px] text-slate-500 uppercase tracking-tight">Category</Label>
            <div className="h-8 text-xs [&_input]:h-8 [&_input]:text-xs">
              <AutocompleteField
                value={local.expenseTypeId}
                onChange={(v: string) => handleChange("expenseTypeId", v)}
                loadOptions={loadTypeOptions}
                placeholder="All Types"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-slate-500 uppercase tracking-tight">Status</Label>
            <Select
              value={local.status || "__all__"}
              onValueChange={(v: string) => handleChange("status", v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                <SelectValue className="" placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem className="" value="__all__">
                  All Status
                </SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem className="" key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-slate-500 uppercase tracking-tight">Bank Account</Label>
            <AutocompleteField
              value={local.bankId}
              onChange={(v) => handleChange("bankId", v)}
              loadOptions={loadBankOptions}
              placeholder="All Banks"
            />
          </div>

          <div className="space-y-1 lg:col-span-2">
            <Label className="text-[10px] text-slate-500 uppercase tracking-tight">Amount Range</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="From"
                value={local.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                className="h-8 text-xs border-slate-200"
              />
              <span className="text-slate-300">-</span>
              <Input
                placeholder="To"
                value={local.amount_to}
                onChange={(e) => handleChange("amount_to", e.target.value)}
                className="h-8 text-xs border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-slate-500 uppercase tracking-tight">Initiated By</Label>
            <AutocompleteField
              value={local.createdBy}
              onChange={(v) => handleChange("createdBy", v)}
              loadOptions={loadUserOptions}
              placeholder="Select user"
            />
          </div>

          <div className="space-y-1 lg:col-span-2">
            <Label className="text-[10px] text-slate-500 uppercase tracking-tight">Expense Date Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={local.expenseDate_from}
                onChange={(e) => handleChange("expenseDate_from", e.target.value)}
                className="h-8 text-xs border-slate-200 flex-1"
              />
              <span className="text-slate-300">-</span>
              <Input
                type="date"
                value={local.expenseDate_to}
                onChange={(e) => handleChange("expenseDate_to", e.target.value)}
                className="h-8 text-xs border-slate-200 flex-1"
              />
            </div>
          </div>

          <div className="space-y-1 lg:col-span-2">
            <Label className="text-[10px] text-slate-500 uppercase tracking-tight">Audit Creation Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={local.createdAt_from}
                onChange={(e) => handleChange("createdAt_from", e.target.value)}
                className="h-8 text-xs border-slate-200 flex-1"
              />
              <span className="text-slate-300">-</span>
              <Input
                type="date"
                value={local.createdAt_to}
                onChange={(e) => handleChange("createdAt_to", e.target.value)}
                className="h-8 text-xs border-slate-200 flex-1"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-slate-500 uppercase tracking-tight">Approved By</Label>
            <AutocompleteField
              value={local.approvedBy}
              onChange={(v) => handleChange("approvedBy", v)}
              loadOptions={loadUserOptions}
              placeholder="Select user"
            />
          </div>

          <div className="lg:col-span-6 flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
            <Button variant="outline" size="sm" onClick={() => { setLocal(emptyExpenseFinalFilters()); onClear(); setOpen(false); }} className="h-8 text-[11px] font-bold uppercase tracking-tight px-4">Reset</Button>
            <Button size="sm" onClick={handleApply} className="h-8 text-[11px] font-bold uppercase tracking-tight px-4 bg-brand-primary">Apply Filters</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
