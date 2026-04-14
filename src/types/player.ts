export type PlayerRow = {
  _id: string;
  id?: string;
  exchange: string | { _id?: string; name?: string; provider?: string };
  playerId: string;
  phone: string;
  regularBonusPercentage: number;
  firstDepositBonusPercentage: number;
  bonusPercentage?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: unknown;
  createdByName?: string;
  updatedBy?: unknown;
};

export type PlayerCreateInput = {
  exchangeId: string;
  playerId: string;
  phone: string;
  regularBonusPercentage: number;
  firstDepositBonusPercentage: number;
};

export type PlayerUpdateInput = {
  phone: string;
  regularBonusPercentage: number;
  firstDepositBonusPercentage: number;
};

export type PlayerDetail = Pick<
  PlayerRow,
  "exchange" | "playerId" | "phone" | "regularBonusPercentage" | "firstDepositBonusPercentage" | "bonusPercentage"
>;

export type PlayerImportResult = {
  created: number;
  updated: number;
  skipped: number;
};
