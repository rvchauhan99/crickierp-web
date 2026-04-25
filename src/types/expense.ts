export type ExpenseStatus = "pending_audit" | "approved" | "rejected";

export type ExpenseTypeOption = {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  requiresAudit?: boolean;
};

export type ExpenseDocumentMeta = {
  path: string;
  filename: string;
  size: number;
  mime_type: string;
  uploaded_at: string;
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
  settlementAccountType?: "bank" | "person";
  liabilityPersonId?: string;
  liabilityPersonName?: string;
  liabilityEntryId?: string;
  status: ExpenseStatus;
  rejectReason?: string;
  bankBalanceAfter?: number;
  createdAt?: string;
  updatedAt?: string;
  createdByName?: string;
  approvedByName?: string;
  createdBy?: string;
  approvedBy?: string;
  documents?: ExpenseDocumentMeta[];
};

export type ExpenseApproveInput =
  | { settlementAccountType: "bank"; bankId: string }
  | { settlementAccountType: "person"; liabilityPersonId: string };

export type ExpenseCreateInput = {
  expenseTypeId: string;
  amount: number;
  expenseDate: string;
  description?: string;
  bankId?: string;
  liabilityPersonId?: string;
};

export type ExpenseUpdateInput = {
  expenseTypeId?: string;
  amount?: number;
  expenseDate?: string;
  description?: string;
  bankId?: string | null;
};
