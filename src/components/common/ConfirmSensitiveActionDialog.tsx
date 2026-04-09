import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Props = {
  title: string;
  reason: string;
  open: boolean;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmSensitiveActionDialog({
  title,
  reason,
  open,
  onReasonChange,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
      <div className="card w-full max-w-md space-y-4 p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Input
          placeholder="Reason (required)"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!reason.trim()}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
