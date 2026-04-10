"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface Permission {
  _id: string;
  module: string;
  action: string;
  key: string;
  description?: string;
}

interface PermissionGridProps {
  allPermissions: Permission[];
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
  density?: "comfortable" | "compact";
}

const MODULE_ORDER = [
  "dashboard",
  "sub_admin",
  "exchange",
  "player",
  "bank",
  "deposit",
  "withdrawal",
  "reports",
  "user_history",
  "notifications",
  "expense",
];

export function PermissionGrid({
  allPermissions,
  selectedPermissions,
  onChange,
  disabled = false,
  density = "comfortable",
}: PermissionGridProps) {
  const isCompact = density === "compact";
  // Group permissions by module and sort them
  const groupedPermissions = useMemo(() => {
    const grouped = allPermissions.reduce((acc, permission) => {
      const module = permission.module || "Other";
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    // Sort the keys based on MODULE_ORDER
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const indexA = MODULE_ORDER.indexOf(a);
      const indexB = MODULE_ORDER.indexOf(b);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    const sortedGrouped: Record<string, Permission[]> = {};
    for (const key of sortedKeys) {
      sortedGrouped[key] = grouped[key];
    }
    return sortedGrouped;
  }, [allPermissions]);

  const togglePermission = (key: string) => {
    if (disabled) return;
    const next = selectedPermissions.includes(key)
      ? selectedPermissions.filter((p) => p !== key)
      : [...selectedPermissions, key];
    onChange(next);
  };

  const toggleModule = (module: string, select: boolean) => {
    if (disabled) return;
    const moduleKeys = groupedPermissions[module].map((p) => p.key);
    let next: string[];
    if (select) {
      next = Array.from(new Set([...selectedPermissions, ...moduleKeys]));
    } else {
      next = selectedPermissions.filter((p) => !moduleKeys.includes(p));
    }
    onChange(next);
  };

  const toggleAll = (select: boolean) => {
    if (disabled) return;
    if (select) {
      onChange(allPermissions.map((p) => p.key));
    } else {
      onChange([]);
    }
  };

  const isModuleFullySelected = (module: string) => {
    const moduleKeys = groupedPermissions[module].map((p) => p.key);
    return moduleKeys.every((key) => selectedPermissions.includes(key));
  };

  const isModulePartiallySelected = (module: string) => {
    const moduleKeys = groupedPermissions[module].map((p) => p.key);
    const selectedInModule = moduleKeys.filter((key) => selectedPermissions.includes(key));
    return selectedInModule.length > 0 && selectedInModule.length < moduleKeys.length;
  };

  const allSelected = allPermissions.length > 0 && selectedPermissions.length === allPermissions.length;

  return (
    <div className={cn(isCompact ? "space-y-4" : "space-y-6")}>
      <div className={cn("flex items-center justify-between border-b", isCompact ? "pb-1.5" : "pb-2")}>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900">Access Permissions</h3>
          <p className="text-xs text-gray-500">Configure feature-level access for this administrative user.</p>
        </div>
        <div className={cn("flex", isCompact ? "gap-1.5" : "gap-2")}>
          <Button
            variant="outline"
            size={isCompact ? "xs" : "sm"}
            onClick={() => toggleAll(true)}
            disabled={disabled || allSelected}
            type="button"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size={isCompact ? "xs" : "sm"}
            onClick={() => toggleAll(false)}
            disabled={disabled || selectedPermissions.length === 0}
            type="button"
          >
            Deselect All
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2",
          isCompact ? "lg:grid-cols-4 gap-3" : "lg:grid-cols-3 gap-4"
        )}
      >
        {Object.entries(groupedPermissions).map(([module, permissions]) => {
          const fullySelected = isModuleFullySelected(module);
          const partiallySelected = isModulePartiallySelected(module);

          return (
            <Card key={module} className={cn(
              "flex flex-col h-full transition-all border shadow-sm hover:shadow-md",
              isCompact ? "p-3" : "p-4",
              fullySelected ? "border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/10 bg-[var(--brand-primary)]/[0.02]" : "border-[var(--border)]"
            )}>
              <div className={cn("flex items-center justify-between border-b border-gray-100", isCompact ? "mb-2.5 pb-2" : "mb-4 pb-3")}>
                <h4 className="font-bold text-gray-800 uppercase tracking-tighter text-xs">
                  {module.replace(/_/g, " ")}
                </h4>
                <Checkbox
                  checked={fullySelected}
                  // This is a partial state visual trick usually done with indeterminate, 
                  // but we'll just use a different style or rely on the toggle behavior.
                  className={cn(partiallySelected && "opacity-70")}
                  onChange={(e) => toggleModule(module, e.target.checked)}
                  disabled={disabled}
                  title={`Toggle all ${module} permissions`}
                />
              </div>
              <div className={cn("grid grid-cols-1 flex-grow", isCompact ? "gap-2" : "gap-3")}>
                {permissions.map((permission) => (
                  <Checkbox
                    key={permission.key}
                    label={permission.action.replace(/_/g, " ")}
                    checked={selectedPermissions.includes(permission.key)}
                    onChange={() => togglePermission(permission.key)}
                    disabled={disabled}
                  />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
