export type WithdrawalView = "exchange" | "banker" | "final";

export type WithdrawalStatus = "requested" | "approved" | "rejected" | "finalized";

export type WithdrawalCreateInput = {
  playerId: string;
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifsc: string;
  amount: number;
  reverseBonus?: number;
};

export type WithdrawalRow = {
  _id: string;
  id: string;
  playerName: string;
  player?: unknown;
  accountNumber?: string;
  accountHolderName?: string;
  bankName: string;
  ifsc?: string;
  amount: number;
  reverseBonus?: number;
  payableAmount?: number;
  payoutBankId?: string;
  payoutBankName?: string;
  utr?: string;
  status: WithdrawalStatus;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
  approvedBy?: string;
  approvedByName?: string;
};

export type SavedWithdrawalAccount = {
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifsc: string;
};
