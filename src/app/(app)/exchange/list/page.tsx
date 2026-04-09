import { listExchanges } from "@/services/exchangeService";
import { ExchangeListView } from "@/modules/exchange/components/ExchangeListView";

export default async function ExchangeListPage() {
  const rows = await listExchanges();

  return <ExchangeListView rows={rows} />;
}
