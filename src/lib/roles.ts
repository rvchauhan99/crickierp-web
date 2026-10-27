/** Admin and superadmin may set/edit business entry date/time (including past/future). */
export function canEditBusinessEntryDateTime(role: string | undefined | null): boolean {
  return role === "admin" || role === "superadmin";
}
