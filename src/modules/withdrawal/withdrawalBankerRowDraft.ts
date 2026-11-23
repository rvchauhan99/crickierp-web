import type { WithdrawalRow } from "@/types/withdrawal";

export type BankerRowDraft = {
  utr: string;
  narration: string;
  payoutSettlementType: "bank" | "person";
  bankId: string;
  bankLabel?: string;
  liabilityPersonId: string;
  liabilityPersonLabel?: string;
};

/** Prefill bank only when the row already has a payout bank (e.g. import). Never invent a default. */
export function seedBankerRowDraft(row: WithdrawalRow): BankerRowDraft {
  const mode: "bank" | "person" =
    row.payoutSettlementType === "person" || Boolean(row.payoutLiabilityPersonId?.trim())
      ? "person"
      : "bank";

  if (mode === "person") {
    return {
      utr: row.utr?.trim() || "",
      narration: row.narration?.trim() || "",
      payoutSettlementType: "person",
      bankId: "",
      bankLabel: undefined,
      liabilityPersonId: row.payoutLiabilityPersonId?.trim() || "",
      liabilityPersonLabel: row.payoutLiabilityPersonName?.trim() || undefined,
    };
  }

  const fromRowBank = row.payoutBankId?.trim() || "";
  return {
    utr: row.utr?.trim() || "",
    narration: row.narration?.trim() || "",
    payoutSettlementType: "bank",
    bankId: fromRowBank,
    bankLabel: fromRowBank
      ? row.payoutBankName?.trim() || row.payoutBankAccountNumber?.trim() || fromRowBank
      : undefined,
    liabilityPersonId: "",
    liabilityPersonLabel: undefined,
  };
}
