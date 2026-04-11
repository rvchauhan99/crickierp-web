"use client";

import { useCallback, useState } from "react";
import { financialService, WithdrawalPayload } from "@/services/financialService";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import PaginatedTableReference from "@/components/common/PaginatedTableReference";
import PaginationControlsReference from "@/components/common/PaginationControlsReference";
import { FormActions, FormContainer } from "@/components/common/FormContainer";
import { FormGrid } from "@/components/common/FormGrid";
import { FieldLabel } from "@/components/common/FieldLabel";
import { FieldError } from "@/components/common/FieldError";
import { TableStatusBadge } from "@/components/common/TableStatusBadge";
import { getApiErrorMessage } from "@/lib/apiError";
import { tableColumnPresets } from "@/lib/tableStylePresets";
import { WithdrawalRow } from "@/types/financial";

const initialState: Partial<WithdrawalPayload> = {
  playerName: "",
  bankName: "",
  amount: 0,
  stage: "exchange",
};

export default function WithdrawalExchangePage() {
  const [form, setForm] = useState<Partial<WithdrawalPayload>>(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ playerName?: string; bankName?: string; amount?: string }>({});

  const [tableKey, setTableKey] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const onSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!form.playerName?.trim()) nextErrors.playerName = "Player name is required.";
    if (!form.bankName?.trim()) nextErrors.bankName = "Bank name is required.";
    if (!form.amount || form.amount <= 0) nextErrors.amount = "Amount must be greater than 0.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setMessage("");
    try {
      await financialService.createWithdrawal(form as WithdrawalPayload);
      setMessage("Withdrawal requested successfully.");
      setForm(initialState);
      setTableKey((prev) => prev + 1);
    } catch (error: unknown) {
      setMessage(getApiErrorMessage(error, "Failed to request withdrawal"));
    } finally {
      setLoading(false);
    }
  };

  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    return financialService.listWithdrawals("exchange", params.page as number, params.limit as number);
  }, []);

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
  ];

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Add Form Section */}
      <FormContainer title="Withdrawal / Exchange" description="Request a new withdrawal at the Exchange stage.">
        <FormGrid>
          <div>
            <FieldLabel>Player Name</FieldLabel>
            <Input
              placeholder="Enter Player Name"
              value={form.playerName}
              onChange={(e) => setForm((p) => ({ ...p, playerName: e.target.value }))}
            />
            <FieldError message={errors.playerName} />
          </div>
          <div>
            <FieldLabel>Bank Name</FieldLabel>
            <Input
              placeholder="Enter Bank Name"
              value={form.bankName}
              onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
            />
            <FieldError message={errors.bankName} />
          </div>
          <div>
            <FieldLabel>Amount</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={form.amount || ""}
              onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))}
            />
            <FieldError message={errors.amount} />
          </div>
        </FormGrid>
        <FormActions>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? "Saving..." : "Request Withdrawal"}
          </Button>
          {message && (
            <span className={`text-sm ml-4 ${message.includes("successfully") ? "text-green-600" : "text-brand-accent"}`}>
              {message}
            </span>
          )}
        </FormActions>
      </FormContainer>

      {/* List Section */}
      <ListingPageContainer title="Exchange Withdrawals" fullWidth density="compact">
        <PaginatedTableReference
          key={tableKey}
          columns={columns}
          fetcher={fetcher}
          height="calc(100vh - 450px)"
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
    </div>
  );
}
