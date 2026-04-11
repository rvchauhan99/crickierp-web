import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import { DepositBankerClient } from "@/modules/deposit/components/DepositBankerClient";

export default function DepositBankerPage() {
  return (
    <ListingPageContainer title="Deposit / Banker" fullWidth>
      <DepositBankerClient />
    </ListingPageContainer>
  );
}
