import { describe, expect, it } from "vitest";
import { canEditBusinessEntryDateTime } from "./roles";

describe("canEditBusinessEntryDateTime", () => {
  it("allows admin and superadmin", () => {
    expect(canEditBusinessEntryDateTime("admin")).toBe(true);
    expect(canEditBusinessEntryDateTime("superadmin")).toBe(true);
  });

  it("denies sub_admin and empty roles", () => {
    expect(canEditBusinessEntryDateTime("sub_admin")).toBe(false);
    expect(canEditBusinessEntryDateTime("")).toBe(false);
    expect(canEditBusinessEntryDateTime(undefined)).toBe(false);
    expect(canEditBusinessEntryDateTime(null)).toBe(false);
  });
});
