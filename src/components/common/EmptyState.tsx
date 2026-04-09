type Props = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "No data found",
  description = "Try adjusting filters or create a new record.",
}: Props) {
  return (
    <div className="card p-6 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
    </div>
  );
}
