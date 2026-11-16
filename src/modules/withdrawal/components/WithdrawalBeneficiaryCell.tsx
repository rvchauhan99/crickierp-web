"use client";

import type { MouseEvent } from "react";
import { IconCopy } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  copyWithdrawalBeneficiaryDetails,
  type WithdrawalBeneficiaryFields,
} from "@/modules/withdrawal/withdrawalBeneficiary";

type Props = {
  row: WithdrawalBeneficiaryFields;
  /** Stop row-click selection when copying from a list. */
  stopPropagation?: boolean;
};

export function WithdrawalBeneficiaryCell({ row, stopPropagation = true }: Props) {
  const holder = String(row.accountHolderName ?? "").trim() || "—";
  const account = String(row.accountNumber ?? "").trim() || "—";
  const ifsc = String(row.ifsc ?? "").trim().toUpperCase() || "—";

  const onCopy = async (event: MouseEvent) => {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }
    const ok = await copyWithdrawalBeneficiaryDetails(row);
    if (ok) toast.success("Bank details copied");
    else toast.error("Could not copy bank details");
  };

  return (
    <div className="flex items-start gap-1.5 text-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-gray-900">{holder}</div>
        <div className="truncate font-mono text-xs text-gray-800">{account}</div>
        <div className="truncate text-xs uppercase tracking-wide text-gray-500">{ifsc}</div>
      </div>
      <button
        type="button"
        tabIndex={-1}
        onClick={onCopy}
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="Copy bank details"
        title="Copy bank details"
      >
        <IconCopy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
