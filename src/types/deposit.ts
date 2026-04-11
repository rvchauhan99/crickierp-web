export type DepositView = "banker" | "exchange" | "final";

export type DepositStatus = "pending" | "verified" | "rejected" | "finalized";

export type DepositCreateInput = {
  bankId: string;
  utr: string;
  amount: number;
};

export type DepositRow = {
  _id: string;
  id: string;
  bankId?: string;
  bankName: string;
  utr: string;
  amount: number;
  status: DepositStatus;
  stage?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: unknown;
  createdByName?: string;
  bankId_populated?: unknown;
  player?: unknown;
  playerIdLabel?: string;
  bonusAmount?: number;
  totalAmount?: number;
  rejectReason?: string;
  exchangeActionBy?: unknown;
  exchangeActionByName?: string;
  exchangeActionAt?: string;
  bankBalanceAfter?: number;
  settledAt?: string;
};
