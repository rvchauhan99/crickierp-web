export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const obj = error as {
      message?: string;
      response?: {
        data?: {
          message?: string;
          error?: { message?: string };
        };
      };
    };
    return obj.response?.data?.error?.message ?? obj.response?.data?.message ?? obj.message ?? fallback;
  }
  return fallback;
}
