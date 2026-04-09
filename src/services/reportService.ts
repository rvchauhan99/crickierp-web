import { apiClient } from "./apiClient";

export const reportService = {
  dashboardSummary: async (params?: { fromDate?: string; toDate?: string }) => {
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
};
