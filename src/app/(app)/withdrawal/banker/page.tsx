"use client";

import { useCallback, useState } from "react";
import { financialService } from "@/services/financialService";
import { Button } from "@/components/ui/Button";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { WithdrawalRow } from "@/types/financial";

export default function WithdrawalBankerPage() {
  const [tableKey, setTableKey] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    return financialService.listWithdrawals("banker", params.page as number, params.limit as number);
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await financialService.updateWithdrawalStatus(id, "approved");
      setTableKey((prev) => prev + 1);
    } catch {
      alert("Failed to approve withdrawal.");
    }
  };

  const columns = [
    { field: "playerName", label: "Player", render: (row: WithdrawalRow) => row.playerName, ...tableColumnPresets.nameCol },
    { field: "bankName", label: "Bank", render: (row: WithdrawalRow) => row.bankName, ...tableColumnPresets.nameCol },
    { field: "amount", label: "Amount", render: (row: WithdrawalRow) => row.amount.toLocaleString() },
    {
      field: "status",
      label: "Status",
      ...tableColumnPresets.statusCol,
      render: (row: WithdrawalRow) => <TableStatusBadge status={row.status} />,
    },
    { field: "createdAt", label: "Date", render: (row: WithdrawalRow) => new Date(row.createdAt).toLocaleDateString(), ...tableColumnPresets.dateCol },
    {
      field: "actions",
      label: "Actions",
      isActionColumn: true,
      ...tableColumnPresets.actionsCol,
      render: (row: WithdrawalRow) => (
        <div className="flex gap-2">
          {row.status === "requested" ? (
            <Button size="sm" onClick={() => handleApprove(row._id)}>
              Approve
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground italic">No actions</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <ListingPageContainer title="Withdrawal / Banker" fullWidth density="compact">
      <PaginatedTableReference
        key={tableKey}
        columns={columns}
        fetcher={fetcher}
        height="calc(100vh - 200px)"
        showSearch={false}
        showPagination={false}
        onTotalChange={setTotalCount}
        page={page}
        limit={limit}
        onPageChange={(zeroBased) => setPage(zeroBased + 1)}
        onRowsPerPageChange={setLimit}
        compactDensity
      />
      <PaginationControlsReference
        page={page - 1}
        rowsPerPage={limit}
        totalCount={totalCount}
        onPageChange={(zeroBased) => setPage(zeroBased + 1)}
        onRowsPerPageChange={setLimit}
        rowsPerPageOptions={[20, 50, 100]}
      />
    </ListingPageContainer>
  );
}
