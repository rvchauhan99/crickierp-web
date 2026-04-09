import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export type TableColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
};

export function PaginatedTable<T>({ columns, rows, emptyMessage = "No records found." }: Props<T>) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full text-left text-[13px]">
        <thead className="bg-sidebar-bg">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-2.5 font-medium text-text-secondary">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-secondary">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="border-t border-border transition-colors hover:bg-sidebar-hover/30">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-2.5">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}
