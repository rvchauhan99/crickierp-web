export type BankStatus = "active" | "deactive";

export type BankCreateInput = {
  holderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  openingBalance: number;
  status: BankStatus;
};

export type BankRow = {
  _id: string;
  id: string;
  holderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  openingBalance: number;
  currentBalance?: number;
  status: BankStatus;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: unknown;
  createdByName?: string;
};
