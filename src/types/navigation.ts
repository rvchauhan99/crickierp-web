export type AppNavNode = {
  id: string;
  label: string;
  href?: string;
  keywords?: string[];
  /** If set, only these roles (e.g. superadmin) see this node and its subtree. */
  allowedRoles?: string[];
  children?: AppNavNode[];
};
