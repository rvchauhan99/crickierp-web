export type ExpenseStatus = "pending_audit" | "approved" | "rejected";

export type ExpenseTypeOption = {
  _id: string;
  name: string;
  code?: string;
  description?: string;
};

export type ExpenseRow = {
  _id: string;
  id: string;
  expenseTypeId?: string;
  expenseTypeName?: string;
  amount: number;
  expenseDate?: string;
  description?: string;
  bankId?: string;
  bankName: string;
  status: ExpenseStatus;
  rejectReason?: string;
  bankBalanceAfter?: number;
  createdAt?: string;
  updatedAt?: string;
  createdByName?: string;
  approvedByName?: string;
  createdBy?: string;
  approvedBy?: string;
};

export type ExpenseCreateInput = {
  expenseTypeId: string;
  amount: number;
  expenseDate: string;
  description?: string;
  bankId?: string;
};

export type ExpenseUpdateInput = {
  expenseTypeId?: string;
  amount?: number;
  expenseDate?: string;
  description?: string;
  bankId?: string | null;
};
