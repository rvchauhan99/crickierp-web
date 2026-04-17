export type LiabilityPersonRow = {
  _id: string;
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  isActive: boolean;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  createdAt?: string;
  updatedAt?: string;
  createdByName?: string;
  updatedByName?: string;
};

export type LiabilityEntryType = "receipt" | "payment" | "contra" | "journal";
export type LiabilityAccountType = "bank" | "person" | "expense";

export type LiabilityEntryRow = {
  _id: string;
  id: string;
  entryDate?: string;
  entryType: LiabilityEntryType;
  amount: number;
  fromAccountType: LiabilityAccountType;
  fromAccountId: string;
  fromAccountName?: string;
  toAccountType: LiabilityAccountType;
  toAccountId: string;
  toAccountName?: string;
  sourceType?: "expense";
  sourceExpenseId?: string;
  referenceNo?: string;
  remark?: string;
  createdAt?: string;
  createdByName?: string;
};

export type LiabilityPersonCreateInput = {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  openingBalance?: number;
  isActive?: boolean;
};

export type LiabilityPersonUpdateInput = Partial<LiabilityPersonCreateInput>;

export type LiabilityEntryCreateInput = {
  entryDate: string;
  entryType: LiabilityEntryType;
  amount: number;
  fromAccountType: LiabilityAccountType;
  fromAccountId: string;
  toAccountType: LiabilityAccountType;
  toAccountId: string;
  referenceNo?: string;
  remark?: string;
};

export type LiabilityLedgerRow = {
  _id: string;
  at: string;
  entryType: string;
  from: string;
  to: string;
  debit: number;
  credit: number;
  runningBalance: number;
  referenceNo?: string;
  remark?: string;
};

export type LiabilityLedgerResponse = {
  person: {
    _id: string;
    name: string;
    openingBalance: number;
  };
  rows: LiabilityLedgerRow[];
  closingBalance: number;
};

export type LiabilitySummaryReport = {
  totalReceivable: number;
  totalPayable: number;
  netPosition: number;
  totalPersons: number;
};

export type LiabilityPersonWiseReportRow = {
  personId: string;
  name: string;
  isActive: boolean;
  balance: number;
  totalCredits?: number;
  totalDebits?: number;
  side: "receivable" | "payable";
};
