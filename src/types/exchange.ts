export type ExchangeStatus = "active" | "deactive";

export type Exchange = {
  id: string;
  name: string;
  openingBalance: number;
  bonus: number;
  provider: string;
  status: ExchangeStatus;
};

export type ExchangeCreateInput = Omit<Exchange, "id">;
