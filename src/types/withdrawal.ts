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
  requestedAt?: string;
};

export type WithdrawalAmendmentSnapshot = {
  amount?: number;
  reverseBonus?: number;
  payableAmount?: number;
  payoutBankId?: string;
  payoutBankName?: string;
  utr?: string;
};

export type WithdrawalAmendmentEntry = {
  at: string;
  by?: unknown;
  reason: string;
  old: WithdrawalAmendmentSnapshot;
  new: WithdrawalAmendmentSnapshot;
};

export type WithdrawalAmendInput = {
  amount: number;
  reverseBonus: number;
  payoutBankId: string;
  utr: string;
  requestedAt?: string;
  reasonId: string;
  remark?: string;
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
  requestedAt?: string;
  status: WithdrawalStatus;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  amendmentCount?: number;
  lastAmendedAt?: string;
  lastAmendedBy?: unknown;
  lastAmendedByName?: string;
  amendmentHistory?: WithdrawalAmendmentEntry[];
};

export type SavedWithdrawalAccount = {
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifsc: string;
};
