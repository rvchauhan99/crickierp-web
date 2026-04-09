import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  search: string;
  fromDate?: string;
  toDate?: string;
  onChange: (next: { search?: string; fromDate?: string; toDate?: string }) => void;
  onApply?: () => void;
  onReset?: () => void;
};

export function FilterToolbar({ search, fromDate, toDate, onChange, onApply, onReset }: Props) {
  return (
    <div className="card grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
      <Input
        placeholder="Search..."
        value={search}
        onChange={(event) => onChange({ search: event.target.value })}
      />
      <Input
        type="datetime-local"
        value={fromDate}
        onChange={(event) => onChange({ fromDate: event.target.value })}
      />
      <Input
        type="datetime-local"
        value={toDate}
        onChange={(event) => onChange({ toDate: event.target.value })}
      />
      <div className="flex items-center gap-2">
        <Button onClick={onApply}>Apply</Button>
        <Button variant="secondary" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
