import { BankTransferClient } from "@/modules/bank/components/BankTransferClient";
import { ListingPageContainer } from "@/components/common/ListingPageContainer";

export default function BankTransferPage() {
  return (
    <ListingPageContainer title="Bank / Transfer" fullWidth>
      <BankTransferClient />
    </ListingPageContainer>
  );
}
