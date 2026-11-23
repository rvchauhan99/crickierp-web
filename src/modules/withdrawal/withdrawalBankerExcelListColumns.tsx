"use client";

import type { AutocompleteOption } from "@/components/common/AutocompleteField";
import type { PaginatedTableReferenceColumn } from "@/components/common/PaginatedTableReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { formatDateTimeForUser } from "@/lib/userTimezone";
import type { WithdrawalRow } from "@/types/withdrawal";

export type WithdrawalBankerExcelListColumnOptions = {
  liabilityModuleEnabled: boolean;
  formatWholeMoney: (n: number) => string;
  /** When set, Created By / Approved By / Status / Payable / Transaction At get Banker-style column filters. */
  withBankerFilters?: boolean;
  loadUserOptions?: (query: string) => Promise<AutocompleteOption[]>;
};

/**
 * Shared main list columns matching banker Excel export sequence/style.
 * Final view appends extras after this block; Banker wraps with bulkSelect + Actions.
 */
export function buildWithdrawalBankerExcelListColumns(
  options: WithdrawalBankerExcelListColumnOptions,
): PaginatedTableReferenceColumn[] {
  const { liabilityModuleEnabled, formatWholeMoney, withBankerFilters, loadUserOptions } = options;

  const cols: PaginatedTableReferenceColumn[] = [
    {
      field: "id",
      label: "Withdrawal ID",
      sortable: false,
      minWidth: 160,
      maxWidth: 220,
      render: (row: WithdrawalRow) => (
        <span className="font-mono text-xs break-all">{row.id || "—"}</span>
      ),
    },
    {
      field: "playerId",
      label: "Player ID",
      sortable: false,
      minWidth: 120,
      render: (row: WithdrawalRow) => row.playerId?.trim() || "—",
    },
    {
      field: "accountHolderName",
      label: "Account Holder",
      sortable: false,
      minWidth: 140,
      render: (row: WithdrawalRow) => row.accountHolderName?.trim() || "—",
    },
    {
      field: "accountNumber",
      label: "Account Number",
      sortable: false,
      minWidth: 140,
      render: (row: WithdrawalRow) => (
        <span className="font-mono text-xs">{row.accountNumber?.trim() || "—"}</span>
      ),
    },
    {
      field: "ifsc",
      label: "IFSC",
      sortable: false,
      minWidth: 110,
      render: (row: WithdrawalRow) => (
        <span className="font-mono text-xs uppercase">{row.ifsc?.trim() || "—"}</span>
      ),
    },
    {
      field: "payableAmount",
      label: "Payable Amount",
      render: (row: WithdrawalRow) =>
        row.payableAmount != null ? formatWholeMoney(row.payableAmount) : "—",
      sortable: true,
      minWidth: 120,
      ...(withBankerFilters
        ? {
            filterType: "number" as const,
            filterKey: "amount",
            filterKeyTo: "amount_to",
            operatorKey: "amount_op",
          }
        : {}),
    },
    {
      field: "status",
      label: "Status",
      ...tableColumnPresets.statusCol,
      render: (row: WithdrawalRow) => <TableStatusBadge status={row.status} />,
      sortable: true,
      ...(withBankerFilters
        ? {
            filterType: "select" as const,
            filterKey: "status",
            filterOptions: [
              { value: "requested", label: "Requested" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: "finalized", label: "Finalized" },
            ],
          }
        : {}),
    },
    {
      field: "utr",
      label: "UTR",
      sortable: true,
      minWidth: 140,
      render: (row: WithdrawalRow) => (
        <span className="font-mono text-xs">{row.utr?.trim() || "—"}</span>
      ),
      ...(withBankerFilters
        ? {
            filterType: "text" as const,
            filterKey: "utr",
            operatorKey: "utr_op",
          }
        : {}),
    },
    {
      field: "payoutBankAccountNumber",
      label: "Payout Bank",
      sortable: false,
      minWidth: 140,
      render: (row: WithdrawalRow) => (
        <span className="font-mono text-xs">{row.payoutBankAccountNumber?.trim() || "—"}</span>
      ),
    },
  ];

  if (liabilityModuleEnabled) {
    cols.push(
      {
        field: "payoutSettlementType",
        label: "Payout settlement",
        sortable: false,
        minWidth: 130,
        render: (row: WithdrawalRow) =>
          row.payoutSettlementType === "person" ? "Liability person" : "Bank",
      },
      {
        field: "payoutLiabilityPersonName",
        label: "Payout liable person",
        sortable: false,
        minWidth: 150,
        render: (row: WithdrawalRow) => row.payoutLiabilityPersonName?.trim() || "—",
      },
    );
  }

  cols.push(
    {
      field: "createdBy",
      label: "Created By",
      render: (row: WithdrawalRow) => row.createdByName || "—",
      minWidth: 150,
      sortable: false,
      ...(withBankerFilters && loadUserOptions
        ? {
            filterType: "autocomplete" as const,
            filterKey: "createdBy",
            filterLoadOptions: loadUserOptions,
          }
        : {}),
    },
    {
      field: "approvedBy",
      label: "Approved By",
      render: (row: WithdrawalRow) => row.approvedByName || "—",
      minWidth: 150,
      sortable: false,
      ...(withBankerFilters && loadUserOptions
        ? {
            filterType: "autocomplete" as const,
            filterKey: "approvedBy",
            filterLoadOptions: loadUserOptions,
          }
        : {}),
    },
    {
      field: "createdAt",
      label: "Transaction At",
      sortable: true,
      ...tableColumnPresets.dateCol,
      render: (row: WithdrawalRow) => formatDateTimeForUser(row.requestedAt ?? row.createdAt),
      ...(withBankerFilters
        ? {
            filterType: "date" as const,
            filterKey: "createdAt_from",
            filterKeyTo: "createdAt_to",
            operatorKey: "createdAt_op",
          }
        : {}),
    },
  );

  return cols;
}

/** Final-list extras appended after the shared banker-Excel main block. */
export function buildWithdrawalFinalExtraListColumns(
  formatWholeMoney: (n: number) => string,
): PaginatedTableReferenceColumn[] {
  return [
    {
      field: "amount",
      label: "Amount",
      render: (row: WithdrawalRow) => formatWholeMoney(row.amount),
      sortable: true,
      minWidth: 110,
    },
    {
      field: "reverseBonus",
      label: "Reverse Bonus",
      render: (row: WithdrawalRow) =>
        row.reverseBonus != null ? formatWholeMoney(row.reverseBonus) : "—",
      sortable: true,
      minWidth: 120,
    },
    {
      field: "amendmentCount",
      label: "Amendment Count",
      render: (row: WithdrawalRow) =>
        row.amendmentCount != null && row.amendmentCount > 0 ? String(row.amendmentCount) : "—",
      minWidth: 120,
      sortable: false,
    },
    {
      field: "lastAmendedAt",
      label: "Last Amended At",
      sortable: false,
      ...tableColumnPresets.dateCol,
      render: (row: WithdrawalRow) =>
        row.lastAmendedAt ? formatDateTimeForUser(row.lastAmendedAt) : "—",
    },
  ];
}
