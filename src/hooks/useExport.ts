"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

interface UseExportOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  fileName?: string;
}

async function readBlobErrorMessage(blob: Blob): Promise<string | null> {
  const type = (blob.type || "").toLowerCase();
  if (!type.includes("json") && !type.includes("text")) {
    // Tiny blobs are often JSON error bodies mislabeled as octet-stream
    if (blob.size > 4096) return null;
  }
  try {
    const text = await blob.text();
    if (!text.trim()) return null;
    try {
      const parsed = JSON.parse(text) as {
        error?: { message?: string } | string;
        message?: string;
      };
      if (typeof parsed.error === "string" && parsed.error.trim()) return parsed.error.trim();
      if (parsed.error && typeof parsed.error === "object" && typeof parsed.error.message === "string") {
        return parsed.error.message.trim();
      }
      if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message.trim();
    } catch {
      if (text.length < 500) return text.trim();
    }
  } catch {
    return null;
  }
  return null;
}

function looksLikeSpreadsheet(blob: Blob): boolean {
  const type = (blob.type || "").toLowerCase();
  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    type.includes("csv") ||
    type.includes("octet-stream") ||
    type.includes("zip")
  ) {
    return blob.size > 64;
  }
  // Empty/unknown type: accept non-tiny payloads (xlsx is a zip)
  if (!type || type === "application/octet-stream") return blob.size > 64;
  if (type.includes("json") || type.includes("text/html") || type.includes("text/plain")) return false;
  return blob.size > 64;
}

async function resolveExportError(err: unknown): Promise<string> {
  const fallback = "Failed to export. Please try again.";
  const axiosLike = err as {
    message?: string;
    response?: { data?: unknown; status?: number };
  };

  const data = axiosLike?.response?.data;
  if (data instanceof Blob) {
    const msg = await readBlobErrorMessage(data);
    if (msg) return msg;
  }
  if (typeof data === "object" && data !== null) {
    const parsed = data as { error?: { message?: string } | string; message?: string };
    if (typeof parsed.error === "string" && parsed.error.trim()) return parsed.error.trim();
    if (parsed.error && typeof parsed.error === "object" && typeof parsed.error.message === "string") {
      return parsed.error.message.trim();
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message.trim();
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof axiosLike?.message === "string" && axiosLike.message.trim()) return axiosLike.message;
  return fallback;
}

/**
 * Shared Excel/CSV download helper. Always expects a backend blob export —
 * never builds files from the visible listing table.
 */
export function useExport(
  exportFn: (params: Record<string, unknown>) => Promise<Blob>,
  options: UseExportOptions = {},
) {
  const [exporting, setExporting] = useState(false);
  const fileNameRef = useRef(options.fileName || "export.xlsx");
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);
  const exportFnRef = useRef(exportFn);

  useEffect(() => {
    fileNameRef.current = options.fileName || "export.xlsx";
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
    exportFnRef.current = exportFn;
  }, [exportFn, options.fileName, options.onSuccess, options.onError]);

  const handleExport = useCallback(async (params: Record<string, unknown> = {}) => {
    setExporting(true);
    try {
      const blob = await exportFnRef.current(params);

      if (!looksLikeSpreadsheet(blob)) {
        const msg = (await readBlobErrorMessage(blob)) || "Export returned an invalid file.";
        throw new Error(msg);
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileNameRef.current);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      // Delay revoke so the browser can start the download
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1500);

      onSuccessRef.current?.();
    } catch (err: unknown) {
      console.error("Export failed:", err);
      const message = await resolveExportError(err);
      if (onErrorRef.current) {
        onErrorRef.current(err instanceof Error ? err : new Error(message));
      } else {
        toast.error(message);
      }
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exporting,
    handleExport,
  };
}
