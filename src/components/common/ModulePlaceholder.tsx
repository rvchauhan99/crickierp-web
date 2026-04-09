import { ListingPageContainer } from "@/components/common/ListingPageContainer";
import { FormContainer } from "@/components/common/FormContainer";
import { Card } from "@/components/ui/Card";

type Props = {
  title: string;
  description?: string;
};

export function ModulePlaceholder({ title, description }: Props) {
  const normalized = title.toLowerCase();
  const isFormPage = normalized.includes("/ add");

  const content = (
    <Card>
      <p className="text-sm text-text-secondary">
        This route is scaffolded and ready for backend integration.
      </p>
    </Card>
  );

  if (isFormPage) {
    return (
      <FormContainer title={title} description={description ?? "Form scaffold is ready for implementation."}>
        {content}
      </FormContainer>
    );
  }

  return (
    <ListingPageContainer title={title} description={description ?? "Module skeleton ready for implementation."}>
      {content}
    </ListingPageContainer>
  );
}
