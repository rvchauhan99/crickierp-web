import { apiClient } from "@/services/apiClient";
import type {
  PlayerCreateInput,
  PlayerDetail,
  PlayerImportJobSummary,
  PlayerImportResult,
  PlayerRow,
  PlayerUpdateInput,
} from "@/types/player";
import { getAccessToken } from "./sessionStore";

function toOptionalParam(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

function parseAuditUser(
  value: unknown,
): {
  id?: string;
  name?: string;
} {
  if (typeof value === "string") return { id: value };
  if (!value || typeof value !== "object") return {};

  const row = value as Record<string, unknown>;
  const idRaw = row.id ?? row._id;
  const id = typeof idRaw === "string" ? idRaw : undefined;
  const nameCandidate = [row.fullName, row.full_name, row.username, row.name].find(
    (entry) => typeof entry === "string" && String(entry).trim() !== "",
  );
  const name = typeof nameCandidate === "string" ? nameCandidate : undefined;
  return { id, name };
}

function normalizePlayer(row: Record<string, unknown>): PlayerRow {
  const id = String(row._id ?? row.id ?? "");
  const ex = row.exchange;
  const createdByUser = parseAuditUser(row.createdBy);
  const createdByName = toOptionalParam(
    row.createdByName ?? row["created_by_name" as keyof typeof row] ?? createdByUser.name,
  );
  return {
    _id: id,
    id,
    exchange: ex as PlayerRow["exchange"],
    playerId: String(row.playerId ?? ""),
    phone: String(row.phone ?? ""),
    regularBonusPercentage: Number(row.regularBonusPercentage ?? row.bonusPercentage ?? 0),
    firstDepositBonusPercentage: Number(row.firstDepositBonusPercentage ?? 0),
    bonusPercentage: Number(row.regularBonusPercentage ?? row.bonusPercentage ?? 0),
    createdAt: row.createdAt as string | undefined,
    updatedAt: row.updatedAt as string | undefined,
    createdBy: row.createdBy,
    createdByName,
    updatedBy: row.updatedBy,
  };
}

export async function createPlayer(input: PlayerCreateInput): Promise<PlayerRow> {
  const response = await apiClient.post<{ success: boolean; data: Record<string, unknown> }>("/players", input);
  return normalizePlayer(response.data?.data ?? {});
}

export async function updatePlayer(id: string, input: PlayerUpdateInput): Promise<PlayerRow> {
  const response = await apiClient.patch<{ success: boolean; data: Record<string, unknown> }>(
    `/players/${encodeURIComponent(id)}`,
    input,
  );
  return normalizePlayer(response.data?.data ?? {});
}

/** Single player read by Mongo `_id` (e.g. from Autocomplete). */
export async function getPlayerById(
  id: string,
): Promise<PlayerDetail> {
  const response = await apiClient.get<{ success: boolean; data: Record<string, unknown> }>(`/players/${encodeURIComponent(id)}`);
  const row = response.data?.data ?? {};
  const regularBonusPercentage = Number(row.regularBonusPercentage ?? row.bonusPercentage ?? 0);
  return {
    exchange: row.exchange as PlayerRow["exchange"],
    playerId: String(row.playerId ?? ""),
    phone: String(row.phone ?? ""),
    regularBonusPercentage,
    firstDepositBonusPercentage: Number(row.firstDepositBonusPercentage ?? 0),
    bonusPercentage: regularBonusPercentage,
  };
}

export async function downloadSampleCsv(): Promise<Blob> {
  const response = await apiClient.get("/players/sample", { responseType: "blob" });
  return response.data as Blob;
}

export async function importPlayers(file: File): Promise<PlayerImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<{ success: boolean; data: PlayerImportResult }>(
    "/players/import",
    formData,
  );
  return response.data.data;
}

export async function createPlayerImportJob(file: File): Promise<{ jobId: string; status: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<{ success: boolean; data: { jobId: string; status: string } }>(
    "/players/import-jobs",
    formData,
    { timeout: 60_000 },
  );
  return response.data.data;
}

export async function getPlayerImportJob(jobId: string): Promise<PlayerImportJobSummary> {
  const response = await apiClient.get<{ success: boolean; data: PlayerImportJobSummary }>(
    `/players/import-jobs/${encodeURIComponent(jobId)}`,
    { timeout: 30_000 },
  );
  return response.data.data;
}

export async function streamPlayerImportJobEvents(
  jobId: string,
  onProgress: (payload: PlayerImportJobSummary) => void,
): Promise<() => void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Missing access token for realtime updates");
  }

  const controller = new AbortController();
  const response = await fetch(
    `${apiClient.defaults.baseURL}/players/import-jobs/${encodeURIComponent(jobId)}/events`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      credentials: "include",
    },
  );
  if (!response.ok || !response.body) {
    throw new Error("Unable to connect to import progress stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  const processChunk = (chunk: string) => {
    buffer += chunk;
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const lines = part.split("\n");
      let eventName = "message";
      let dataLine = "";
      for (const line of lines) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        if (line.startsWith("data:")) dataLine += line.slice(5).trim();
      }
      if (eventName !== "progress" || !dataLine) continue;
      try {
        const eventData = JSON.parse(dataLine) as {
          jobId: string;
          status: PlayerImportJobSummary["status"];
          totalRows: number;
          processedRows: number;
          successRows: number;
          failedRows: number;
          skippedRows: number;
          message?: string;
        };
        onProgress({
          id: eventData.jobId,
          status: eventData.status,
          fileName: "",
          failureReason: eventData.message,
          progress: {
            totalRows: eventData.totalRows,
            processedRows: eventData.processedRows,
            successRows: eventData.successRows,
            failedRows: eventData.failedRows,
            skippedRows: eventData.skippedRows,
          },
          errorSample: [],
        });
      } catch {
        // Ignore malformed events.
      }
    }
  };

  void (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        processChunk(decoder.decode(value, { stream: true }));
      }
    } catch {
      // Caller handles fallback polling.
    }
  })();

  return () => controller.abort();
}

function str(params: Record<string, unknown>, key: string): string {
  const v = params[key];
  if (v === undefined || v === null) return "";
  return String(v);
}

/**
 * Flat fetcher params (URL/snake_case keys) → API list, normalized to `{ data, meta }` for PaginatedTableReference.
 */
export async function listPlayersNormalized(params: Record<string, unknown>): Promise<{
  data: PlayerRow[];
  meta: { total: number; page: number; pageSize: number };
}> {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const sortBy = (str(params, "sortBy") || "createdAt") as "createdAt" | "playerId" | "phone" | "bonusPercentage";
  const sortOrder = str(params, "sortOrder") === "asc" ? "asc" : "desc";

  const response = await apiClient.get<{
    success: boolean;
    data: Record<string, unknown>[];
    meta: { total: number; page: number; pageSize: number };
  }>("/players", {
    params: {
      page,
      pageSize: limit,
      sortBy,
      sortOrder,
      search: toOptionalParam(str(params, "q")) || undefined,
      playerId: toOptionalParam(str(params, "playerId")),
      playerId_op: toOptionalParam(str(params, "playerId_op")),
      phone: toOptionalParam(str(params, "phone")),
      phone_op: toOptionalParam(str(params, "phone_op")),
      exchangeName: toOptionalParam(str(params, "exchangeName")),
      exchangeName_op: toOptionalParam(str(params, "exchangeName_op")),
      exchangeId: toOptionalParam(str(params, "exchangeId")),
      createdBy: toOptionalParam(str(params, "createdBy")),
      createdAt_from: toOptionalParam(str(params, "createdAt_from")),
      createdAt_to: toOptionalParam(str(params, "createdAt_to")),
      createdAt_op: toOptionalParam(str(params, "createdAt_op")),
      bonusPercentage: toOptionalParam(str(params, "bonusPercentage")),
      bonusPercentage_to: toOptionalParam(str(params, "bonusPercentage_to")),
      bonusPercentage_op: toOptionalParam(str(params, "bonusPercentage_op")),
    },
  });

  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  const meta = response.data?.meta;
  return {
    data: rows.map((row) => normalizePlayer(row)),
    meta: {
      total: Number(meta?.total ?? 0),
      page: Number(meta?.page ?? page),
      pageSize: Number(meta?.pageSize ?? limit),
    },
  };
}

export async function exportPlayers(params: Record<string, unknown>): Promise<Blob> {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const sortBy = (str(params, "sortBy") || "createdAt") as "createdAt" | "playerId" | "phone" | "bonusPercentage";
  const sortOrder = str(params, "sortOrder") === "asc" ? "asc" : "desc";

  const response = await apiClient.get("/players/export", {
    params: {
      page,
      pageSize: limit,
      sortBy,
      sortOrder,
      search: toOptionalParam(str(params, "q")) || undefined,
      playerId: toOptionalParam(str(params, "playerId")),
      playerId_op: toOptionalParam(str(params, "playerId_op")),
      phone: toOptionalParam(str(params, "phone")),
      phone_op: toOptionalParam(str(params, "phone_op")),
      exchangeName: toOptionalParam(str(params, "exchangeName")),
      exchangeName_op: toOptionalParam(str(params, "exchangeName_op")),
      exchangeId: toOptionalParam(str(params, "exchangeId")),
      createdBy: toOptionalParam(str(params, "createdBy")),
      createdAt_from: toOptionalParam(str(params, "createdAt_from")),
      createdAt_to: toOptionalParam(str(params, "createdAt_to")),
      createdAt_op: toOptionalParam(str(params, "createdAt_op")),
      bonusPercentage: toOptionalParam(str(params, "bonusPercentage")),
      bonusPercentage_to: toOptionalParam(str(params, "bonusPercentage_to")),
      bonusPercentage_op: toOptionalParam(str(params, "bonusPercentage_op")),
    },
    responseType: "blob",
  });
  return response.data as Blob;
}
