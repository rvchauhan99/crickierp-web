import type { AutocompleteOption } from "@/components/common/AutocompleteField";
import type { WithdrawalRow } from "@/types/withdrawal";

export type BankerRowDraft = {
  utr: string;
  payoutSettlementType: "bank" | "person";
  bankId: string;
  bankLabel?: string;
  liabilityPersonId: string;
  liabilityPersonLabel?: string;
};

export function seedBankerRowDraft(
  row: WithdrawalRow,
  defaultBank: AutocompleteOption | null,
): BankerRowDraft {
  const mode: "bank" | "person" =
    row.payoutSettlementType === "person" || Boolean(row.payoutLiabilityPersonId?.trim())
      ? "person"
      : "bank";

  if (mode === "person") {
    return {
      utr: row.utr?.trim() || "",
      payoutSettlementType: "person",
      bankId: "",
      bankLabel: undefined,
      liabilityPersonId: row.payoutLiabilityPersonId?.trim() || "",
      liabilityPersonLabel: row.payoutLiabilityPersonName?.trim() || undefined,
    };
  }

  const fromRowBank = row.payoutBankId?.trim() || "";
  const resolvedBankId = fromRowBank || defaultBank?.value || "";
  const bankLabel = fromRowBank
    ? row.payoutBankName?.trim() || row.payoutBankAccountNumber?.trim() || fromRowBank
    : defaultBank?.label;

  return {
    utr: row.utr?.trim() || "",
    payoutSettlementType: "bank",
    bankId: resolvedBankId,
    bankLabel,
    liabilityPersonId: "",
    liabilityPersonLabel: undefined,
  };
}
