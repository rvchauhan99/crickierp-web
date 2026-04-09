export type BankRow = {
  _id: string;
  holderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  openingBalance: number;
  status: "active" | "deactive";
};

export type DepositRow = {
  _id: string;
  bankName: string;
  utr: string;
  amount: number;
  stage: "banker" | "exchange" | "final";
  status: "pending" | "verified" | "finalized" | "rejected";
};

export type WithdrawalRow = {
  _id: string;
  playerName: string;
  bankName: string;
  amount: number;
  stage: "exchange" | "banker" | "final";
  status: "requested" | "approved" | "rejected" | "finalized";
};

export type AuditRow = {
  _id: string;
  action: string;
  entity: string;
  entityId?: string;
  requestId?: string;
  createdAt: string;
};
