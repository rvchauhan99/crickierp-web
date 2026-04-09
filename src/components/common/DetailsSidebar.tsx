import { Drawer } from "@/components/ui/Drawer";

type Props = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

export function DetailsSidebar({ open, title, children, onClose }: Props) {
  return (
    <Drawer open={open} title={title} onClose={onClose}>
      {children}
    </Drawer>
  );
}
