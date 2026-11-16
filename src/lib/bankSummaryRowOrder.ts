/** Browser preference for Bank Wise Summary row sequence (display only). */
export const BANK_SUMMARY_ROW_ORDER_KEY = "crickierp-bank-summary-row-order";

export function loadBankSummaryRowOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BANK_SUMMARY_ROW_ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function saveBankSummaryRowOrder(order: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BANK_SUMMARY_ROW_ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore quota / private mode
  }
}

export function clearBankSummaryRowOrder(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BANK_SUMMARY_ROW_ORDER_KEY);
  } catch {
    // ignore
  }
}

/** Sort rows by saved bankId preference; unknown ids append at the end. */
export function applyBankSummaryRowOrder<T extends { bankId: string }>(
  rows: T[],
  order: string[],
): T[] {
  if (!rows.length || !order.length) return rows;
  const byId = new Map(rows.map((row) => [row.bankId, row]));
  const ordered: T[] = [];
  const seen = new Set<string>();
  for (const id of order) {
    const row = byId.get(id);
    if (row) {
      ordered.push(row);
      seen.add(id);
    }
  }
  for (const row of rows) {
    if (!seen.has(row.bankId)) ordered.push(row);
  }
  return ordered;
}
