import { apiClient } from "@/services/apiClient";
import { Exchange, ExchangeCreateInput } from "@/types/exchange";

const mockRows: Exchange[] = [
  {
    id: "EX-101",
    name: "E2E",
    openingBalance: 300,
    bonus: 0,
    provider: "Provider A",
    status: "active",
  },
];

export async function listExchanges(): Promise<Exchange[]> {
  try {
    const response = await apiClient.get("/exchange");
    return response.data?.data ?? [];
  } catch {
    return mockRows;
  }
}

export async function createExchange(input: ExchangeCreateInput): Promise<Exchange> {
  try {
    const response = await apiClient.post("/exchange", input);
    return response.data?.data;
  } catch {
    return {
      id: `EX-${Math.floor(Math.random() * 10000)}`,
      ...input,
    };
  }
}
