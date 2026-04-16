import { apiClient } from "./apiClient";
import type { WithdrawalCreateInput, WithdrawalRow, WithdrawalView, SavedWithdrawalAccount } from "@/types/withdrawal";

function toOptionalParam(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

type UserLike = {
  _id?: unknown;
  id?: unknown;
  fullName?: unknown;
  username?: unknown;
};

function parseUserRef(user: unknown): { id?: string; label?: string } {
  if (!user) return {};
  if (typeof user === "string") return { id: user };
  if (typeof user !== "object") return {};

  const row = user as UserLike;
  const idRaw = row._id ?? row.id;
  const id = idRaw != null ? String(idRaw).trim() : undefined;
  const fullName = row.fullName != null ? String(row.fullName).trim() : "";
  const username = row.username != null ? String(row.username).trim() : "";
  const label = fullName && username ? `${fullName} (${username})` : fullName || username || undefined;
  return { id, label };
}

function normalizeWithdrawal(row: Record<string, unknown>): WithdrawalRow {
  const id = String(row._id ?? row.id ?? "");
  const st = row.status;
  const status: WithdrawalRow["status"] =
    st === "requested" || st === "approved" || st === "rejected" || st === "finalized" ? st : "requested";
  const createdByRef = parseUserRef(row.createdBy);
  const approvedByRef = parseUserRef(row.approvedBy);

  return {
    _id: id,
    id,
    playerName: String(row.playerName ?? ""),
    player: row.player,
    accountNumber: row.accountNumber != null ? String(row.accountNumber) : undefined,
    accountHolderName: row.accountHolderName != null ? String(row.accountHolderName) : undefined,
    bankName: String(row.bankName ?? ""),
    ifsc: row.ifsc != null ? String(row.ifsc) : undefined,
    amount: Number(row.amount ?? 0),
    reverseBonus: row.reverseBonus != null ? Number(row.reverseBonus) : undefined,
    payableAmount: row.payableAmount != null ? Number(row.payableAmount) : undefined,
    payoutBankId:
      row.payoutBankId != null && typeof row.payoutBankId === "object" && "_id" in (row.payoutBankId as object)
        ? String((row.payoutBankId as { _id?: unknown })._id)
        : typeof row.payoutBankId === "string"
          ? row.payoutBankId
          : undefined,
    payoutBankName: row.payoutBankName != null ? String(row.payoutBankName) : undefined,
    utr: row.utr != null ? String(row.utr) : undefined,
    status,
    createdAt: row.createdAt != null ? String(row.createdAt) : undefined,
    updatedAt: row.updatedAt != null ? String(row.updatedAt) : undefined,
    createdBy: createdByRef.id,
    createdByName:
      row.createdByName != null ? String(row.createdByName) : createdByRef.label,
    approvedBy: approvedByRef.id,
    approvedByName:
      row.approvedByName != null ? String(row.approvedByName) : approvedByRef.label,
  };
}

function str(params: Record<string, unknown>, key: string): string {
  const v = params[key];
  if (v === undefined || v === null) return "";
  return String(v);
}

export async function createWithdrawal(input: WithdrawalCreateInput): Promise<unknown> {
  const response = await apiClient.post<{ success: boolean; data: unknown }>("/withdrawal", input);
  return response.data?.data;
}

export async function updateWithdrawal(id: string, input: Partial<WithdrawalCreateInput>): Promise<unknown> {
  const response = await apiClient.patch<{ success: boolean; data: unknown }>(`/withdrawal/${id}`, input);
  return response.data?.data;
}

export async function exportWithdrawals(params: Record<string, unknown>): Promise<Blob> {
  const response = await apiClient.get("/withdrawal/export", {
    params,
    responseType: "blob",
  });
  return response.data;
}

export type LastBankerPayoutMeta = { bankId: string; bankName: string } | null | undefined;

export async function listWithdrawalsNormalized(
  view: WithdrawalView,
  params: Record<string, unknown>,
): Promise<{
  data: WithdrawalRow[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    lastBankerPayout?: LastBankerPayoutMeta;
  };
}> {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const sortBy =
    (str(params, "sortBy") || "createdAt") as
      | "createdAt"
      | "amount"
      | "payableAmount"
      | "status"
      | "playerName"
      | "bankName"
      | "utr";
  const sortOrder = str(params, "sortOrder") === "asc" ? "asc" : "desc";

  const response = await apiClient.get<{
    success: boolean;
    data: Record<string, unknown>[];
    meta: {
      total: number;
      page: number;
      pageSize: number;
      lastBankerPayout?: LastBankerPayoutMeta;
    };
  }>("/withdrawal", {
    params: {
      view,
      page,
      pageSize: limit,
      sortBy,
      sortOrder,
      search: toOptionalParam(str(params, "q")) || undefined,
      status: toOptionalParam(str(params, "status")),
      playerName: toOptionalParam(str(params, "playerName")),
      playerName_op: toOptionalParam(str(params, "playerName_op")),
      utr: toOptionalParam(str(params, "utr")),
      utr_op: toOptionalParam(str(params, "utr_op")),
      bankName: toOptionalParam(str(params, "bankName")),
      bankName_op: toOptionalParam(str(params, "bankName_op")),
      amount: toOptionalParam(str(params, "amount")),
      amount_to: toOptionalParam(str(params, "amount_to")),
      amount_op: toOptionalParam(str(params, "amount_op")),
      payableAmount: toOptionalParam(str(params, "payableAmount")),
      payableAmount_to: toOptionalParam(str(params, "payableAmount_to")),
      payableAmount_op: toOptionalParam(str(params, "payableAmount_op")),
      createdAt_from: toOptionalParam(str(params, "createdAt_from")),
      createdAt_to: toOptionalParam(str(params, "createdAt_to")),
      createdAt_op: toOptionalParam(str(params, "createdAt_op")),
      createdBy: toOptionalParam(str(params, "createdBy")),
      approvedBy: toOptionalParam(str(params, "approvedBy")),
    },
  });

  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  const meta = response.data?.meta;
  const lastBankerPayout = meta?.lastBankerPayout;
  return {
    data: rows.map((row) => normalizeWithdrawal(row)),
    meta: {
      total: Number(meta?.total ?? 0),
      page: Number(meta?.page ?? page),
      pageSize: Number(meta?.pageSize ?? limit),
      ...(view === "banker" ? { lastBankerPayout } : {}),
    },
  };
}

export async function updateWithdrawalBankerPayout(id: string, body: { bankId: string; utr: string }): Promise<unknown> {
  const response = await apiClient.patch<{ success: boolean; data: unknown }>(`/withdrawal/${id}/banker-payout`, body);
  return response.data?.data;
}

export async function patchWithdrawalStatus(
  id: string,
  body:
    | { status: "rejected"; reasonId: string; remark?: string }
    | { status: "finalized" },
): Promise<unknown> {
  const response = await apiClient.patch<{ success: boolean; data: unknown }>(`/withdrawal/${id}/status`, body);
  return response.data?.data;
}

export async function listSavedAccountsForPlayer(playerId: string): Promise<SavedWithdrawalAccount[]> {
  const response = await apiClient.get<{ success: boolean; data: SavedWithdrawalAccount[] }>(
    `/withdrawal/player/${playerId}/saved-accounts`,
  );
  const data = response.data?.data;
  return Array.isArray(data) ? data : [];
}
