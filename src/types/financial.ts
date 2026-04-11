export type { BankRow } from "./bank";

export type { DepositRow } from "./deposit";

export type WithdrawalRow = {
  _id: string;
  playerName: string;
  bankName: string;
  amount: number;
  stage: "exchange" | "banker" | "final";
  status: "requested" | "approved" | "rejected" | "finalized";
  createdAt: string;
};

export type AuditRow = {
  _id: string;
  action: string;
  entity: string;
  entityId?: string;
  requestId?: string;
  createdAt: string;
};
