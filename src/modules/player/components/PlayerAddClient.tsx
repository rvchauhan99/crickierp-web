"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { IconCheck, IconX } from "@tabler/icons-react";
import { AutocompleteField, type AutocompleteOption } from "@/components/common/AutocompleteField";
import { FormActions, FormContainer } from "@/components/common/FormContainer";
import { FormGrid } from "@/components/common/FormGrid";
import { FieldLabel } from "@/components/common/FieldLabel";
import { FieldError } from "@/components/common/FieldError";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { listExchanges } from "@/services/exchangeService";
import { createPlayer, downloadSampleCsv, importPlayers } from "@/services/playerService";
import { formatImportErrorToast, getApiErrorMessage } from "@/lib/apiError";

export function PlayerAddClient() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [exchangeId, setExchangeId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [phone, setPhone] = useState("");
  const [regularBonusPct, setRegularBonusPct] = useState("0");
  const [firstDepositBonusPct, setFirstDepositBonusPct] = useState("0");
  const [manualErrors, setManualErrors] = useState<{
    exchangeId?: string;
    playerId?: string;
    phone?: string;
    regularBonusPercentage?: string;
    firstDepositBonusPercentage?: string;
  }>({});
  const [manualLoading, setManualLoading] = useState(false);

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadExchangeOptions = useCallback(async (query: string): Promise<AutocompleteOption[]> => {
    try {
      const result = await listExchanges({
        page: 1,
        limit: 25,
        q: query || undefined,
        sortBy: "name",
        sortOrder: "asc",
      });
      return result.items.map((ex) => ({
        value: ex.id,
        label: `${ex.name} (${ex.provider})`,
      }));
    } catch {
      return [];
    }
  }, []);

  const resetManual = () => {
    setExchangeId("");
    setPlayerId("");
    setPhone("");
    setRegularBonusPct("0");
    setFirstDepositBonusPct("0");
    setManualErrors({});
  };

  const onManualSave = async () => {
    const next: typeof manualErrors = {};
    if (!exchangeId.trim()) next.exchangeId = "Exchange is required.";
    if (!playerId.trim()) next.playerId = "Player Id is required.";
    if (!phone.trim()) next.phone = "Phone number is required.";
    const regularBonus = Number(regularBonusPct);
    if (regularBonusPct.trim() === "" || Number.isNaN(regularBonus)) {
      next.regularBonusPercentage = "Regular bonus percentage is required.";
    } else if (regularBonus < 0 || regularBonus > 100) {
      next.regularBonusPercentage = "Regular bonus percentage must be between 0 and 100.";
    }

    const firstDepositBonus = Number(firstDepositBonusPct);
    if (firstDepositBonusPct.trim() === "" || Number.isNaN(firstDepositBonus)) {
      next.firstDepositBonusPercentage = "First deposit bonus percentage is required.";
    } else if (firstDepositBonus < 0 || firstDepositBonus > 100) {
      next.firstDepositBonusPercentage = "First deposit bonus percentage must be between 0 and 100.";
    }
    setManualErrors(next);
    if (Object.keys(next).length > 0) return;

    setManualLoading(true);
    try {
      await createPlayer({
        exchangeId: exchangeId.trim(),
        playerId: playerId.trim(),
        phone: phone.trim(),
        regularBonusPercentage: regularBonus,
        firstDepositBonusPercentage: firstDepositBonus,
      });
      toast.success("Player saved successfully.");
      resetManual();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to save player"));
    } finally {
      setManualLoading(false);
    }
  };

  const onBulkSave = async () => {
    if (!bulkFile) {
      toast.error("Choose a CSV or Excel file.");
      return;
    }
    setBulkLoading(true);
    try {
      const result = await importPlayers(bulkFile);
      const parts = [
        `Created ${result.created} player${result.created === 1 ? "" : "s"}.`,
        `Updated ${result.updated} player${result.updated === 1 ? "" : "s"}.`,
      ];
      if (result.skipped > 0) {
        parts.push(`${result.skipped} empty row${result.skipped === 1 ? "" : "s"} skipped.`);
      }
      toast.success(parts.join(" "));
      setBulkFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: unknown) {
      const { title, description } = formatImportErrorToast(error, "Import failed");
      if (description) {
        toast.error(title, { description });
      } else {
        toast.error(title);
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const onDownloadSample = async () => {
    try {
      const blob = await downloadSampleCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "players-sample.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Sample CSV downloaded.");
    } catch {
      toast.error("Failed to download sample CSV.");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 pb-4">
      <FormContainer
        title="Add Exchange Player"
        description="Register a single player against an exchange."
        contentOverflow="visible"
        className="flex-none"
      >
        <FormGrid>
          <div>
            <FieldLabel>Exchange *</FieldLabel>
            <AutocompleteField
              value={exchangeId}
              onChange={setExchangeId}
              loadOptions={loadExchangeOptions}
              placeholder="search..."
            />
            <FieldError message={manualErrors.exchangeId} />
          </div>
          <div>
            <FieldLabel>Player Id *</FieldLabel>
            <Input placeholder="id" value={playerId} onChange={(e) => setPlayerId(e.target.value)} />
            <FieldError message={manualErrors.playerId} />
          </div>
          <div>
            <FieldLabel>Phone Number *</FieldLabel>
            <Input
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <FieldError message={manualErrors.phone} />
          </div>
          <div>
            <FieldLabel>Regular Bonus Percentage *</FieldLabel>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              placeholder="0"
              value={regularBonusPct}
              onChange={(e) => setRegularBonusPct(e.target.value)}
            />
            <FieldError message={manualErrors.regularBonusPercentage} />
          </div>
          <div>
            <FieldLabel>First Deposit Bonus Percentage *</FieldLabel>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              placeholder="0"
              value={firstDepositBonusPct}
              onChange={(e) => setFirstDepositBonusPct(e.target.value)}
            />
            <FieldError message={manualErrors.firstDepositBonusPercentage} />
          </div>
        </FormGrid>
        <FormActions className="justify-between px-5 py-4">
          <Button
            type="button"
            variant="success"
            leftIcon={<IconCheck size={18} />}
            onClick={onManualSave}
            disabled={manualLoading}
          >
            {manualLoading ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="danger" leftIcon={<IconX size={18} />} onClick={resetManual} disabled={manualLoading}>
            Cancel
          </Button>
        </FormActions>
      </FormContainer>

      <FormContainer
        title="Bulk upload"
        description="Upload a CSV or Excel file. Each row must include exchange name, player id, phone, bonus_percentage (regular bonus), and first_deposit_bonus_percentage (0–100; leave empty for 0). Use the sample file as a template. If any row is invalid, nothing is imported."
        className="flex-none"
      >
        <div className="space-y-2">
          <div>
            <FieldLabel>Player file (CSV or Excel) *</FieldLabel>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="block w-full text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-md file:border file:border-[var(--border)] file:bg-white file:px-3 file:py-1.5"
              onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={onDownloadSample}
              className="mt-2 text-sm font-medium text-[var(--brand-primary)] underline underline-offset-2 hover:opacity-90"
            >
              Download sample CSV
            </button>
          </div>
        </div>
        <FormActions className="justify-between px-5 py-3">
          <Button
            type="button"
            variant="success"
            leftIcon={<IconCheck size={18} />}
            onClick={onBulkSave}
            disabled={bulkLoading}
          >
            {bulkLoading ? "Uploading…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="danger"
            leftIcon={<IconX size={18} />}
            onClick={() => {
              setBulkFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            disabled={bulkLoading}
          >
            Cancel
          </Button>
        </FormActions>
      </FormContainer>
    </div>
  );
}
