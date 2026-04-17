export type DepositView = "banker" | "exchange" | "final";

export type DepositStatus = "pending" | "verified" | "rejected" | "finalized";

export type DepositCreateInput = {
  bankId: string;
  utr: string;
  amount: number;
  entryAt?: string;
};

export type DepositAmendmentSnapshot = {
  bankId?: string;
  bankName?: string;
  utr?: string;
  amount?: number;
  playerId?: string;
  bonusAmount?: number;
  totalAmount?: number;
};

export type DepositAmendmentEntry = {
  at: string;
  by?: unknown;
  reason: string;
  old: DepositAmendmentSnapshot;
  new: DepositAmendmentSnapshot;
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
  /** MongoDB ObjectId string for API (from populated `player`). */
  playerMongoId?: string;
  playerIdLabel?: string;
  bonusAmount?: number;
  totalAmount?: number;
  rejectReason?: string;
  exchangeActionBy?: unknown;
  exchangeActionByName?: string;
  exchangeActionAt?: string;
  bankBalanceAfter?: number;
  entryAt?: string;
  settledAt?: string;
  amendmentCount?: number;
  lastAmendedAt?: string;
  lastAmendedBy?: unknown;
  lastAmendedByName?: string;
  amendmentHistory?: DepositAmendmentEntry[];
};

export type DepositAmendInput = {
  bankId: string;
  utr: string;
  amount: number;
  playerId: string;
  bonusAmount: number;
  entryAt?: string;
  reasonId: string;
  remark?: string;
};
