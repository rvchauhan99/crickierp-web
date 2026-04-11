type ApiErrorPayload = {
  message?: string;
  response?: {
    data?: {
      message?: string;
      error?: {
        message?: string;
        details?: { errors?: { row: number; message: string }[] } | Record<string, unknown>;
      };
    };
  };
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const obj = error as ApiErrorPayload;
    return obj.response?.data?.error?.message ?? obj.response?.data?.message ?? obj.message ?? fallback;
  }
  return fallback;
}

/** Row-level import validation errors from API (HTTP 400, error.details.errors). */
export function getApiImportRowErrors(error: unknown): { row: number; message: string }[] {
  if (typeof error !== "object" || error === null) return [];
  const details = (error as ApiErrorPayload).response?.data?.error?.details;
  if (!details || typeof details !== "object") return [];
  const rows = "errors" in details ? (details as { errors?: unknown }).errors : undefined;
  return Array.isArray(rows) ? (rows as { row: number; message: string }[]) : [];
}

export function formatImportErrorToast(error: unknown, fallback: string): { title: string; description?: string } {
  const message = getApiErrorMessage(error, fallback);
  const rowErrors = getApiImportRowErrors(error);
  if (rowErrors.length === 0) {
    return { title: message };
  }
  const lines = rowErrors.slice(0, 8).map((e) => `Row ${e.row}: ${e.message}`);
  const more =
    rowErrors.length > 8 ? `\n… and ${rowErrors.length - 8} more issue(s). Fix the file and try again.` : "";
  return {
    title: message,
    description: `${lines.join("\n")}${more}`,
  };
}
