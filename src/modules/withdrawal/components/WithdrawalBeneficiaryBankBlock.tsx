"use client";

import { IconCopy } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  copyWithdrawalBeneficiaryDetails,
  type WithdrawalBeneficiaryFields,
} from "@/modules/withdrawal/withdrawalBeneficiary";

type Props = {
  row: WithdrawalBeneficiaryFields;
  title?: string;
};

export function WithdrawalBeneficiaryBankBlock({ row, title = "Beneficiary bank" }: Props) {
  const holder = String(row.accountHolderName ?? "").trim() || "—";
  const account = String(row.accountNumber ?? "").trim() || "—";
  const ifsc = String(row.ifsc ?? "").trim().toUpperCase() || "—";

  const onCopy = async () => {
    const ok = await copyWithdrawalBeneficiaryDetails(row);
    if (ok) toast.success("Bank details copied");
    else toast.error("Could not copy bank details");
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          startIcon={<IconCopy size={14} />}
          onClick={() => void onCopy()}
          skipTab
        >
          Copy
        </Button>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">Holder</dt>
          <dd className="max-w-[65%] text-right font-medium">{holder}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">Account</dt>
          <dd className="max-w-[65%] break-all text-right font-mono text-xs font-medium">{account}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-500">IFSC</dt>
          <dd className="max-w-[65%] text-right font-medium uppercase tracking-wide">{ifsc}</dd>
        </div>
      </dl>
    </div>
  );
}
