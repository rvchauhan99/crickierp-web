type Props = {
  isRead: boolean;
  onMarkRead: () => void;
};

export function NotificationMarkReadAction({ isRead, onMarkRead }: Props) {
  if (isRead) return null;
  return (
    <button className="text-xs text-brand-primary hover:underline" onClick={onMarkRead}>
      Mark read
    </button>
  );
}
