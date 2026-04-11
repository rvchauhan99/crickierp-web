import { apiClient } from "./apiClient";
import { createBank as createBankAccount, listBanksRaw } from "./bankService";
import { createDeposit as createDepositApi } from "./depositService";
import type { BankCreateInput } from "@/types/bank";
import type { DepositCreateInput } from "@/types/deposit";

export type BankPayload = BankCreateInput;

export type DepositPayload = DepositCreateInput;

export type WithdrawalPayload = {
  playerName: string;
  bankName: string;
  utr?: string;
  amount: number;
  stage: "exchange" | "banker" | "final";
};

export const financialService = {
  createBank: async (payload: BankPayload) => {
    const data = await createBankAccount(payload);
    return { success: true, data };
  },
  listBanks: listBanksRaw,
  createDeposit: async (payload: DepositPayload) => {
    const data = await createDepositApi(payload);
    return { success: true, data };
  },
  createWithdrawal: async (payload: WithdrawalPayload) => (await apiClient.post("/withdrawal", payload)).data,
  listWithdrawals: async (stage: "exchange" | "banker" | "final", page = 1, limit = 20) =>
    (await apiClient.get("/withdrawal", { params: { stage, page, limit } })).data,
  updateWithdrawalStatus: async (id: string, status: string) =>
    (await apiClient.patch(`/withdrawal/${id}/status`, { status })).data,
};
