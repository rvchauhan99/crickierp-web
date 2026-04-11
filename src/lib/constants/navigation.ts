import { AppNavNode } from "@/types/navigation";

/**
 * Hides nodes whose `allowedRoles` does not include the current user's role.
 * Empty or missing `allowedRoles` means visible to everyone.
 */
export function filterNavByRole(nodes: AppNavNode[], role: string | undefined): AppNavNode[] {
  const r = role ?? "";
  const out: AppNavNode[] = [];
  for (const node of nodes) {
    if (node.allowedRoles?.length && !node.allowedRoles.includes(r)) {
      continue;
    }
    if (node.children?.length) {
      const children = filterNavByRole(node.children, role);
      if (children.length === 0 && !node.href) continue;
      out.push({ ...node, children });
    } else {
      out.push({ ...node });
    }
  }
  return out;
}

export const NAV_ITEMS: AppNavNode[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", keywords: ["home", "summary"] },
  {
    id: "sub-admin",
    label: "Sub Admin",
    children: [
      { id: "sub-admin-add", label: "Add", href: "/sub-admin/add", keywords: ["create", "user"] },
      { id: "sub-admin-list", label: "List", href: "/sub-admin/list", keywords: ["manage"] },
      { id: "sub-admin-edit", label: "Edit", href: "/sub-admin/edit", keywords: ["update", "password", "permissions"] },
    ],
  },
  {
    id: "exchange",
    label: "Exchange",
    children: [
      { id: "exchange-add", label: "Add", href: "/exchange/add", keywords: ["provider"] },
      { id: "exchange-list", label: "List", href: "/exchange/list", keywords: ["transfer"] },
    ],
  },
  {
    id: "player",
    label: "Player",
    children: [
      { id: "player-add", label: "Add", href: "/player/add", keywords: ["onboard"] },
      { id: "player-list", label: "List", href: "/player/list", keywords: ["search"] },
    ],
  },
  {
    id: "bank",
    label: "Bank",
    children: [
      { id: "bank-add", label: "Add", href: "/bank/add", keywords: ["account"] },
      { id: "bank-list", label: "List", href: "/bank/list", keywords: ["b2b", "expense"] },
      { id: "bank-statement", label: "Statement", href: "/bank/statement", keywords: ["utr"] },
    ],
  },
  {
    id: "deposit",
    label: "Deposit",
    children: [
      { id: "deposit-banker", label: "Banker", href: "/deposit/banker", keywords: ["banker deposit"] },
      { id: "deposit-exchange", label: "Exchange", href: "/deposit/exchange", keywords: ["depositor"] },
      { id: "deposit-final", label: "Final List", href: "/deposit/final-list", keywords: ["finalize"] },
    ],
  },
  {
    id: "withdrawal",
    label: "Withdrawal",
    children: [
      { id: "withdrawal-exchange", label: "Exchange", href: "/withdrawal/exchange", keywords: ["request"] },
      { id: "withdrawal-banker", label: "Banker", href: "/withdrawal/banker", keywords: ["update"] },
      { id: "withdrawal-final", label: "Final List", href: "/withdrawal/final-list", keywords: ["approve"] },
    ],
  },
  {
    id: "expense",
    label: "Expense",
    children: [
      { id: "expense-add", label: "Add", href: "/expense/add", keywords: ["create"] },
      { id: "expense-list", label: "List", href: "/expense/list", keywords: ["search"] },
      { id: "expense-audit", label: "Audit", href: "/expense/audit", keywords: ["approve", "reject"] },
    ],
  },
  {
    id: "masters",
    label: "Masters",
    allowedRoles: ["superadmin"],
    children: [{ id: "masters-panel", label: "Panel", href: "/masters", keywords: ["reason", "expense type", "lookup"] }],
  },
  {
    id: "reports",
    label: "Reports",
    children: [
      {
        id: "reports-transaction-history",
        label: "Transaction History",
        href: "/reports/transaction-history",
        keywords: ["history", "export"],
      },
      {
        id: "reports-expense-analysis",
        label: "Expense analysis",
        href: "/reports/expense-analysis",
        keywords: ["expense", "totals", "export"],
      },
    ],
  },
  { id: "user-history", label: "Login history", href: "/user-history", keywords: ["audit", "login"] },
  { id: "notifications", label: "Notifications", href: "/notifications", keywords: ["alerts", "unread"] },
];
