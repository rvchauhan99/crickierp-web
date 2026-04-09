import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/common/PageHeader";

const metrics = [
  { label: "Deposit", value: "0" },
  { label: "Withdrawal", value: "0" },
  { label: "Total Bonus", value: "0" },
  { label: "Gross P/L", value: "0" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" description="Full-day summary and key operational metrics." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <Card key={item.label}>
            <p className="text-sm text-text-secondary">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold">{item.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
