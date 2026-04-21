import { apiClient } from "./apiClient";

export type LookupBankOption = {
  id: string;
  label: string;
  holderName: string;
  bankName: string;
  accountNumber: string;
};

export type LookupExpenseTypeOption = {
  id: string;
  label: string;
  name: string;
  code?: string;
  description?: string;
};

export type LookupPlayerOption = {
  id: string;
  label: string;
  playerId: string;
  phone: string;
  exchangeId?: string;
  exchangeName: string;
  exchangeProvider: string;
};

export type LookupPlayerBonusProfile = {
  id: string;
  playerId: string;
  regularBonusPercentage: number;
  firstDepositBonusPercentage: number;
};

export type LookupExchangeOption = {
  id: string;
  label: string;
  name: string;
  provider: string;
  status: string;
};

type LookupListParams = {
  q?: string;
  limit?: number;
};

function normalizeQueryParams(params?: LookupListParams): Required<LookupListParams> {
  return {
    q: params?.q?.trim() || "",
    limit: Number(params?.limit) > 0 ? Number(params?.limit) : 20,
  };
}

export async function listBankLookupOptions(params?: LookupListParams): Promise<LookupBankOption[]> {
  const query = normalizeQueryParams(params);
  const res = await apiClient.get<{ success: boolean; data: LookupBankOption[] }>("/lookup/banks", {
    params: { q: query.q || undefined, limit: query.limit },
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function listExpenseTypeLookupOptions(
  params?: LookupListParams,
): Promise<LookupExpenseTypeOption[]> {
  const query = normalizeQueryParams(params);
  const res = await apiClient.get<{ success: boolean; data: LookupExpenseTypeOption[] }>(
    "/lookup/expense-types",
    {
      params: { q: query.q || undefined, limit: query.limit },
    },
  );
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function listPlayerLookupOptions(params?: LookupListParams): Promise<LookupPlayerOption[]> {
  const query = normalizeQueryParams(params);
  const res = await apiClient.get<{ success: boolean; data: LookupPlayerOption[] }>("/lookup/players", {
    params: { q: query.q || undefined, limit: query.limit },
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function listExchangeLookupOptions(
  params?: LookupListParams,
): Promise<LookupExchangeOption[]> {
  const query = normalizeQueryParams(params);
  const res = await apiClient.get<{ success: boolean; data: LookupExchangeOption[] }>(
    "/lookup/exchanges",
    {
      params: { q: query.q || undefined, limit: query.limit },
    },
  );
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function getPlayerBonusProfile(
  playerId: string,
): Promise<LookupPlayerBonusProfile> {
  const res = await apiClient.get<{ success: boolean; data: LookupPlayerBonusProfile }>(
    `/lookup/players/${encodeURIComponent(playerId)}/bonus-profile`,
  );
  return (
    res.data?.data ?? {
      id: playerId,
      playerId: "",
      regularBonusPercentage: 0,
      firstDepositBonusPercentage: 0,
    }
  );
}

