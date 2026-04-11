export type PlayerRow = {
  _id: string;
  id?: string;
  exchange: string | { _id?: string; name?: string; provider?: string };
  playerId: string;
  phone: string;
  bonusPercentage: number;
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
  bonusPercentage: number;
};

export type PlayerImportResult = {
  created: number;
  skipped: number;
};
