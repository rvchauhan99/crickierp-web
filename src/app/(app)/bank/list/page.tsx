"use client";
import { useCallback, useMemo, useState } from "react";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { financialService } from "@/services/financialService";

export default function BankListPage() {
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    return financialService.listBanks();
  }, []);

  const columns = useMemo(
    () => [
      { field: "holderName", label: "Holder", render: (row: any) => row.holderName, ...tableColumnPresets.nameCol },
      { field: "bankName", label: "Bank", render: (row: any) => row.bankName, ...tableColumnPresets.nameCol },
      { field: "accountNumber", label: "Account", render: (row: any) => row.accountNumber },
      { field: "ifsc", label: "IFSC", render: (row: any) => row.ifsc },
      {
        field: "status",
        label: "Status",
        ...tableColumnPresets.statusCol,
        render: (row: any) => <TableStatusBadge status={row.status} />,
      },
    ],
    []
  );

  return (
    <ListingPageContainer title="Bank / List" fullWidth density="compact">
      <PaginatedTableReference
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
