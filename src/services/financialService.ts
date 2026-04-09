import { apiClient } from "./apiClient";

export type BankPayload = {
  holderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  openingBalance: number;
  status: "active" | "deactive";
};

export type DepositPayload = {
  bankName: string;
  utr: string;
  amount: number;
  stage: "banker" | "exchange" | "final";
};

export type WithdrawalPayload = {
  playerName: string;
  bankName: string;
  utr?: string;
  amount: number;
  stage: "exchange" | "banker" | "final";
};

export const financialService = {
  createBank: async (payload: BankPayload) => (await apiClient.post("/bank", payload)).data,
  listBanks: async () => (await apiClient.get("/bank")).data,
  createDeposit: async (payload: DepositPayload) => (await apiClient.post("/deposit", payload)).data,
  listDeposits: async (stage: "banker" | "exchange" | "final") =>
    (await apiClient.get("/deposit", { params: { stage } })).data,
  updateDepositStatus: async (id: string, status: string) =>
    (await apiClient.patch(`/deposit/${id}/status`, { status })).data,
  createWithdrawal: async (payload: WithdrawalPayload) => (await apiClient.post("/withdrawal", payload)).data,
  listWithdrawals: async (stage: "exchange" | "banker" | "final") =>
    (await apiClient.get("/withdrawal", { params: { stage } })).data,
  updateWithdrawalStatus: async (id: string, status: string) =>
    (await apiClient.patch(`/withdrawal/${id}/status`, { status })).data,
};
