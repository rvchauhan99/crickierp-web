export type ExchangeStatus = "active" | "deactive";

export type Exchange = {
  id: string;
  _id?: string;
  name: string;
  openingBalance: number;
  currentBalance?: number;
  bonus: number;
  provider: string;
  status: ExchangeStatus;
  version?: number;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ExchangeCreateInput = Pick<
  Exchange,
  "name" | "openingBalance" | "bonus" | "provider" | "status"
>;

export type ExchangeListParams = {
  q?: string;
  search?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "name" | "provider";
  sortOrder?: "asc" | "desc";
  name?: string;
  nameOp?: string;
  provider?: string;
  providerOp?: string;
  status?: ExchangeStatus;
  createdBy?: string;
  updatedBy?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  createdAtOp?: string;
  openingBalance?: string;
  openingBalanceTo?: string;
  openingBalanceOp?: string;
  currentBalance?: string;
  currentBalanceTo?: string;
  currentBalanceOp?: string;
  bonus?: string;
  bonusTo?: string;
  bonusOp?: string;
};

export type ExchangeListResult = {
  items: Exchange[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ExchangeStatementEntryType = "all" | "deposit" | "withdrawal" | "topup";

export type ExchangeStatementRow = {
  kind: "deposit" | "withdrawal" | "topup";
  refId: string;
  at: string;
  label: string;
  playerId: string;
  amount: number;
  direction: "credit" | "debit";
  balanceAfter: number;
  bonusMemo?: number;
  utr?: string;
  remark?: string;
  createdByName?: string;
};

export type ExchangeStatementResponse = {
  exchange: {
    _id: string;
    name: string;
    provider: string;
    openingBalance: number;
    currentBalance?: number;
  };
  periodOpeningBalance: number;
  periodClosingBalance: number;
  totalCredits: number;
  totalDebits: number;
  totalDepositOutflow: number;
  totalWithdrawalInflow: number;
  totalTopUpCredits: number;
  rows: ExchangeStatementRow[];
};

export type ExchangeTopupRow = {
  _id: string;
  exchangeId: {
    _id: string;
    name: string;
    provider: string;
    currentBalance?: number;
    openingBalance?: number;
  };
  amount: number;
  remark?: string;
  createdBy: {
    _id: string;
    fullName?: string;
    username?: string;
  } | string;
  createdAt: string;
  updatedAt?: string;
};
