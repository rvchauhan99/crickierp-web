import { Suspense } from "react";
import { BankSummaryClient } from "@/modules/bank/components/BankSummaryClient";

function BankSummaryFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-secondary)]">
      Loading bank summary…
    </div>
  );
}

export default function BankSummaryPage() {
  return (
    <Suspense fallback={<BankSummaryFallback />}>
      <BankSummaryClient />
    </Suspense>
  );
}
