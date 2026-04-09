export type AppNavNode = {
  id: string;
  label: string;
  href?: string;
  keywords?: string[];
  children?: AppNavNode[];
};
