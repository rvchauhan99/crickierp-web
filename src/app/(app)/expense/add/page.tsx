import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import { ExpenseAddClient } from "@/modules/expense/components/ExpenseAddClient";

export default function ExpenseAddPage() {
  return (
    <ListingPageContainer title="Expense / Add" description="Create an expense (pending audit). Expense type is required; bank is optional until approval.">
      <ExpenseAddClient />
    </ListingPageContainer>
  );
}
