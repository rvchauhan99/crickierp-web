export type WithdrawalBeneficiaryFields = {
  accountHolderName?: string | null;
  accountNumber?: string | null;
  ifsc?: string | null;
};

export function formatWithdrawalBeneficiaryCopy(row: WithdrawalBeneficiaryFields): string {
  const holder = String(row.accountHolderName ?? "").trim() || "—";
  const account = String(row.accountNumber ?? "").trim() || "—";
  const ifsc = String(row.ifsc ?? "").trim().toUpperCase() || "—";
  return `Holder: ${holder}\nAccount: ${account}\nIFSC: ${ifsc}`;
}

export async function copyWithdrawalBeneficiaryDetails(
  row: WithdrawalBeneficiaryFields,
): Promise<boolean> {
  const text = formatWithdrawalBeneficiaryCopy(row);
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
