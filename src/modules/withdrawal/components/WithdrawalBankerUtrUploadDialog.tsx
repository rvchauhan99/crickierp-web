"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IconDownload, IconFileCheck, IconUpload, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/common/FieldLabel";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  createBankerUtrUploadJob,
  downloadBankerUtrUploadJobErrorCsv,
  downloadBankerUtrUploadSample,
  getBankerUtrUploadJob,
  streamBankerUtrUploadJobEvents,
  validateBankerUtrUpload,
} from "@/services/withdrawalService";
import type {
  BankerUtrUploadInvalidRow,
  BankerUtrUploadValidationResult,
  WithdrawalBankerUtrUploadJobSummary,
} from "@/types/withdrawal";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type Step = "upload" | "review" | "result";

export function WithdrawalBankerUtrUploadDialog({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");
  const [validationResult, setValidationResult] = useState<BankerUtrUploadValidationResult | null>(null);
  const [uploadJob, setUploadJob] = useState<WithdrawalBankerUtrUploadJobSummary | null>(null);
  const [commitResult, setCommitResult] = useState<{ approved: number; skipped: number; failed: number } | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamCleanupRef = useRef<(() => void) | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const downloadedErrorCsvJobsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      if (streamCleanupRef.current) streamCleanupRef.current();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  function reset() {
    setStep("upload");
    setFile(null);
    setValidating(false);
    setCommitting(false);
    setError("");
    setValidationResult(null);
    setUploadJob(null);
    setCommitResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    if (streamCleanupRef.current) streamCleanupRef.current();
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    streamCleanupRef.current = null;
    pollTimerRef.current = null;
    reset();
    onClose();
  }

  async function handleDownloadSample(format: "csv" | "xlsx") {
    try {
      const blob = await downloadBankerUtrUploadSample(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        format === "xlsx"
          ? "withdrawal-banker-utr-upload-sample.xlsx"
          : "withdrawal-banker-utr-upload-sample.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(format === "xlsx" ? "Excel template downloaded." : "CSV template downloaded.");
    } catch {
      toast.error("Failed to download sample file");
    }
  }

  async function handleValidate() {
    if (!file) return;
    setError("");
    setValidating(true);
    try {
      const result = await validateBankerUtrUpload(file);
      setValidationResult(result);
      setStep("review");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Validation failed"));
    } finally {
      setValidating(false);
    }
  }

  async function handleCommit() {
    if (!validationResult || validationResult.validRows.length === 0) return;
    setCommitting(true);
    setError("");
    const stopAllTracking = () => {
      if (streamCleanupRef.current) streamCleanupRef.current();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      streamCleanupRef.current = null;
      pollTimerRef.current = null;
    };
    const triggerCsvDownload = (blob: Blob, fileName: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    try {
      const rows = validationResult.validRows.map((r) => ({
        withdrawalId: r.withdrawalId,
        utr: r.utr,
        payoutBankId: r.payoutBankId,
      }));
      const queued = await createBankerUtrUploadJob(rows);
      const initial = await getBankerUtrUploadJob(queued.jobId);
      setUploadJob(initial);
      setStep("result");

      const refreshStatus = async () => {
        try {
          const next = await getBankerUtrUploadJob(queued.jobId);
          setUploadJob(next);
          if (next.status === "completed" || next.status === "failed") {
            stopAllTracking();
            setCommitResult({
              approved: next.progress.successRows,
              skipped: next.progress.skippedRows,
              failed: next.progress.failedRows,
            });
            if (next.progress.successRows > 0) onSuccess();
            if (next.errorCsvAvailable && !downloadedErrorCsvJobsRef.current.has(next.id)) {
              downloadedErrorCsvJobsRef.current.add(next.id);
              try {
                const { blob, fileName } = await downloadBankerUtrUploadJobErrorCsv(next.id);
                triggerCsvDownload(blob, fileName);
              } catch {
                // Ignore download failure.
              }
            }
          }
        } catch {
          // Keep polling retries silent.
        }
      };

      const cleanupStream = await streamBankerUtrUploadJobEvents(queued.jobId, (streamed) => {
        setUploadJob((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: streamed.status,
            failureReason: streamed.failureReason,
            progress: streamed.progress,
          };
        });
      });
      streamCleanupRef.current = cleanupStream;
      pollTimerRef.current = setInterval(() => {
        void refreshStatus();
      }, 7000);
      void refreshStatus();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "UTR upload failed"));
    } finally {
      setCommitting(false);
    }
  }

  function handleDownloadErrors(invalidRows: BankerUtrUploadInvalidRow[]) {
    const header = "Row,Withdrawal ID,UTR,Payout Bank,Error";
    const lines = [header];
    for (const row of invalidRows) {
      const err = row.errors.join("; ").replace(/"/g, '""');
      lines.push(
        `${row.row},"${row.withdrawalId.replace(/"/g, '""')}","${row.utr.replace(/"/g, '""')}","${row.payoutBank.replace(/"/g, '""')}","${err}"`,
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `withdrawal-banker-utr-upload-errors-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upload UTRs"
    >
      <div className="card flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Upload UTRs</h3>
            <p className="text-sm text-gray-500">
              {step === "upload" && "Upload the exported file after filling UTR and Payout Bank"}
              {step === "review" && "Review validation before approving payouts"}
              {step === "result" && "Settlement progress"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === "upload" && (
            <UploadStep
              file={file}
              fileInputRef={fileInputRef}
              onFileChange={setFile}
              onDownloadSample={handleDownloadSample}
            />
          )}

          {step === "review" && validationResult && (
            <ReviewStep result={validationResult} onDownloadErrors={handleDownloadErrors} />
          )}

          {step === "result" && <ResultStep result={commitResult} uploadJob={uploadJob} />}
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          {step === "upload" && (
            <>
              <Button variant="secondary" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleValidate}
                loading={validating}
                disabled={!file || validating}
                startIcon={<IconFileCheck size={16} />}
              >
                Validate
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  reset();
                }}
              >
                Upload Different File
              </Button>
              <Button
                size="sm"
                onClick={handleCommit}
                loading={committing}
                disabled={committing || !validationResult || validationResult.validRows.length === 0}
                startIcon={<IconUpload size={16} />}
              >
                Confirm &amp; Approve ({validationResult?.validRows.length ?? 0})
              </Button>
            </>
          )}

          {step === "result" && (
            <Button size="sm" onClick={handleClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadStep({
  file,
  fileInputRef,
  onFileChange,
  onDownloadSample,
}: {
  file: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (f: File | null) => void;
  onDownloadSample: (format: "csv" | "xlsx") => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">Use the banker export file</p>
            <p className="mt-0.5 text-xs text-blue-600">
              Export pending rows, fill <strong>UTR</strong> and <strong>Payout Bank</strong> (last 4 digits of the
              active company bank account; full account number or holder name still accepted), then upload here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDownloadSample("xlsx")}
              startIcon={<IconDownload size={16} />}
            >
              Sample Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDownloadSample("csv")}
              startIcon={<IconDownload size={16} />}
            >
              Sample CSV
            </Button>
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>Upload filled file</FieldLabel>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-50"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        {file && (
          <p className="mt-2 text-sm text-gray-500">
            Selected: <span className="font-medium text-gray-700">{file.name}</span> (
            {(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-xs text-gray-600 space-y-1">
        <p>
          <span className="font-medium">Withdrawal ID</span> — required match key (do not change)
        </p>
        <p>
          <span className="font-medium">UTR</span> — required for pending rows
        </p>
        <p>
          <span className="font-medium">Payout Bank</span> — last 4 digits of an active company bank account
          (full account number or holder name also accepted)
        </p>
        <p>Already approved / rejected rows are skipped automatically.</p>
      </div>
    </div>
  );
}

function ReviewStep({
  result,
  onDownloadErrors,
}: {
  result: BankerUtrUploadValidationResult;
  onDownloadErrors: (rows: BankerUtrUploadInvalidRow[]) => void;
}) {
  const { summary, invalidRows, skippedRows } = result;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total" value={summary.total} />
        <SummaryCard label="Valid" value={summary.valid} tone="green" />
        <SummaryCard label="Skipped" value={summary.skipped} tone="amber" />
        <SummaryCard label="Invalid" value={summary.invalid} tone="red" />
      </div>

      {summary.skipped > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {summary.skipped} already actioned row{summary.skipped === 1 ? "" : "s"} will be skipped (no change).
          {skippedRows[0] ? ` Example: ${skippedRows[0].withdrawalId} (${skippedRows[0].status}).` : null}
        </div>
      )}

      {invalidRows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">Invalid rows</p>
            <Button variant="secondary" size="xs" onClick={() => onDownloadErrors(invalidRows)}>
              Download error CSV
            </Button>
          </div>
          <div className="max-h-48 overflow-auto rounded border text-xs">
            <table className="min-w-full">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-2 py-1">Row</th>
                  <th className="px-2 py-1">Withdrawal ID</th>
                  <th className="px-2 py-1">Error</th>
                </tr>
              </thead>
              <tbody>
                {invalidRows.slice(0, 50).map((row) => (
                  <tr key={`${row.row}-${row.withdrawalId}`} className="border-t">
                    <td className="px-2 py-1 tabular-nums">{row.row}</td>
                    <td className="px-2 py-1 font-mono">{row.withdrawalId || "—"}</td>
                    <td className="px-2 py-1 text-red-700">{row.errors.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultStep({
  result,
  uploadJob,
}: {
  result: { approved: number; skipped: number; failed: number } | null;
  uploadJob: WithdrawalBankerUtrUploadJobSummary | null;
}) {
  const percent =
    uploadJob && uploadJob.progress.totalRows > 0
      ? Math.min(
          100,
          Math.round((uploadJob.progress.processedRows / uploadJob.progress.totalRows) * 100),
        )
      : 0;
  return (
    <div className="space-y-4">
      {uploadJob && (
        <div className="rounded-lg border bg-gray-50 p-4 text-sm">
          <p className="font-medium capitalize">Status: {uploadJob.status}</p>
          <div className="mt-2 h-2 overflow-hidden rounded bg-gray-200">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Processed {uploadJob.progress.processedRows}/{uploadJob.progress.totalRows} · Approved{" "}
            {uploadJob.progress.successRows} · Skipped {uploadJob.progress.skippedRows} · Failed{" "}
            {uploadJob.progress.failedRows}
          </p>
          {uploadJob.failureReason ? (
            <p className="mt-1 text-red-600">{uploadJob.failureReason}</p>
          ) : null}
        </div>
      )}
      {result && (
        <p className="text-sm text-gray-700">
          Finished: <strong>{result.approved}</strong> approved, <strong>{result.skipped}</strong> skipped,{" "}
          <strong>{result.failed}</strong> failed.
        </p>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "amber" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "border-green-200 bg-green-50 text-green-800"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "red"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-gray-200 bg-white text-gray-800";
  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
