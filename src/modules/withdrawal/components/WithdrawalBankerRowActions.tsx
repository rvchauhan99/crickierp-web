"use client";

import { IconCheck, IconEye, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import type { WithdrawalRow } from "@/types/withdrawal";

type Props = {
  row: WithdrawalRow;
  loading: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDetails: () => void;
};

export function WithdrawalBankerRowActions({
  row,
  loading,
  onApprove,
  onReject,
  onDetails,
}: Props) {
  const requested = row.status === "requested";

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      data-no-row-click
      onClick={(e) => e.stopPropagation()}
    >
      {requested ? (
        <>
          <Button
            type="button"
            size="xs"
            variant="success"
            startIcon={<IconCheck size={14} />}
            loading={loading}
            disabled={loading}
            onClick={onApprove}
          >
            Approve
          </Button>
          <Button
            type="button"
            size="xs"
            variant="danger"
            startIcon={<IconX size={14} />}
            disabled={loading}
            skipTab
            onClick={onReject}
          >
            Reject
          </Button>
        </>
      ) : null}
      <Button
        type="button"
        size="xs"
        variant="secondary"
        startIcon={<IconEye size={14} />}
        disabled={loading}
        skipTab
        onClick={onDetails}
      >
        Details
      </Button>
    </div>
  );
}
