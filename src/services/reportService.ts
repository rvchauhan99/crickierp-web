import { apiClient } from "./apiClient";

export const reportService = {
  dashboardSummary: async (params?: {
    fromDate?: string;
    toDate?: string;
    exchangeId?: string;
    status?: string;
    transactionType?: string;
    playerId?: string;
    bankId?: string;
    amountFrom?: string;
    amountTo?: string;
    search?: string;
  }) => {
    const res = await apiClient.get("/reports/dashboard-summary", { params });
    return res.data;
  },
  transactionHistory: async (params?: Record<string, unknown>) => {
    const res = await apiClient.get("/reports/transaction-history", { params });
    return res.data;
  },
  userHistory: async (params?: Record<string, unknown>) => {
    const res = await apiClient.get("/history", { params });
    return res.data;
  },
  /** Entity dropdown options for Transaction History (requires `reports.transaction_history`). */
  transactionHistoryEntities: async () => {
    const res = await apiClient.get("/reports/audit-entities");
    return res.data as { success?: boolean; data?: string[] };
  },

  exportDashboardSummary: async (params?: Record<string, unknown>) => {
    const res = await apiClient.get("/reports/dashboard-summary/export", {
      params,
      responseType: "blob",
    });
    return res.data;
  },

  expenseAnalysisSummary: async (params?: Record<string, unknown>) => {
    const res = await apiClient.get("/reports/expense-analysis/summary", { params });
    return res.data;
  },

  expenseAnalysisRecords: async (params?: Record<string, unknown>) => {
    const res = await apiClient.get("/reports/expense-analysis/records", { params });
    return res.data;
  },

  exportExpenseAnalysis: async (params?: Record<string, unknown>) => {
    const res = await apiClient.get("/reports/expense-analysis/export", {
      params,
      responseType: "blob",
    });
    return res.data;
  },

  exportTransactionHistory: async (params?: Record<string, unknown>) => {
    const res = await apiClient.get("/reports/transaction-history/export", {
      params,
      responseType: "blob",
    });
    return res.data;
  },
};
