type Props = {
  count: number;
};

export function NotificationBadge({ count }: Props) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span className="pulse-soft absolute -right-2 -top-2 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-semibold text-white">
      {label}
    </span>
  );
}
