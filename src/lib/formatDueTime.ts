import type { DepositRow, DepositStatus } from "@/types/deposit";
import type { WithdrawalRow, WithdrawalStatus } from "@/types/withdrawal";

const DEPOSIT_OPEN_STATUSES: ReadonlySet<DepositStatus> = new Set(["pending", "not_settled"]);
const WITHDRAWAL_OPEN_STATUSES: ReadonlySet<WithdrawalStatus> = new Set(["requested"]);

function parseMs(iso?: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Format elapsed seconds into the same units used by list Due time columns. */
export function formatElapsedSeconds(sec: number, opts?: { withAgo?: boolean }): string {
  const withAgo = opts?.withAgo === true;
  const ago = withAgo ? " ago" : "";
  if (sec < 60) return withAgo ? "Just now" : "< 1 min";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${ago}`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h${ago}`;
  const days = Math.floor(h / 24);
  return `${days} day${days === 1 ? "" : "s"}${ago}`;
}

export function formatElapsedBetween(startIso?: string, endIso?: string, opts?: { withAgo?: boolean }): string {
  const start = parseMs(startIso);
  const end = parseMs(endIso);
  if (start == null || end == null) return "—";
  const sec = Math.max(0, Math.floor((end - start) / 1000));
  return formatElapsedSeconds(sec, opts);
}

export function formatDueTime(opts: {
  startIso?: string;
  endIso?: string;
  live: boolean;
}): string {
  const start = parseMs(opts.startIso);
  if (start == null) return "—";
  if (opts.live) {
    const sec = Math.max(0, Math.floor((Date.now() - start) / 1000));
    return formatElapsedSeconds(sec, { withAgo: true });
  }
  return formatElapsedBetween(opts.startIso, opts.endIso, { withAgo: false });
}

export function depositDueTime(row: Pick<
  DepositRow,
  "status" | "entryAt" | "createdAt" | "exchangeActionAt" | "settledAt" | "updatedAt"
>): string {
  const startIso = row.entryAt ?? row.createdAt;
  const live = DEPOSIT_OPEN_STATUSES.has(row.status);
  if (live) {
    return formatDueTime({ startIso, live: true });
  }
  const endIso = row.exchangeActionAt ?? row.settledAt ?? row.updatedAt;
  return formatDueTime({ startIso, endIso, live: false });
}

export function withdrawalDueTime(row: Pick<
  WithdrawalRow,
  "status" | "requestedAt" | "createdAt" | "resolvedAt" | "approvedAt" | "updatedAt"
>): string {
  const startIso = row.requestedAt ?? row.createdAt;
  const live = WITHDRAWAL_OPEN_STATUSES.has(row.status);
  if (live) {
    return formatDueTime({ startIso, live: true });
  }
  const endIso = row.resolvedAt ?? row.approvedAt ?? row.updatedAt;
  return formatDueTime({ startIso, endIso, live: false });
}
