import { apiClient } from "./apiClient";
import type { DepositCreateInput, DepositRow, DepositView } from "@/types/deposit";

function toOptionalParam(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

function parseAuditUser(value: unknown): { id?: string; name?: string } {
  if (typeof value === "string") return { id: value };
  if (!value || typeof value !== "object") return {};
  const row = value as Record<string, unknown>;
  const idRaw = row.id ?? row._id;
  const id = typeof idRaw === "string" ? idRaw : idRaw != null ? String(idRaw) : undefined;
  const nameCandidate = [row.fullName, row.full_name, row.username, row.name].find(
    (entry) => typeof entry === "string" && String(entry).trim() !== "",
  );
  const name = typeof nameCandidate === "string" ? nameCandidate : undefined;
  return { id, name };
}

function normalizeDeposit(row: Record<string, unknown>): DepositRow {
  const id = String(row._id ?? row.id ?? "");
  const createdByUser = parseAuditUser(row.createdBy);
  const exchangeBy = parseAuditUser(row.exchangeActionBy);
  const createdByName = toOptionalParam(
    row.createdByName ?? row["created_by_name" as keyof typeof row] ?? createdByUser.name,
  );
  const exchangeActionByName = toOptionalParam(exchangeBy.name);

  const player = row.player as Record<string, unknown> | undefined;
  const playerIdLabel =
    player && player.playerId != null ? String(player.playerId) : undefined;

  const bankPop = row.bankId as Record<string, unknown> | undefined;
  let bankName = String(row.bankName ?? "").trim();
  if (!bankName && bankPop && typeof bankPop.holderName === "string") {
    bankName =
      `${bankPop.holderName} - ${bankPop.bankName ?? ""} - ${String(bankPop.accountNumber ?? "").slice(-4)}`.trim();
  }

  const st = row.status;
  const status: DepositRow["status"] =
    st === "verified" || st === "rejected" || st === "finalized" || st === "pending" ? st : "pending";

  return {
    _id: id,
    id,
    bankId: row.bankId != null && typeof row.bankId === "object" && "_id" in (row.bankId as object)
      ? String((row.bankId as { _id?: unknown })._id)
      : typeof row.bankId === "string"
        ? row.bankId
        : undefined,
    bankName,
    utr: String(row.utr ?? ""),
    amount: Number(row.amount ?? 0),
    status,
    createdAt: row.createdAt != null ? String(row.createdAt) : undefined,
    updatedAt: row.updatedAt != null ? String(row.updatedAt) : undefined,
    createdBy: row.createdBy,
    createdByName,
    bankId_populated: row.bankId,
    player: row.player,
    playerIdLabel,
    bonusAmount: row.bonusAmount != null ? Number(row.bonusAmount) : undefined,
    totalAmount: row.totalAmount != null ? Number(row.totalAmount) : undefined,
    rejectReason: row.rejectReason != null ? String(row.rejectReason) : undefined,
    exchangeActionBy: row.exchangeActionBy,
    exchangeActionByName,
    exchangeActionAt: row.exchangeActionAt != null ? String(row.exchangeActionAt) : undefined,
    bankBalanceAfter: row.bankBalanceAfter != null ? Number(row.bankBalanceAfter) : undefined,
    settledAt: row.settledAt != null ? String(row.settledAt) : undefined,
  };
}

function str(params: Record<string, unknown>, key: string): string {
  const v = params[key];
  if (v === undefined || v === null) return "";
  return String(v);
}

export async function createDeposit(input: DepositCreateInput): Promise<unknown> {
  const response = await apiClient.post<{ success: boolean; data: unknown }>("/deposit", input);
  return response.data?.data;
}

export async function listDepositsNormalized(
  view: DepositView,
  params: Record<string, unknown>,
): Promise<{
  data: DepositRow[];
  meta: { total: number; page: number; pageSize: number };
}> {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const sortBy =
    (str(params, "sortBy") || "createdAt") as
      | "createdAt"
      | "amount"
      | "utr"
      | "status"
      | "totalAmount"
      | "settledAt"
      | "bankName";
  const sortOrder = str(params, "sortOrder") === "asc" ? "asc" : "desc";

  const response = await apiClient.get<{
    success: boolean;
    data: Record<string, unknown>[];
    meta: { total: number; page: number; pageSize: number };
  }>("/deposit", {
    params: {
      view,
      page,
      pageSize: limit,
      sortBy,
      sortOrder,
      search: toOptionalParam(str(params, "q")) || undefined,
      utr: toOptionalParam(str(params, "utr")),
      utr_op: toOptionalParam(str(params, "utr_op")),
      bankName: toOptionalParam(str(params, "bankName")),
      bankName_op: toOptionalParam(str(params, "bankName_op")),
      bankId: toOptionalParam(str(params, "bankId")),
      status: toOptionalParam(str(params, "status")),
      amount: toOptionalParam(str(params, "amount")),
      amount_to: toOptionalParam(str(params, "amount_to")),
      amount_op: toOptionalParam(str(params, "amount_op")),
      totalAmount: toOptionalParam(str(params, "totalAmount")),
      totalAmount_to: toOptionalParam(str(params, "totalAmount_to")),
      totalAmount_op: toOptionalParam(str(params, "totalAmount_op")),
      player: toOptionalParam(str(params, "player")),
      createdBy: toOptionalParam(str(params, "createdBy")),
      createdAt_from: toOptionalParam(str(params, "createdAt_from")),
      createdAt_to: toOptionalParam(str(params, "createdAt_to")),
      createdAt_op: toOptionalParam(str(params, "createdAt_op")),
    },
  });

  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  const meta = response.data?.meta;
  return {
    data: rows.map((row) => normalizeDeposit(row)),
    meta: {
      total: Number(meta?.total ?? 0),
      page: Number(meta?.page ?? page),
      pageSize: Number(meta?.pageSize ?? limit),
    },
  };
}

export async function exportDeposits(view: DepositView, params: Record<string, unknown>): Promise<Blob> {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const sortBy =
    (str(params, "sortBy") || "createdAt") as
      | "createdAt"
      | "amount"
      | "utr"
      | "status"
      | "totalAmount"
      | "settledAt"
      | "bankName";
  const sortOrder = str(params, "sortOrder") === "asc" ? "asc" : "desc";

  const response = await apiClient.get("/deposit/export", {
    params: {
      view,
      page,
      pageSize: limit,
      sortBy,
      sortOrder,
      search: toOptionalParam(str(params, "q")) || undefined,
      utr: toOptionalParam(str(params, "utr")),
      utr_op: toOptionalParam(str(params, "utr_op")),
      bankName: toOptionalParam(str(params, "bankName")),
      bankName_op: toOptionalParam(str(params, "bankName_op")),
      bankId: toOptionalParam(str(params, "bankId")),
      status: toOptionalParam(str(params, "status")),
      amount: toOptionalParam(str(params, "amount")),
      amount_to: toOptionalParam(str(params, "amount_to")),
      amount_op: toOptionalParam(str(params, "amount_op")),
      totalAmount: toOptionalParam(str(params, "totalAmount")),
      totalAmount_to: toOptionalParam(str(params, "totalAmount_to")),
      totalAmount_op: toOptionalParam(str(params, "totalAmount_op")),
      player: toOptionalParam(str(params, "player")),
      createdBy: toOptionalParam(str(params, "createdBy")),
      createdAt_from: toOptionalParam(str(params, "createdAt_from")),
      createdAt_to: toOptionalParam(str(params, "createdAt_to")),
      createdAt_op: toOptionalParam(str(params, "createdAt_op")),
    },
    responseType: "blob",
  });
  return response.data as Blob;
}

export async function exchangeActionApprove(depositId: string, playerId: string, bonusAmount: number) {
  const response = await apiClient.post<{ success: boolean; data: unknown }>(
    `/deposit/${depositId}/exchange-action`,
    { action: "approve", playerId, bonusAmount },
  );
  return response.data?.data;
}

export async function exchangeActionReject(depositId: string, remark: string) {
  const response = await apiClient.post<{ success: boolean; data: unknown }>(
    `/deposit/${depositId}/exchange-action`,
    { action: "reject", remark },
  );
  return response.data?.data;
}
